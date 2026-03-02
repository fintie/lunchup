#!/bin/bash

echo "🚀 LunchUp Render Deployment Setup"
echo "=================================="
echo ""

# Check if .env exists, create from example if not
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update with your MongoDB Atlas URI."
    echo ""
fi

# Prompt for Git remote
echo "🔗 Git Setup"
echo "------------"
read -p "Enter your Git repository URL (GitHub/GitLab/Bitbucket): " GIT_URL

if [ -n "$GIT_URL" ]; then
    git remote add origin "$GIT_URL" 2>/dev/null || git remote set-url origin "$GIT_URL"
    echo "✅ Git remote configured: $GIT_URL"
    echo ""
    
    read -p "Push to remote now? (y/n): " PUSH_CONFIRM
    if [ "$PUSH_CONFIRM" = "y" ]; then
        git push -u origin main
        echo "✅ Code pushed to repository"
    fi
fi

echo ""
echo "📋 Next Steps:"
echo "=============="
echo ""
echo "1. Set up MongoDB Atlas:"
echo "   - Go to https://www.mongodb.com/cloud/atlas"
echo "   - Create a free cluster"
echo "   - Get your connection string"
echo "   - Whitelist IP: 0.0.0.0/0 (for Render access)"
echo ""
echo "2. Update .env with your MongoDB Atlas URI:"
echo "   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/lunchup"
echo ""
echo "3. Deploy to Render:"
echo "   - Go to https://dashboard.render.com"
echo "   - New → Web Service"
echo "   - Connect your Git repository"
echo "   - Build Command: npm install"
echo "   - Start Command: node server.js"
echo "   - Add environment variables from .env.example"
echo ""
echo "4. Deploy Frontend:"
echo "   Option A - Render Static Site:"
echo "   - New → Static Site"
echo "   - Build Command: cd client && npm install && npm run build"
echo "   - Publish Directory: client/build"
echo ""
echo "   Option B - Vercel (Recommended):"
echo "   - Go to https://vercel.com"
echo "   - Import your repository"
echo "   - Set root directory to: client"
echo ""
echo "📖 Full instructions in DEPLOYMENT.md"
echo ""
