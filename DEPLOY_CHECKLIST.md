# Deployment Checklist

Follow these steps precisely to get Chitrakari deployed for free using Render (backend) and Netlify (frontend).

## 1. Push to GitHub
1. Create a new empty repository on GitHub.
2. Initialize your local folder and push:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 2. Deploy Backend (Render)
1. Log into [Render](https://render.com) and click **New > Web Service**.
2. Connect your GitHub repository.
3. Render should automatically detect `render.yaml` and configure the service (Node environment, `server/` root directory, build/start commands).
4. Do **not** set `CLIENT_URL` yet (or just leave it blank).
5. Click **Deploy**.
6. Wait for the build to finish. Once it says "Live", copy the Render URL (e.g., `https://chitrakari-backend-xxxx.onrender.com`).
> **Note on Render Free Tier**: Yes, Render's free tier spins down your server after 15 minutes of inactivity! If no one has played for a while, the very first person to connect will experience a ~30-50 second delay before the server wakes up. 

## 3. Deploy Frontend (Netlify)
1. Log into [Netlify](https://netlify.com) and click **Add new site > Import an existing project**.
2. Connect your GitHub repository.
3. Netlify will detect `netlify.toml` and configure the base directory (`client/`) and build commands automatically.
4. **CRITICAL**: Before clicking deploy, add an Environment Variable:
   - **Key**: `VITE_SERVER_URL`
   - **Value**: The Render URL you copied in Step 2 (e.g., `https://chitrakari-backend-xxxx.onrender.com`).
5. Click **Deploy Site**.
6. Wait for the build to finish. Copy your new Netlify URL (e.g., `https://chitrakari-xxxx.netlify.app`).

## 4. Tie it Together (Set CORS)
Now we need to tell the backend to accept connections from your new frontend URL.
1. Go back to your Web Service on **Render**.
2. Go to the **Environment** tab.
3. Add a new variable:
   - **Key**: `CLIENT_URL`
   - **Value**: Your Netlify URL (e.g., `https://chitrakari-xxxx.netlify.app`).
4. Save changes. Render will automatically redeploy the backend with the new CORS config.

## 5. Final Polish
1. Test your live Netlify URL! Everything should connect flawlessly.
2. Update your `README.md` to replace the "Live Demo" placeholder link with your actual Netlify URL.
3. Commit and push the updated `README.md`.
