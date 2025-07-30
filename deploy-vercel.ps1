# PowerShell script to deploy frontend to Vercel
Write-Host "🚀 Deploying Frontend to Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (!(Get-Command vercel -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Installing..." -ForegroundColor Yellow
    npm install -g vercel
}

# Login to Vercel
Write-Host "🔐 Logging into Vercel..." -ForegroundColor Yellow
vercel login

# Deploy to Vercel with frontend directory
Write-Host "📦 Deploying frontend..." -ForegroundColor Yellow
vercel --prod --cwd frontend

Write-Host "✅ Frontend deployment initiated!" -ForegroundColor Green
Write-Host "📊 Check your Vercel dashboard for deployment status" -ForegroundColor Cyan 