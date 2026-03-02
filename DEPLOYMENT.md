# Deploying LunchUp to Render

This guide will help you deploy the LunchUp application to Render with MongoDB.

## Prerequisites

1. A [Render account](https://render.com/) (free tier available)
2. Git repository (GitHub, GitLab, or Bitbucket)
3. Render CLI (optional, for local testing)

## Step 1: Push Code to Git Repository

```bash
# Initialize git if not already done
cd /Users/nic/Workspace/lunchup
git init
git add .
git commit -m "Initial commit - LunchUp app"

# Push to your Git provider (GitHub example)
git remote add origin https://github.com/yourusername/lunchup.git
git push -u origin main
```

## Step 2: Create MongoDB on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Database** → **PostgreSQL** (Render uses PostgreSQL, but we'll use MongoDB Atlas)

### Alternative: Use MongoDB Atlas (Recommended)

Since Render doesn't have native MongoDB, use MongoDB Atlas (free tier):

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Get your connection string:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/lunchup?retryWrites=true&w=majority
   ```
4. Whitelist all IPs (0.0.0.0/0) for Render access

## Step 3: Deploy Backend API

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Web Service**
3. Connect your Git repository
4. Configure the service:

| Setting | Value |
|---------|-------|
| **Name** | `lunchup-api` |
| **Region** | Oregon (or closest to you) |
| **Branch** | `main` |
| **Root Directory** | (leave blank) |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | `Free` |

5. Add Environment Variables:

```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/lunchup
JWT_SECRET=your-secret-key-min-32-characters-long-for-security
CORS_ORIGIN=https://lunchup-web.onrender.com
```

6. Click **Create Web Service**

## Step 4: Deploy Frontend

### Option A: Deploy as Static Site on Render

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click **New** → **Static Site**
3. Connect your Git repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `lunchup-web` |
| **Branch** | `main` |
| **Build Command** | `cd client && npm install && npm run build` |
| **Publish Directory** | `client/build` |
| **Environment Variables** | `REACT_APP_API_URL=https://lunchup-api.onrender.com` |

5. Click **Create Static Site**

### Option B: Deploy to Vercel (Recommended for Frontend)

1. Go to [Vercel](https://vercel.com/)
2. Import your Git repository
3. Set root directory to `client`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://lunchup-api.onrender.com
   ```
5. Deploy

## Step 5: Update CORS Settings

After both services are deployed:

1. Go to Render Dashboard → `lunchup-api`
2. Update `CORS_ORIGIN` environment variable to your frontend URL:
   ```
   CORS_ORIGIN=https://lunchup-web.onrender.com
   ```
   or
   ```
   CORS_ORIGIN=https://your-app.vercel.app
   ```

3. Redeploy the API

## Step 6: Seed the Database

Once deployed, seed the database with Australian users:

### Option A: Run seed script locally
```bash
# Update .env with production MongoDB URI
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.xxxxx.mongodb.net/lunchup

# Run seed
npm run seed
```

### Option B: Use Render's shell
1. Go to Render Dashboard → `lunchup-api` → Shell
2. Run:
   ```bash
   npm run seed
   ```

## Step 7: Test Your Deployment

1. Visit your frontend URL: `https://your-app.onrender.com` or `https://your-app.vercel.app`
2. Register a new account
3. Click "Find Matches" to see Australian users

## Troubleshooting

### "Invalid Token" Error
- Clear browser local storage
- Re-login
- Ensure JWT_SECRET is consistent

### CORS Errors
- Check CORS_ORIGIN matches your frontend URL exactly
- Include https:// in the URL
- Redeploy API after changing CORS settings

### Database Connection Errors
- Verify MongoDB Atlas connection string
- Ensure IP whitelist includes 0.0.0.0/0
- Check MongoDB Atlas cluster is running

### Build Failures
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify Node.js version compatibility

## Environment Variables Summary

### Backend (lunchup-api)
```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://your-frontend-url.com
```

### Frontend (lunchup-web)
```
REACT_APP_API_URL=https://lunchup-api.onrender.com
```

## URLs After Deployment

- **Frontend**: `https://lunchup-web.onrender.com` (or Vercel URL)
- **Backend API**: `https://lunchup-api.onrender.com`
- **API Health Check**: `https://lunchup-api.onrender.com/health`
- **MongoDB Atlas**: `https://cloud.mongodb.com/`

## Free Tier Limits

- **Render Web Service**: 750 hours/month (free), sleeps after 15 min inactivity
- **MongoDB Atlas**: 512MB storage, shared RAM
- **Vercel**: Unlimited deployments, 100GB bandwidth/month

## Keeping Render Service Awake (Optional)

Free Render services sleep after inactivity. To keep it awake:

1. Use a service like [UptimeRobot](https://uptimerobot.com/)
2. Ping your API health endpoint every 5 minutes:
   ```
   https://lunchup-api.onrender.com/health
   ```
