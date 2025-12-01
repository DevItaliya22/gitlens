import React, { useState } from 'react';
import Prism from 'prismjs';
import { FileDiff } from '../types';
import { ChevronRight } from './Icons';
import { getLanguageFromFilename } from '../utils/prismMapping';

interface FileDiffBlockProps {
  file: FileDiff;
  defaultExpanded?: boolean;
}

export const FileDiffBlock: React.FC<FileDiffBlockProps> = ({ file, defaultExpanded = true }) => {
  const [isCollapsed, setIsCollapsed] = useState(!defaultExpanded);

  const renderPatch = (patch: string, filename: string) => {
    if (!patch) return <div className="p-4 text-fg-muted text-sm italic">Binary file or no changes shown.</div>;
    
    const lines = patch.split('\n');
    const language = getLanguageFromFilename(filename);

    return (
      <div className="overflow-x-auto text-xs font-mono leading-5">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((line, idx) => {
              let bgClass = '';
              let textClass = 'text-fg-default';
              let codeContent = line;
              let marker = '';

              if (line.startsWith('+')) {
                bgClass = 'bg-diff-add';
                textClass = 'text-fg-default';
                marker = '+';
                codeContent = line.substring(1);
              } else if (line.startsWith('-')) {
                bgClass = 'bg-diff-del';
                textClass = 'text-fg-default';
                marker = '-';
                codeContent = line.substring(1);
              } else if (line.startsWith('@@')) {
                bgClass = 'bg-[#161b22] text-[#8b949e]';
                textClass = 'text-[#8b949e]';
                // Chunk headers don't get syntax highlighting
              } else {
                 // Context line
                 if (line.startsWith(' ')) {
                    marker = ' ';
                    codeContent = line.substring(1);
                 }
              }

              // Highlight the code content
              let highlightedCode = codeContent;
              if (!line.startsWith('@@') && Prism && Prism.languages) {
                try {
                   const grammar = Prism.languages[language] || Prism.languages.clike || Prism.languages.javascript;
                   if (grammar) {
                      highlightedCode = Prism.highlight(
                        codeContent, 
                        grammar, 
                        language
                      );
                   }
                } catch (e) {
                   // Fallback to plain text if highlight fails
                }
              }

              return (
                <tr key={idx} className={`${bgClass}`}>
                  <td className="select-none w-8 text-right pr-3 text-fg-muted opacity-50 border-r border-border-muted bg-canvas-subtle whitespace-pre">
                   {/* Line numbers would go here */}
                  </td>
                  <td className={`pl-2 whitespace-pre ${textClass}`}>
                    {marker && <span className="select-none opacity-60 mr-1 inline-block w-3">{marker}</span>}
                    <span dangerouslySetInnerHTML={{ __html: highlightedCode }} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="border border-border-default rounded-md overflow-hidden bg-canvas-default">
      <div 
        className="flex items-center justify-between p-2 bg-canvas-subtle border-b border-border-default cursor-pointer hover:bg-canvas-overlay"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-fg-default">
          <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
          <span className="text-fg-muted font-normal">{file.filename}</span>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="text-diff-addText">+{file.additions}</span>
          <span className="text-diff-delText">-{file.deletions}</span>
        </div>
      </div>
      
      {!isCollapsed && (
        <div className="bg-canvas-default">
          {renderPatch(file.patch || '', file.filename)}
        </div>
      )}
    </div>
  );
};