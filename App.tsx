import React, { useState, useEffect } from "react";
import {
  HashRouter,
  Routes,
  Route,
  useNavigate,
  useParams,
  Navigate,
} from "react-router-dom";
import {
  getBranches,
  getCommits,
  getCommitDetail,
  getGitHubProfile,
  getUserRepos,
} from "./services/githubService";
import {
  Commit,
  Branch,
  ViewMode,
  CommitDetail,
  GitHubProfile,
  GitHubRepo,
} from "./types";
import { CommitListSidebar } from "./components/CommitListSidebar";
import { DiffViewer } from "./components/DiffViewer";
import { SnapshotViewer } from "./components/SnapshotViewer";
import { Button } from "./components/Button";
import {
  GitBranch,
  Search,
  Layout,
  List,
  ArrowLeft,
  GitCommit,
  ChevronLeft,
  ChevronRight,
} from "./components/Icons";

const SAVED_PROFILES_KEY = "gitlens.savedProfiles";

// --- Components for Routes ---

const LandingPage = () => {
  const [repoInput, setRepoInput] = useState("");
  const [profileInput, setProfileInput] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<GitHubProfile[]>([]);
  const [isAddingProfile, setIsAddingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const rawProfiles = localStorage.getItem(SAVED_PROFILES_KEY);
      if (!rawProfiles) return;
      const parsedProfiles = JSON.parse(rawProfiles) as GitHubProfile[];
      setSavedProfiles(parsedProfiles);
    } catch {
      setSavedProfiles([]);
    }
  }, []);

  const persistProfiles = (profiles: GitHubProfile[]) => {
    localStorage.setItem(SAVED_PROFILES_KEY, JSON.stringify(profiles));
    setSavedProfiles(profiles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    // Handle 'owner/repo' or full URL
    let path = repoInput.trim();
    if (path.includes("github.com/")) {
      path = path.split("github.com/")[1];
    }
    // Remove trailing slashes or .git
    path = path.replace(/\/$/, "").replace(/\.git$/, "");

    navigate(`/repo/${path}`);
  };

  const handleAddProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const username = profileInput.trim().replace(/^@/, "");
    if (!username) return;

    setIsAddingProfile(true);
    setProfileError(null);
    try {
      const profile = await getGitHubProfile(username);
      const alreadySaved = savedProfiles.some(
        (existingProfile) =>
          existingProfile.login.toLowerCase() === profile.login.toLowerCase(),
      );

      if (alreadySaved) {
        setProfileError("Profile already added.");
        return;
      }

      const updatedProfiles = [profile, ...savedProfiles];
      persistProfiles(updatedProfiles);
      setProfileInput("");
    } catch (error: any) {
      setProfileError(error?.message || "Unable to find this GitHub profile.");
    } finally {
      setIsAddingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas-default text-fg-default p-4 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white shadow-lg shadow-black/30">
            <GitCommit className="w-9 h-9 text-black" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            GitLens Explorer
          </h1>
          <p className="text-fg-muted max-w-2xl mx-auto">
            Browse public repositories, traverse history, and inspect code
            snapshots.
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-fg-muted">
            <span className="px-2 py-1 rounded-full bg-canvas-subtle border border-border-default">
              Public repos
            </span>
            <span className="px-2 py-1 rounded-full bg-canvas-subtle border border-border-default">
              Commit explorer
            </span>
            <span className="px-2 py-1 rounded-full bg-canvas-subtle border border-border-default">
              Snapshot viewer
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-xl border border-border-default bg-canvas-subtle p-5 space-y-4"
          >
            <p className="text-sm font-semibold text-fg-default">
              Explore a repository
            </p>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-fg-muted" />
              </div>
              <input
                type="text"
                required
                className="block w-full pl-10 pr-3 py-3 border border-border-default rounded-lg leading-5 bg-canvas-default text-fg-default placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="facebook/react"
                value={repoInput}
                onChange={(e) => setRepoInput(e.target.value)}
              />
            </div>
            <Button type="submit" size="lg" className="w-full">
              Explore Repository
            </Button>
          </form>

          <form
            onSubmit={handleAddProfile}
            className="rounded-xl border border-border-default bg-canvas-subtle p-5 space-y-3"
          >
            <p className="text-sm font-semibold text-fg-default">
              Add GitHub Profile
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                className="flex-1 px-3 py-2 border border-border-default rounded-md bg-canvas-default text-fg-default placeholder-fg-muted focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="@username"
                value={profileInput}
                onChange={(e) => setProfileInput(e.target.value)}
              />
              <Button type="submit" disabled={isAddingProfile}>
                {isAddingProfile ? "Adding..." : "Add Profile"}
              </Button>
            </div>
            {profileError && (
              <p className="text-xs text-red-300">{profileError}</p>
            )}
          </form>
        </div>

        <div className="text-xs text-fg-muted text-center">
          <p>
            Try:{" "}
            <button
              onClick={() => setRepoInput("torvalds/linux")}
              className="text-blue-400 hover:underline"
            >
              torvalds/linux
            </button>{" "}
            or{" "}
            <button
              onClick={() => setRepoInput("facebook/react")}
              className="text-blue-400 hover:underline"
            >
              facebook/react
            </button>
          </p>
        </div>

        {savedProfiles.length > 0 && (
          <section className="rounded-xl border border-border-default bg-canvas-subtle p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold">Saved Profiles</h2>
              <span className="text-xs text-fg-muted">
                {savedProfiles.length} saved
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedProfiles.map((profile) => (
                <button
                  key={profile.login}
                  onClick={() => navigate(`/profiles/${profile.login}`)}
                  className="w-full text-left p-3 rounded-lg border border-border-default bg-canvas-default hover:bg-canvas-overlay transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={profile.avatar_url}
                      alt={profile.login}
                      className="w-10 h-10 rounded-full ring-1 ring-border-default"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-fg-default truncate">
                        {profile.name || profile.login}
                      </p>
                      <p className="text-xs text-fg-muted truncate">
                        @{profile.login}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {savedProfiles.length === 0 && (
          <div className="rounded-xl border border-dashed border-border-default bg-canvas-subtle/50 p-5 text-center">
            <p className="text-sm text-fg-muted">
              Add profiles to quickly open their public repositories.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

const ProfileReposPage = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRepos = async (targetPage: number, reset = false) => {
    if (!username || isLoading) return;
    setIsLoading(true);
    try {
      const data = await getUserRepos(username, targetPage, 30);
      setRepos((previousRepos) => (reset ? data : [...previousRepos, ...data]));
      setPage(targetPage);
      setHasMore(data.length === 30);
    } catch (loadError: any) {
      setError(loadError?.message || "Failed to load repositories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!username) return;
    const init = async () => {
      setError(null);
      setRepos([]);
      setPage(1);
      setHasMore(true);
      try {
        const profileData = await getGitHubProfile(username);
        setProfile(profileData);
      } catch (profileError: any) {
        setError(profileError?.message || "Profile not found.");
        return;
      }
      await loadRepos(1, true);
    };

    init();
  }, [username]);

  return (
    <div className="min-h-screen bg-canvas-default text-fg-default p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {error ? (
          <div className="p-4 rounded border border-red-900 text-red-200 bg-red-900/20">
            {error}
          </div>
        ) : (
          <>
            <div className="rounded-lg border border-border-default bg-canvas-subtle p-4 flex items-center gap-3">
              <img
                src={profile?.avatar_url || ""}
                alt={profile?.login || ""}
                className="w-12 h-12 rounded-full bg-border-default"
              />
              <div>
                <h1 className="text-lg font-semibold">
                  {profile?.name || profile?.login}
                </h1>
                <p className="text-sm text-fg-muted">@{profile?.login}</p>
              </div>
            </div>

            <div className="space-y-3">
              {repos.map((repo) => (
                <button
                  key={repo.id}
                  onClick={() =>
                    navigate(`/repo/${profile?.login}/${repo.name}`)
                  }
                  className="w-full text-left p-4 rounded-lg border border-border-default bg-canvas-subtle hover:bg-canvas-overlay transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-fg-default">
                      {repo.name}
                    </p>
                    <span className="text-xs text-fg-muted">
                      {repo.language || "Unknown"}
                    </span>
                  </div>
                  {repo.description && (
                    <p className="mt-1 text-xs text-fg-muted">
                      {repo.description}
                    </p>
                  )}
                </button>
              ))}
            </div>

            {hasMore && (
              <div className="pt-2">
                <Button
                  variant="secondary"
                  onClick={() => loadRepos(page + 1)}
                  disabled={isLoading}
                >
                  {isLoading ? "Loading..." : "Load more repositories"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

const RepoExplorer = () => {
  const {
    owner,
    repo,
    sha: routeSha,
  } = useParams<{ owner: string; repo: string; sha?: string }>();
  const navigate = useNavigate();

  // State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [currentBranch, setCurrentBranch] = useState<string>("main");
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [commitDetail, setCommitDetail] = useState<CommitDetail | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DIFF);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMoreCommits, setHasMoreCommits] = useState(true);

  // Initialize
  useEffect(() => {
    if (!owner || !repo) return;

    const initRepo = async () => {
      try {
        const branchData = await getBranches(owner, repo);
        setBranches(branchData);
        // Try to find main or master
        const defaultBranch =
          branchData.find((b) => b.name === "main" || b.name === "master")
            ?.name || branchData[0]?.name;
        if (defaultBranch) setCurrentBranch(defaultBranch);
      } catch (err: any) {
        setError(err.message);
      }
    };
    initRepo();
  }, [owner, repo]);

  // Load commits when branch changes
  useEffect(() => {
    if (!owner || !repo || !currentBranch) return;

    const loadCommits = async () => {
      setLoadingCommits(true);
      setPage(1);
      setCommits([]);
      try {
        const data = await getCommits(owner, repo, currentBranch, 1);
        setCommits(data);
        setHasMoreCommits(data.length === 20); // Assuming page size 20

        // If no sha in route, auto-select latest
        if (!routeSha && data.length > 0) {
          navigate(`/repo/${owner}/${repo}/commit/${data[0].sha}`, {
            replace: true,
          });
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingCommits(false);
      }
    };
    loadCommits();
  }, [owner, repo, currentBranch]);

  // Load more commits
  const loadMoreCommits = async () => {
    if (!owner || !repo || !currentBranch || loadingCommits) return;
    const nextPage = page + 1;
    setLoadingCommits(true);
    try {
      const data = await getCommits(owner, repo, currentBranch, nextPage);
      setCommits((prev) => [...prev, ...data]);
      setPage(nextPage);
      setHasMoreCommits(data.length === 20);
    } catch (err) {
      console.error("Failed to load more commits");
    } finally {
      setLoadingCommits(false);
    }
  };

  // Load commit detail when route SHA changes
  useEffect(() => {
    if (!owner || !repo || !routeSha) return;

    const loadDetail = async () => {
      setLoadingDetail(true);
      setError(null);
      try {
        const detail = await getCommitDetail(owner, repo, routeSha);
        setCommitDetail(detail);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoadingDetail(false);
      }
    };
    loadDetail();
  }, [owner, repo, routeSha]);

  const handleBranchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCurrentBranch(e.target.value);
    navigate(`/repo/${owner}/${repo}`); // Reset SHA on branch switch
  };

  const handleCommitSelect = (sha: string) => {
    navigate(`/repo/${owner}/${repo}/commit/${sha}`);
  };

  // Navigation Logic
  const currentIndex = commits.findIndex((c) => c.sha === routeSha);
  // Next commit (Newer) is at index - 1
  const nextCommitSha = currentIndex > 0 ? commits[currentIndex - 1].sha : null;
  // Prev commit (Older) is at index + 1 OR if not in list, check commitDetail parents
  const prevCommitSha =
    currentIndex >= 0 && currentIndex < commits.length - 1
      ? commits[currentIndex + 1].sha
      : commitDetail?.parents?.[0]?.sha;

  return (
    <div className="flex flex-col h-screen bg-canvas-default text-fg-default overflow-hidden">
      {/* Top Header */}
      <header className="flex-shrink-0 h-14 border-b border-border-default bg-canvas-subtle flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="h-6 w-px bg-border-muted mx-2" />
          <h2 className="font-semibold text-sm flex items-center gap-2">
            <span className="text-fg-muted">{owner} /</span> {repo}
          </h2>
        </div>

        <div className="flex items-center gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-1">
            <Button
              variant="secondary"
              size="sm"
              disabled={!prevCommitSha}
              onClick={() => prevCommitSha && handleCommitSelect(prevCommitSha)}
              title="Previous Commit (Older)"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={!nextCommitSha}
              onClick={() => nextCommitSha && handleCommitSelect(nextCommitSha)}
              title="Next Commit (Newer)"
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-fg-muted" />
            <select
              className="bg-canvas-default border border-border-default rounded px-2 py-1 text-xs focus:ring-2 focus:ring-blue-500 outline-none max-w-[150px]"
              value={currentBranch}
              onChange={handleBranchChange}
            >
              {branches.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex bg-canvas-default rounded-md border border-border-default p-0.5">
            <button
              onClick={() => setViewMode(ViewMode.DIFF)}
              className={`px-3 py-1 text-xs font-medium rounded-sm flex items-center gap-2 transition-colors ${
                viewMode === ViewMode.DIFF
                  ? "bg-blue-600 text-white"
                  : "text-fg-muted hover:text-fg-default"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Diff
            </button>
            <button
              onClick={() => setViewMode(ViewMode.SNAPSHOT)}
              className={`px-3 py-1 text-xs font-medium rounded-sm flex items-center gap-2 transition-colors ${
                viewMode === ViewMode.SNAPSHOT
                  ? "bg-blue-600 text-white"
                  : "text-fg-muted hover:text-fg-default"
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              Snapshot
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar: Commits */}
        <CommitListSidebar
          commits={commits}
          selectedSha={routeSha}
          onSelectCommit={handleCommitSelect}
          isLoading={loadingCommits}
          onLoadMore={loadMoreCommits}
          hasMore={hasMoreCommits}
        />

        {/* Right Area: Viewer */}
        <main className="flex-1 flex flex-col min-w-0 bg-canvas-default overflow-hidden relative">
          {error ? (
            <div className="m-8 p-4 bg-red-900/20 border border-red-900 text-red-200 rounded">
              Error: {error}
            </div>
          ) : !routeSha ? (
            <div className="flex items-center justify-center h-full text-fg-muted">
              Select a commit to view details
            </div>
          ) : loadingDetail ? (
            <div className="flex items-center justify-center h-full text-fg-muted">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
            </div>
          ) : commitDetail ? (
            <>
              {viewMode === ViewMode.DIFF ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <DiffViewer commit={commitDetail} />
                </div>
              ) : (
                <SnapshotViewer
                  owner={owner || ""}
                  repo={repo || ""}
                  commit={commitDetail}
                />
              )}
            </>
          ) : null}
        </main>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/profiles/:username" element={<ProfileReposPage />} />
        <Route path="/repo/:owner/:repo" element={<RepoExplorer />} />
        <Route
          path="/repo/:owner/:repo/commit/:sha"
          element={<RepoExplorer />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
