# Resept Frontend

A React-based recipe management application.

## Development

```bash
npm install
npm run dev
```

## Building for Production

```bash
npm run build
```

## GitHub Pages Deployment

This project is configured to automatically deploy to GitHub Pages on every push to the `master` or `main` branch.

**Note:** Since this repository contains both backend and frontend code, the deployment is configured to build and deploy only the frontend (`resept-frontend/`) directory.

### Setup Instructions

1. **Enable GitHub Pages** in your repository settings:

   - Go to Settings > Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created automatically)
   - Folder: `/ (root)`

2. **Push to master/main** - The GitHub Action will automatically:
   - Navigate to the `resept-frontend/` directory
   - Build the project
   - Deploy to GitHub Pages
   - Update the live site

### Manual Deployment

If you need to deploy manually:

```bash
cd resept-frontend
npm run deploy
```

## Project Structure

- `
