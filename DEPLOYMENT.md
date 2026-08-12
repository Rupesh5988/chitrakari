# Deployment Guide

Chitrakari is a full-stack real-time application with a Node.js/Socket.io backend and a React/Vite frontend. It is designed to be deployed to modern cloud hosting providers easily.

## 1. Deploying the Backend (Server)
We recommend deploying the server to a platform like [Railway](https://railway.app), [Render](https://render.com), or Heroku, as they natively support WebSockets without restrictive load balancer timeouts.

### Prerequisites
- The server must be deployed **before** the client so you can get the production URL.

### Environment Variables (Server)
You need to set the following environment variables on your server host:
- `PORT`: (Optional) The host will usually provide this automatically.
- `CLIENT_URL`: A comma-separated list of allowed frontend origins (CORS). Example: `https://chitrakari.vercel.app,https://my-preview.vercel.app`

### Build Command
```bash
cd server
npm install
npm run build
```

### Start Command
```bash
cd server
npm start
```
*(Ensure `npm start` runs `node dist/index.js` in your `server/package.json`)*.

---

## 2. Deploying the Frontend (Client)
We recommend deploying the frontend to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) for optimized static asset delivery.

### Environment Variables (Client)
- `VITE_SERVER_URL`: The URL of your deployed backend (from Step 1). Example: `https://chitrakari-server.up.railway.app`

### Build Settings (Vercel/Netlify)
- **Framework Preset**: Vite
- **Build Command**: `cd client && npm install && npm run build`
- **Output Directory**: `client/dist`

---

## 3. Rate Limiting & Proxy Considerations
By default, the server uses the IP from `socket.handshake.address` to enforce a rate limit of 15 connections per minute per IP to prevent spam. 
If you deploy behind a proxy or load balancer (which most cloud hosts use), you may need to ensure the host is configured to forward the true client IP (`x-forwarded-for`), otherwise the server might see the proxy's IP and rate-limit all legitimate users as if they were a single spammer.
