import React from 'react';
import { CommitDetail } from '../types';
import { FileDiffBlock } from './FileDiffBlock';

interface DiffViewerProps {
  commit: CommitDetail;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ commit }) => {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-fg-default mb-2">{commit.commit.message.split('\n')[0]}</h1>
        <div className="flex items-center gap-4 text-sm text-fg-muted">
          <div className="flex items-center gap-2">
            <img 
              src={commit.author?.avatar_url || ''} 
              className="w-5 h-5 rounded-full bg-border-default"
              alt=""
            />
            <span className="font-medium text-fg-default">{commit.commit.author.name}</span>
            <span>committed on {new Date(commit.commit.author.date).toLocaleDateString()}</span>
          </div>
          <div className="font-mono text-xs bg-canvas-subtle px-2 py-1 rounded border border-border-default">
            {commit.sha.substring(0, 7)}
          </div>
        </div>
        
        {commit.commit.message.split('\n').length > 1 && (
          <div className="mt-4 p-3 bg-canvas-subtle rounded text-sm text-fg-muted whitespace-pre-wrap font-mono">
            {commit.commit.message.split('\n').slice(1).join('\n').trim()}
          </div>
        )}
      </div>

      <div className="space-y-4">
        {commit.files.map((file) => (
          <FileDiffBlock key={file.filename} file={file} />
        ))}
      </div>
    </div>
  );
};