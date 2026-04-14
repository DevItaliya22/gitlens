# GitLens Explorer

GitLens Explorer is a React + Vite app for browsing public GitHub repositories, commit history, diffs, and file snapshots in a fast UI.

## Features

- Explore any public repository by entering `owner/repo`
- Browse commit history with API pagination
- Virtualized commit list for smooth scrolling
- Diff and snapshot modes for each commit
- Virtualized code and diff rendering for large files
- Save multiple GitHub profiles in `localStorage`
- Open a profile page and browse all public repos for that user

## Tech Stack

- React
- TypeScript
- Vite
- React Router
- PrismJS
- date-fns
- lucide-react

## Getting Started

### Prerequisites

- Node.js 18+ (recommended)
- npm

### Install

```bash
npm install
```

### Run

```bash
npm run dev
```

Then open `http://localhost:3000`.

## Build

```bash
npm run build
```

## How It Works

- Uses the GitHub public REST API (`https://api.github.com`)
- No credentials are required for public repository browsing
- Saved profiles are stored only in browser `localStorage`

## Project Structure

- `App.tsx` - routing + landing/profile/repo pages
- `services/githubService.ts` - GitHub API calls
- `components/CommitListSidebar.tsx` - virtualized commit sidebar
- `components/DiffViewer.tsx` - commit diff view
- `components/SnapshotViewer.tsx` - file tree + source/diff tabs
- `components/CodeBlock.tsx` - virtualized highlighted code view

## Contributing

Contributions are welcome.

1. Fork the repo
2. Create your feature branch
3. Commit your changes
4. Open a pull request

## License

This project is licensed under the MIT License. See `LICENSE`.
