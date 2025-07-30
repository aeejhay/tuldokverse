#!/bin/bash

echo "🚀 Deploying Frontend to Vercel..."

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Login to Vercel
echo "🔐 Logging into Vercel..."
vercel login

# Deploy to Vercel
echo "📦 Deploying frontend..."
cd frontend
vercel --prod

echo "✅ Frontend deployment initiated!"
echo "📊 Check your Vercel dashboard for deployment status"
echo "🔗 Your frontend URL will be available in the Vercel dashboard" 