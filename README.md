# Dental Shade Assistant

AI-powered dental shade matching tool that compares a patient's natural tooth against a new restoration using the VITA classical shade guide.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```
   npm install
   ```

2. Set `GITHUB_TOKEN` in `.env.local` to your GitHub Personal Access Token:
   ```
   GITHUB_TOKEN="github_pat_..."
   ```

3. Run the app (starts both frontend on :3000 and API proxy on :3001):
   ```
   npm run dev
   ```

   Or run them separately in two terminals:
   ```
   npm run dev:client   # Vite frontend on http://localhost:3000
   npm run dev:server   # Express API proxy on http://localhost:3001
   ```

## Architecture

The app uses a **server-side proxy** to keep your GitHub token secure:

- **Frontend** (Vite + React) — runs on `http://localhost:3000`, handles image uploads and displays results
- **Backend** (Express) — runs on `http://localhost:3001`, holds the `GITHUB_TOKEN` and proxies requests to the GitHub Models inference API (`gpt-4o` with vision)

The token **never** appears in the client-side JavaScript bundle.
