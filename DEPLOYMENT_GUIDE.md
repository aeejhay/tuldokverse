# 🚀 Deployment Guide: Vercel (Frontend) + Railway (Backend)

This guide will help you deploy your Tuldokverse project to Vercel (frontend) and Railway (backend with MySQL database).

## 📋 Prerequisites

1. **GitHub Account** - Your code should be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Railway Account** - Sign up at [railway.app](https://railway.app)
4. **Node.js** - Make sure you have Node.js installed locally

## 🎯 Step-by-Step Deployment

### Part 1: Deploy Backend to Railway

#### Step 1.1: Prepare Your Backend Code
1. Make sure your backend code is pushed to GitHub
2. The backend folder should contain:
   - `server.js` (main entry point)
   - `package.json` (with all dependencies)
   - `Procfile` (for Railway)
   - `vercel.json` (for API routing)

#### Step 1.2: Deploy to Railway
1. **Go to Railway Dashboard**
   - Visit [railway.app](https://railway.app)
   - Sign in with your GitHub account

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository
   - Select the `backend` folder as the source

3. **Add MySQL Database**
   - In your Railway project, click "New"
   - Select "Database" → "MySQL"
   - Railway will automatically create a MySQL database

4. **Configure Environment Variables**
   - Go to your backend service in Railway
   - Click on "Variables" tab
   - Add the following environment variables:

```env
# Database Configuration (Railway will provide these)
DB_HOST=${MYSQLHOST}
DB_USER=${MYSQLUSER}
DB_PASSWORD=${MYSQLPASSWORD}
DB_DATABASE=${MYSQLDATABASE}
DB_PORT=${MYSQLPORT}

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here_make_it_long_and_random

# XRPL Configuration
XRPL_NODE_URL=https://s.altnet.rippletest.net:51234

# Frontend URL (will be updated after Vercel deployment)
FRONTEND_URL=https://your-frontend-domain.vercel.app

# Server Port
PORT=5000

# Email Configuration (if using)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

5. **Deploy**
   - Railway will automatically deploy your backend
   - Wait for the deployment to complete
   - Note down your backend URL (e.g., `https://your-backend.railway.app`)

### Part 2: Deploy Frontend to Vercel

#### Step 2.1: Prepare Your Frontend Code
1. Make sure your frontend code is pushed to GitHub
2. The frontend folder should contain:
   - `package.json` (with all dependencies)
   - `vercel.json` (for routing)

#### Step 2.2: Deploy to Vercel
1. **Go to Vercel Dashboard**
   - Visit [vercel.com](https://vercel.com)
   - Sign in with your GitHub account

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Set the root directory to `frontend`
   - Framework preset: "Create React App"

3. **Configure Environment Variables**
   - In the project settings, go to "Environment Variables"
   - Add the following variable:

```env
REACT_APP_API_URL=https://your-backend.railway.app/api
```

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your frontend
   - Note down your frontend URL (e.g., `https://your-frontend.vercel.app`)

### Part 3: Update Configuration

#### Step 3.1: Update Backend CORS
1. Go back to Railway dashboard
2. Update the `FRONTEND_URL` environment variable with your Vercel URL:

```env
FRONTEND_URL=https://your-frontend.vercel.app
```

3. Redeploy the backend service

#### Step 3.2: Test Your Deployment
1. Visit your Vercel frontend URL
2. Test registration, login, and other features
3. Check Railway logs for any errors

## 🔧 Troubleshooting

### Common Issues:

1. **CORS Errors**
   - Make sure `FRONTEND_URL` in Railway matches your Vercel URL exactly
   - Check that the URL includes `https://` protocol

2. **Database Connection Issues**
   - Verify all MySQL environment variables are set in Railway
   - Check Railway logs for database connection errors

3. **Build Errors**
   - Check Vercel build logs for any missing dependencies
   - Ensure all required environment variables are set

4. **API 404 Errors**
   - Verify your backend is running on Railway
   - Check that the API URL in frontend environment variables is correct

### Useful Commands:

```bash
# Test backend locally
cd backend
npm install
npm start

# Test frontend locally
cd frontend
npm install
npm start

# Check Railway logs
railway logs

# Check Vercel deployment status
vercel ls
```

## 📊 Monitoring

### Railway Monitoring:
- View logs in Railway dashboard
- Monitor database usage
- Check service health

### Vercel Monitoring:
- View deployment status
- Check build logs
- Monitor performance

## 🔄 Continuous Deployment

Both platforms support automatic deployments:
- **Railway**: Automatically deploys when you push to your main branch
- **Vercel**: Automatically deploys when you push to your main branch

## 💰 Cost Management

### Railway Free Tier:
- $5 credit monthly
- MySQL database included
- Sufficient for development and small projects

### Vercel Free Tier:
- Unlimited deployments
- Custom domains
- Perfect for frontend hosting

## 🎉 Success!

Once deployed, your application will be accessible at:
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend API**: `https://your-backend.railway.app`

Your Tuldokverse application is now live and accessible worldwide! 🌍 