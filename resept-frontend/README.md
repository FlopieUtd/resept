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

### Setup Instructions

1. **Enable GitHub Pages** in your repository settings:

   - Go to Settings > Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (will be created automatically)
   - Folder: `/ (root)`

2. **Push to master/main** - The GitHub Action will automatically:
   - Build the project
   - Deploy to GitHub Pages
   - Update the live site

### Manual Deployment

If you need to deploy manually:

```bash
npm run deploy
```

## Project Structure

- `src/components/` - React components
- `src/contexts/` - React contexts
- `src/hooks/` - Custom React hooks
- `src/lib/` - Service libraries
- `src/utils/` - Utility functions
