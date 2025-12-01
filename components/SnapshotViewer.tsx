
import React, { useEffect, useState, useMemo } from 'react';
import { getTree, getFileContent } from '../services/githubService';
import { TreeItem, CommitDetail, FileDiff } from '../types';
import { File, Folder, ChevronRight, Code, List, ArrowLeft } from './Icons';
import { CodeBlock } from './CodeBlock';
import { FileDiffBlock } from './FileDiffBlock';
import { getLanguageFromFilename } from '../utils/prismMapping';

interface SnapshotViewerProps {
  owner: string;
  repo: string;
  commit: CommitDetail;
}

// Map file status to color
const getStatusColor = (status?: string) => {
  switch (status) {
    case 'added': return 'text-green-400';
    case 'modified': return 'text-yellow-400';
    case 'renamed': return 'text-yellow-400';
    case 'removed': return 'text-red-400 line-through opacity-60';
    default: return 'text-fg-default'; 
  }
};

const buildTreeHierarchy = (items: TreeItem[]) => {
  const root: any = {};
  items.forEach(item => {
    const parts = item.path.split('/');
    let current = root;
    parts.forEach((part, index) => {
      if (!current[part]) {
        current[part] = {
          name: part,
          path: item.path,
          type: index === parts.length - 1 ? item.type : 'tree',
          children: {},
          item: index === parts.length - 1 ? item : null
        };
      }
      current = current[part].children;
    });
  });
  return root;
};

const TreeNode: React.FC<{ 
  node: any; 
  depth?: number; 
  onSelect: (item: TreeItem) => void; 
  selectedPath?: string;
  changedFiles: Map<string, string>; // path -> status
  folderStatuses: Map<string, string>; // path -> status (for folders)
  currentFullPath: string; // builds up path for folder lookup
}> = ({ node, depth = 0, onSelect, selectedPath, changedFiles, folderStatuses, currentFullPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const hasChildren = Object.keys(node.children).length > 0;
  const isSelected = node.item && node.item.path === selectedPath;
  
  // Construct path for this node to lookup in folderStatuses
  // Use node.item.path for files, or construct it for intermediate folders
  // Logic: The 'node' passed here is part of the recursive structure. 
  // We need to know the full path to check folderStatuses.
  // Actually, 'node.path' exists on leaves, but for intermediate folders created in buildTreeHierarchy, 
  // we didn't explicitly set 'path' unless it was a real tree item.
  // Let's rely on the fact that we can reconstruct it or if we stored it.
  
  // Re-deriving path logic:
  const nodePath = node.item ? node.item.path : (currentFullPath ? `${currentFullPath}/${node.name}` : node.name);

  // Check status
  let status = undefined;
  if (hasChildren) {
    // It's a folder
    status = folderStatuses.get(nodePath);
    // Auto-expand if folder is modified/added to help discovery? Optional.
  } else {
    // It's a file
    status = changedFiles.get(nodePath);
  }

  const statusColor = status ? getStatusColor(status) : 'text-fg-muted';

  const handleClick = () => {
    if (hasChildren) {
      setIsOpen(!isOpen);
    } else if (node.item) {
      onSelect(node.item);
    }
  };

  return (
    <div>
      <div 
        className={`
          flex items-center gap-1 py-1 px-2 cursor-pointer hover:bg-canvas-overlay text-sm truncate select-none
          ${isSelected ? 'bg-blue-500/20' : ''}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        <span className="opacity-70 text-fg-muted">
          {hasChildren ? (
            <ChevronRight className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
          ) : (
            <div className="w-3" />
          )}
        </span>
        <span className="opacity-70 text-fg-muted">
          {hasChildren ? (
             <Folder className={`w-3.5 h-3.5 ${status ? statusColor : 'text-blue-300'}`} />
          ) : (
             <File className="w-3.5 h-3.5" />
          )}
        </span>
        <span className={`${isSelected ? 'font-medium' : ''} ${status ? statusColor : 'text-fg-default'} ml-1`}>
          {node.name}
        </span>
        {status && <span className={`ml-2 text-[9px] opacity-70 uppercase font-mono border border-current px-1 rounded ${statusColor}`}>{status[0]}</span>}
      </div>
      {isOpen && hasChildren && (
        <div>
          {Object.values(node.children).sort((a: any, b: any) => {
             const aIsFolder = Object.keys(a.children).length > 0;
             const bIsFolder = Object.keys(b.children).length > 0;
             if (aIsFolder && !bIsFolder) return -1;
             if (!aIsFolder && bIsFolder) return 1;
             return a.name.localeCompare(b.name);
          }).map((child: any) => (
            <TreeNode 
              key={child.name} 
              node={child} 
              depth={depth + 1} 
              onSelect={onSelect}
              selectedPath={selectedPath}
              changedFiles={changedFiles}
              folderStatuses={folderStatuses}
              currentFullPath={nodePath}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const SnapshotViewer: React.FC<SnapshotViewerProps> = ({ owner, repo, commit }) => {
  const [treeItems, setTreeItems] = useState<TreeItem[]>([]);
  const [loadingTree, setLoadingTree] = useState(false);
  const [selectedFile, setSelectedFile] = useState<TreeItem | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [activeTab, setActiveTab] = useState<'source' | 'diff'>('source');

  // Map of changed files: path -> status
  const changedFilesMap = useMemo(() => {
    const map = new Map<string, string>();
    commit.files.forEach(f => map.set(f.filename, f.status));
    return map;
  }, [commit]);

  // Map of folder statuses
  const folderStatusesMap = useMemo(() => {
    const map = new Map<string, string>();
    const folderStatusSets = new Map<string, Set<string>>();

    commit.files.forEach(file => {
      const parts = file.filename.split('/');
      // Walk up the path
      let currentPath = '';
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (!folderStatusSets.has(currentPath)) {
          folderStatusSets.set(currentPath, new Set());
        }
        folderStatusSets.get(currentPath)?.add(file.status);
      }
    });

    // Resolve sets to single status
    folderStatusSets.forEach((statuses, path) => {
      if (statuses.has('modified') || statuses.has('renamed') || statuses.has('changed')) {
        map.set(path, 'modified');
      } else if (statuses.has('added') && statuses.has('removed')) {
        map.set(path, 'modified');
      } else if (statuses.has('added')) {
        map.set(path, 'added');
      } else if (statuses.has('removed')) {
        map.set(path, 'removed');
      }
    });

    return map;
  }, [commit]);

  // List of navigable changed files (exclude removed as they aren't in the tree usually)
  const navigableChangedFiles = useMemo(() => {
    return commit.files
      .filter(f => f.status !== 'removed')
      .map(f => f.filename);
  }, [commit]);

  // Calculate Next/Prev changed file
  const currentChangedFileIndex = selectedFile ? navigableChangedFiles.indexOf(selectedFile.path) : -1;
  const prevChangedFile = currentChangedFileIndex > 0 ? navigableChangedFiles[currentChangedFileIndex - 1] : null;
  const nextChangedFile = currentChangedFileIndex !== -1 && currentChangedFileIndex < navigableChangedFiles.length - 1 
    ? navigableChangedFiles[currentChangedFileIndex + 1] 
    : (currentChangedFileIndex === -1 && navigableChangedFiles.length > 0 ? navigableChangedFiles[0] : null); // Default to first if none selected

  const jumpToRes = (path: string) => {
    // Find item in treeItems
    const item = treeItems.find(t => t.path === path);
    if (item) {
      setSelectedFile(item);
    }
  };

  // Find the diff object for the selected file if it exists
  const selectedFileDiff = useMemo(() => {
    if (!selectedFile) return null;
    return commit.files.find(f => f.filename === selectedFile.path);
  }, [selectedFile, commit]);

  useEffect(() => {
    const fetchTree = async () => {
      setLoadingTree(true);
      try {
        const response = await getTree(owner, repo, commit.sha);
        setTreeItems(response.tree);
      } catch (err) {
        console.error("Failed to load file tree.", err);
      } finally {
        setLoadingTree(false);
      }
    };
    if (commit.sha) fetchTree();
  }, [owner, repo, commit.sha]);

  useEffect(() => {
    const fetchContent = async () => {
      if (!selectedFile || selectedFile.type !== 'blob') return;
      
      // Default to source view on file change
      setActiveTab('source');

      const ext = selectedFile.path.split('.').pop()?.toLowerCase();
      if (['png','jpg','jpeg','gif','ico','pdf','zip','woff','woff2'].includes(ext || '')) {
        setFileContent("Preview not available for binary files.");
        return;
      }

      setLoadingContent(true);
      try {
        const content = await getFileContent(owner, repo, selectedFile.sha);
        setFileContent(content);
      } catch (err) {
        setFileContent("Error loading file content.");
      } finally {
        setLoadingContent(false);
      }
    };
    fetchContent();
  }, [selectedFile, owner, repo]);

  const hierarchy = useMemo(() => buildTreeHierarchy(treeItems), [treeItems]);

  return (
    <div className="flex flex-1 h-full overflow-hidden">
      {/* File Tree Sidebar */}
      <div className="w-80 flex-shrink-0 border-r border-border-default bg-canvas-subtle overflow-y-auto custom-scrollbar flex flex-col">
        <div className="p-3 text-xs font-semibold text-fg-muted uppercase tracking-wider border-b border-border-default sticky top-0 bg-canvas-subtle z-10 flex justify-between items-center">
          <span>Files at {commit.sha.substring(0, 7)}</span>
        </div>
        
        {/* Helper text for navigation */}
        {navigableChangedFiles.length > 0 && (
          <div className="px-3 py-2 bg-canvas-overlay border-b border-border-muted text-[10px] text-fg-muted">
            <span className="font-semibold text-fg-default">{navigableChangedFiles.length}</span> changed files in this commit.
          </div>
        )}

        {loadingTree ? (
          <div className="p-4 text-xs text-fg-muted">Loading tree...</div>
        ) : (
          <div className="py-2">
             {Object.values(hierarchy).sort((a: any, b: any) => {
                 const aIsFolder = Object.keys(a.children).length > 0;
                 const bIsFolder = Object.keys(b.children).length > 0;
                 if (aIsFolder && !bIsFolder) return -1;
                 if (!aIsFolder && bIsFolder) return 1;
                 return a.name.localeCompare(b.name);
             }).map((node: any) => (
               <TreeNode 
                  key={node.path || node.name} 
                  node={node} 
                  onSelect={setSelectedFile}
                  selectedPath={selectedFile?.path}
                  changedFiles={changedFilesMap}
                  folderStatuses={folderStatusesMap}
                  currentFullPath=""
               />
             ))}
          </div>
        )}
      </div>

      {/* Code Viewer */}
      <div className="flex-1 overflow-y-auto bg-canvas-default custom-scrollbar relative flex flex-col">
        {selectedFile ? (
          <>
            <div className="sticky top-0 z-10 bg-canvas-default border-b border-border-default px-4 py-2 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2 overflow-hidden flex-1 mr-4">
                <File className="w-4 h-4 text-fg-muted shrink-0" />
                <span className="text-sm font-medium text-fg-default truncate" title={selectedFile.path}>{selectedFile.path}</span>
                <span className="text-xs text-fg-muted whitespace-nowrap">({selectedFile.size} bytes)</span>
              </div>
              
              <div className="flex items-center gap-4">
                {/* Navigation Buttons */}
                <div className="flex items-center bg-canvas-subtle rounded border border-border-default overflow-hidden">
                   <button 
                     onClick={() => prevChangedFile && jumpToRes(prevChangedFile)}
                     disabled={!prevChangedFile}
                     className="px-2 py-1 hover:bg-canvas-overlay disabled:opacity-30 border-r border-border-default transition-colors"
                     title="Previous changed file"
                   >
                     <ArrowLeft className="w-3.5 h-3.5" />
                   </button>
                   <button 
                     onClick={() => nextChangedFile && jumpToRes(nextChangedFile)}
                     disabled={!nextChangedFile}
                     className="px-2 py-1 hover:bg-canvas-overlay disabled:opacity-30 transition-colors"
                     title="Next changed file"
                   >
                     <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                   </button>
                </div>

                {/* Toggle Tabs if file has changes */}
                {selectedFileDiff && (
                  <div className="flex bg-canvas-subtle rounded-md border border-border-default p-0.5">
                    <button
                      onClick={() => setActiveTab('source')}
                      className={`px-3 py-1 text-xs font-medium rounded-sm flex items-center gap-2 transition-colors ${
                        activeTab === 'source'
                          ? 'bg-blue-600 text-white' 
                          : 'text-fg-muted hover:text-fg-default'
                      }`}
                    >
                      <Code className="w-3.5 h-3.5" />
                      Source
                    </button>
                    <button
                      onClick={() => setActiveTab('diff')}
                      className={`px-3 py-1 text-xs font-medium rounded-sm flex items-center gap-2 transition-colors ${
                        activeTab === 'diff' 
                          ? 'bg-blue-600 text-white' 
                          : 'text-fg-muted hover:text-fg-default'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" />
                      Diff
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex-1 overflow-auto custom-scrollbar relative">
              {activeTab === 'diff' && selectedFileDiff ? (
                <div className="p-4">
                   <FileDiffBlock file={selectedFileDiff} defaultExpanded={true} />
                </div>
              ) : (
                <div className="p-4">
                  {loadingContent ? (
                    <div className="text-sm text-fg-muted animate-pulse">Loading content...</div>
                  ) : (
                    <CodeBlock 
                      code={fileContent || ''} 
                      language={getLanguageFromFilename(selectedFile.path)} 
                    />
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-fg-muted">
            <div className="flex flex-col items-center gap-4 max-w-sm text-center">
              <Code className="w-12 h-12 mb-2 opacity-20" />
              <p>Select a file to view its contents.</p>
              
              {navigableChangedFiles.length > 0 && (
                <button 
                  onClick={() => navigableChangedFiles[0] && jumpToRes(navigableChangedFiles[0])}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded transition-colors"
                >
                  View first change ({navigableChangedFiles[0].split('/').pop()})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
