
export const getLanguageFromFilename = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'js': case 'jsx': case 'mjs': case 'cjs': return 'javascript';
    case 'ts': case 'tsx': return 'typescript';
    case 'html': return 'html';
    case 'css': case 'scss': case 'less': return 'css';
    case 'json': return 'json';
    case 'md': case 'markdown': return 'markdown';
    case 'py': return 'python';
    case 'go': return 'go';
    case 'java': return 'java';
    case 'c': case 'h': return 'c';
    case 'cpp': case 'hpp': case 'cc': return 'cpp';
    case 'cs': return 'csharp';
    case 'sh': case 'bash': case 'zsh': return 'bash';
    case 'yml': case 'yaml': return 'yaml';
    case 'xml': case 'svg': return 'xml';
    case 'sql': return 'sql';
    case 'rs': return 'rust';
    case 'rb': return 'ruby';
    case 'php': return 'php';
    default: return 'clike';
  }
};
