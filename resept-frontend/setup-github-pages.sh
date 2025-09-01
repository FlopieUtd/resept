#!/bin/bash

echo "🚀 Setting up GitHub Pages for Resept Frontend"
echo ""

echo "1. Make sure you're in the resept-frontend directory"
echo "2. Commit and push your changes:"
echo "   git add ."
echo "   git commit -m 'Add GitHub Pages deployment configuration'"
echo "   git push origin master"
echo ""

echo "3. Go to your GitHub repository settings:"
echo "   - Navigate to Settings > Pages"
echo "   - Source: Deploy from a branch"
echo "   - Branch: gh-pages (will be created automatically)"
echo "   - Folder: / (root)"
echo ""

echo "4. The GitHub Action will automatically deploy on every push to master!"
echo "   Your site will be available at: https://[username].github.io/resept/"
echo ""

echo "✨ Setup complete! Push to master to trigger your first deployment." 