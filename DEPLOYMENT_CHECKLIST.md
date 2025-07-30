# ✅ Deployment Checklist

## Pre-Deployment
- [ ] Code is pushed to GitHub repository
- [ ] All dependencies are in package.json files
- [ ] Environment variables are configured
- [ ] Database schema is ready

## Railway (Backend) Deployment
- [ ] Sign up at [railway.app](https://railway.app)
- [ ] Create new project from GitHub repo
- [ ] Select `backend` folder as source
- [ ] Add MySQL database service
- [ ] Configure environment variables:
  - [ ] DB_HOST=${MYSQLHOST}
  - [ ] DB_USER=${MYSQLUSER}
  - [ ] DB_PASSWORD=${MYSQLPASSWORD}
  - [ ] DB_DATABASE=${MYSQLDATABASE}
  - [ ] DB_PORT=${MYSQLPORT}
  - [ ] JWT_SECRET=your_secret_key
  - [ ] XRPL_NODE_URL=https://s.altnet.rippletest.net:51234
  - [ ] FRONTEND_URL=https://your-frontend.vercel.app
  - [ ] PORT=5000
- [ ] Deploy and note backend URL

## Vercel (Frontend) Deployment
- [ ] Sign up at [vercel.com](https://vercel.com)
- [ ] Import GitHub repository
- [ ] Set root directory to `frontend`
- [ ] Configure environment variables:
  - [ ] REACT_APP_API_URL=https://your-backend.railway.app/api
- [ ] Deploy and note frontend URL

## Post-Deployment
- [ ] Update FRONTEND_URL in Railway with Vercel URL
- [ ] Update REACT_APP_API_URL in Vercel with Railway URL
- [ ] Test all features:
  - [ ] User registration
  - [ ] User login
  - [ ] Profile management
  - [ ] Token sending
  - [ ] Email verification
- [ ] Check Railway logs for errors
- [ ] Check Vercel build logs for errors

## Testing Checklist
- [ ] Frontend loads without errors
- [ ] Backend API responds correctly
- [ ] Database connections work
- [ ] CORS is properly configured
- [ ] All API endpoints are accessible
- [ ] User authentication works
- [ ] XRPL integration functions properly

## URLs to Note
- **Frontend**: `https://your-frontend.vercel.app`
- **Backend**: `https://your-backend.railway.app`
- **API Base**: `https://your-backend.railway.app/api`

## Troubleshooting
- [ ] Check Railway logs for backend issues
- [ ] Check Vercel build logs for frontend issues
- [ ] Verify environment variables are set correctly
- [ ] Test database connectivity
- [ ] Verify CORS configuration

## Success Indicators
- ✅ Frontend loads successfully
- ✅ Backend API responds to health check
- ✅ Database tables are created
- ✅ User registration works
- ✅ User login works
- ✅ All features function as expected

🎉 **Deployment Complete!** Your Tuldokverse app is now live! 