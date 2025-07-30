#!/bin/bash

echo "🚀 Deploying Backend to Railway..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Login to Railway
echo "🔐 Logging into Railway..."
railway login

# Deploy to Railway
echo "📦 Deploying backend..."
cd backend
railway up

echo "✅ Backend deployment initiated!"
echo "📊 Check your Railway dashboard for deployment status"
echo "🔗 Your backend URL will be available in the Railway dashboard" 