# Render Environment Variables Setup Guide

## ⚙️ Backend Service (lunchup.onrender.com)

Go to Render Dashboard → `lunchup` (Web Service) → **Environment**

Add these **5 environment variables**:

| Key | Value | Example |
|-----|-------|---------|
| `NODE_ENV` | `production` | `production` |
| `PORT` | `3001` | `3001` |
| `MONGODB_URI` | Your MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster0.xxx.mongodb.net/lunchup?retryWrites=true&w=majority` |
| `JWT_SECRET` | Random string (min 32 chars) | `my_super_secret_jwt_key_2024_lunchup_app` |
| `CORS_ORIGIN` | Your frontend URL | `https://lunchup-web.onrender.com` |

### How to get MongoDB URI:
1. Go to https://cloud.mongodb.com/
2. Click **Connect** on your cluster
3. Choose **Connect your application**
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with `lunchup`

### After adding variables:
- Click **Save Changes**
- Click **Manual Deploy** → **Deploy latest commit**
- Wait 2-3 minutes for deployment
- Test: https://lunchup.onrender.com/health

---

## 🎨 Frontend Service (lunchup-web.onrender.com)

Go to Render Dashboard → `lunchup-web` (Static Site) → **Environment**

Add this **1 environment variable**:

| Key | Value | Example |
|-----|-------|---------|
| `REACT_APP_API_URL` | Your backend API URL | `https://lunchup.onrender.com` |

### After adding variables:
- Click **Save Changes**
- Click **Manual Deploy** → **Deploy latest commit**
- Wait 2-3 minutes for deployment
- Test: https://lunchup-web.onrender.com/register

---

## ✅ Verification Checklist

### Backend Health Check
```bash
curl https://lunchup.onrender.com/health
```
Expected: `{"status":"ok","timestamp":"..."}`

### Backend API Root
```bash
curl https://lunchup.onrender.com/
```
Expected: `{"message":"🍽️ LunchUp API is running!",...}`

### Frontend Console Check
1. Open https://lunchup-web.onrender.com/register
2. Press F12 (open DevTools)
3. Check console for:
   ```
   🌐 API Configuration:
     API_URL: https://lunchup.onrender.com
     NODE_ENV: production
   ```

---

## 🔧 Troubleshooting

### Backend returns "Not Found" or times out:
1. Check Render logs for errors
2. Verify MONGODB_URI is correct
3. Check MongoDB Atlas IP whitelist includes `0.0.0.0/0`
4. Redeploy backend

### Frontend can't connect to backend:
1. Verify REACT_APP_API_URL is set correctly
2. Check browser console for the API_URL being used
3. Verify CORS_ORIGIN on backend matches frontend URL
4. Clear browser cache and reload

### Registration fails with "User already exists":
- The email is already in the database
- Try a different email

### Registration fails with "Server error":
1. Check backend Render logs
2. Verify MongoDB connection is working
3. Check if MongoDB Atlas cluster is running

---

## 📝 Summary

**Backend (5 variables):**
```
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
CORS_ORIGIN=https://lunchup-web.onrender.com
```

**Frontend (1 variable):**
```
REACT_APP_API_URL=https://lunchup.onrender.com
```

**Total: 6 environment variables**
