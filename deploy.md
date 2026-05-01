# Deployment Guide — RAAKHSCRN

Follow these steps to deploy your website to **Render**.

## Prerequisites
1. A [GitHub](https://github.com) account with your code pushed to a repository.
2. A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (for a free cloud database).
3. A [Render](https://render.com) account.

---

## 1. Prepare Your Database (MongoDB Atlas)
Since `localhost` won't work on Render, you need a cloud database:
1. Create a free cluster on MongoDB Atlas.
2. Under "Network Access", allow access from `0.0.0.0/0` (standard for Render).
3. Under "Database Access", create a user with a password.
4. Get your **Connection String** (it looks like `mongodb+srv://<user>:<password>@cluster0.mongodb.net/raakhscrn`).

---

## 2. Deploy the Backend (Web Service)
1. Log in to Render and click **New > Web Service**.
2. Connect your GitHub repository.
3. **Name:** `raakh-backend`
4. **Root Directory:** `backend`
5. **Runtime:** `Node`
6. **Build Command:** `npm install`
7. **Start Command:** `node server.js`
8. Click **Advanced** and add the following **Environment Variables**:
   - `MONGODB_URI`: (Your MongoDB Atlas connection string)
   - `PORT`: `10000` (Render sets this automatically, but good to have)
   - `ADMIN_USER`: (Your desired admin username)
   - `ADMIN_PASS`: (Your desired admin password)
9. Click **Create Web Service**.

**Note on Images:** Since Render's disk is ephemeral, any images uploaded via the admin panel will be deleted when the server restarts or redeploys. For a professional setup, consider using a cloud storage service like Cloudinary later.

---

## 3. Update Frontend to Point to Backend
Before deploying the frontend, you must point it to your new backend URL.
1. Copy the URL of your backend (e.g., `https://raakh-backend.onrender.com`).
2. Open `frontend/script.js` and update:
   ```javascript
   const API_URL = 'https://raakh-backend.onrender.com';
   ```
3. Open `frontend/product.html` and update:
   ```javascript
   const API_URL = 'https://raakh-backend.onrender.com';
   ```
4. **Commit and push** these changes to GitHub.

---

## 4. Deploy the Frontend (Static Site)
1. Click **New > Static Site**.
2. Connect the same GitHub repository.
3. **Name:** `raakhscrn`
4. **Root Directory:** `frontend`
5. **Build Command:** (Leave blank)
6. **Publish Directory:** `.` (or leave blank if root directory is already set to `frontend`)
7. Click **Create Static Site**.

---

## 5. Final Check
Once both are deployed:
1. Visit your frontend URL.
2. Check if products load (if you have added any to your cloud DB).
3. Go to `https://your-frontend.com/admin` to manage your store.

---

### Troubleshooting
- **CORS Error:** If the frontend can't talk to the backend, ensure `app.use(cors())` is present in your `server.js` (it is already there).
- **Backend Sleep:** Render's free tier puts the backend to sleep after 15 minutes of inactivity. The first load might take ~30 seconds.
