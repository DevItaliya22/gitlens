import { Branch, Commit, CommitDetail, TreeResponse } from '../types';

const BASE_URL = 'https://api.github.com';

// Helper to handle errors
const fetchAPI = async <T>(url: string): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github.v3+json',
    },
  });
  
  if (!response.ok) {
    if (response.status === 403) {
      throw new Error("API Rate Limit Exceeded. Please try again later.");
    }
    if (response.status === 404) {
      throw new Error("Resource not found. Check the repo name.");
    }
    throw new Error(`GitHub API Error: ${response.statusText}`);
  }
  return response.json();
};

export const getBranches = async (owner: string, repo: string): Promise<Branch[]> => {
  return fetchAPI<Branch[]>(`${BASE_URL}/repos/${owner}/${repo}/branches`);
};

export const getCommits = async (owner: string, repo: string, sha: string, page = 1, perPage = 20): Promise<Commit[]> => {
  return fetchAPI<Commit[]>(`${BASE_URL}/repos/${owner}/${repo}/commits?sha=${sha}&per_page=${perPage}&page=${page}`);
};

export const getCommitDetail = async (owner: string, repo: string, sha: string): Promise<CommitDetail> => {
  return fetchAPI<CommitDetail>(`${BASE_URL}/repos/${owner}/${repo}/commits/${sha}`);
};

export const getTree = async (owner: string, repo: string, sha: string): Promise<TreeResponse> => {
  return fetchAPI<TreeResponse>(`${BASE_URL}/repos/${owner}/${repo}/git/trees/${sha}?recursive=1`);
};

export const getFileContent = async (owner: string, repo: string, sha: string): Promise<string> => {
  // We use the raw header or fetch the blob. For simplicity in browser, let's use the blob API 
  // but it returns base64. 
  const blobData: { content: string, encoding: string } = await fetchAPI(`${BASE_URL}/repos/${owner}/${repo}/git/blobs/${sha}`);
  
  if (blobData.encoding === 'base64') {
    return atob(blobData.content);
  }
  return blobData.content;
};
