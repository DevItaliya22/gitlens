export interface GitHubUser {
  login: string;
  avatar_url: string;
}

export interface CommitAuthor {
  name: string;
  email: string;
  date: string;
}

export interface CommitInfo {
  author: CommitAuthor;
  message: string;
  tree: {
    sha: string;
    url: string;
  };
}

export interface Commit {
  sha: string;
  node_id: string;
  commit: CommitInfo;
  author: GitHubUser | null;
  html_url: string;
  parents: { sha: string }[];
}

export interface Branch {
  name: string;
  commit: {
    sha: string;
    url: string;
  };
}

export interface FileDiff {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed' | 'copied' | 'changed' | 'unchanged';
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch?: string; // The diff string
}

export interface CommitDetail extends Commit {
  files: FileDiff[];
  stats: {
    additions: number;
    deletions: number;
    total: number;
  };
}

export interface TreeItem {
  path: string;
  mode: string;
  type: 'blob' | 'tree';
  sha: string;
  size?: number;
  url: string;
}

export interface TreeResponse {
  sha: string;
  url: string;
  tree: TreeItem[];
  truncated: boolean;
}

export enum ViewMode {
  DIFF = 'DIFF',
  SNAPSHOT = 'SNAPSHOT',
}

export interface RepoContextState {
  owner: string;
  repo: string;
  branch: string;
}
