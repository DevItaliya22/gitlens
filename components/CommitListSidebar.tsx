import React from 'react';
import { Commit } from '../types';
import { GitCommit, Clock } from './Icons';
import { formatDistanceToNow } from 'date-fns';

interface CommitListSidebarProps {
  commits: Commit[];
  selectedSha?: string;
  onSelectCommit: (sha: string) => void;
  isLoading: boolean;
  onLoadMore: () => void;
  hasMore: boolean;
}

export const CommitListSidebar: React.FC<CommitListSidebarProps> = ({
  commits,
  selectedSha,
  onSelectCommit,
  isLoading,
  onLoadMore,
  hasMore
}) => {
  return (
    <div className="flex flex-col h-full border-r border-border-default bg-canvas-subtle w-80 flex-shrink-0">
      <div className="p-3 border-b border-border-default bg-canvas-default sticky top-0 z-10">
        <h2 className="text-sm font-semibold text-fg-default flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Commit History
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {commits.length === 0 && !isLoading && (
          <div className="p-4 text-center text-fg-muted text-sm">
            No commits found.
          </div>
        )}

        <ul className="divide-y divide-border-muted">
          {commits.map((commit) => {
            const isSelected = commit.sha === selectedSha;
            return (
              <li key={commit.sha}>
                <button
                  onClick={() => onSelectCommit(commit.sha)}
                  className={`w-full text-left p-3 hover:bg-canvas-overlay transition-colors group ${
                    isSelected ? 'bg-[#1f2937] border-l-2 border-blue-500' : 'border-l-2 border-transparent'
                  }`}
                >
                  <p className="text-sm font-medium text-fg-default truncate mb-1" title={commit.commit.message}>
                    {commit.commit.message.split('\n')[0]}
                  </p>
                  <div className="flex items-center justify-between text-xs text-fg-muted">
                    <div className="flex items-center gap-1.5">
                      {commit.author?.avatar_url ? (
                        <img 
                          src={commit.author.avatar_url} 
                          alt="" 
                          className="w-4 h-4 rounded-full"
                        />
                      ) : (
                        <div className="w-4 h-4 rounded-full bg-border-default" />
                      )}
                      <span className="truncate max-w-[80px]">{commit.commit.author.name}</span>
                    </div>
                    <span>
                      {formatDistanceToNow(new Date(commit.commit.author.date), { addSuffix: true })}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-fg-muted opacity-60 group-hover:opacity-100">
                    <GitCommit className="w-3 h-3" />
                    {commit.sha.substring(0, 7)}
                  </div>
                </button>
              </li>
            );
          })}
        </ul>

        {hasMore && (
          <div className="p-2">
            <button 
              onClick={onLoadMore}
              disabled={isLoading}
              className="w-full py-2 text-xs text-blue-400 hover:text-blue-300 disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : 'Load more commits'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};