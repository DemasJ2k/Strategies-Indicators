# 🚀 Market Playbook Agent — Deployment Guide

This guide shows how to deploy the full system (frontend + backend + real-time sockets) to production.

---

## 1. Requirements

- Node.js 18+
- Git
- PM2 (optional for VPS)
- A server or hosting provider:
  - Railway.app (recommended)
  - Render.com
  - Vercel (frontend only)
  - Netlify (frontend only)
  - Your own VPS (EC2, DigitalOcean, Linode, Hetzner)

---

## 2. Environment Variables

Create a `.env` file in the backend root:

```env
PORT=4000
NODE_ENV=production

# If using OpenAI or other models
OPENAI_API_KEY=your_key_here
```

Your backend uses no other secrets unless you add external APIs.

---

## 3. Production Build Commands

### Backend

```bash
npm install
npm run build:server
```

This produces:
- `dist/server.js`
- `dist/**/*.js`

### Frontend

```bash
cd frontend
npm install
npm run build
```

Produces:
- `frontend/dist/`

---

## 4. Running in Production (VPS)

### Step 1 — Install PM2

```bash
npm install -g pm2
```

### Step 2 — Start backend

```bash
pm2 start dist/server.js --name playbook-server
```

### Step 3 — Serve frontend

**Option A:** Serve frontend via backend static route
**Option B:** Upload `/frontend/dist` to Netlify or Vercel

---

## 5. Deployment to Railway (recommended)

Railway automatically builds:
- Node backend
- React frontend

**Steps:**
1. Create new Railway project
2. Connect your GitHub repo
3. Add environment variables in "Variables"
4. Deploy

Railway automatically detects:
- Node environment
- Installs dependencies
- Runs build scripts

---

## 6. Deployment to Render

### Backend service:
- Create "Web Service"
- Build command: `npm install && npm run build:server`
- Start command: `npm start`

### Frontend:
- Create "Static Site"
- Publish `/frontend`
- Build command: `npm install && npm run build`
- Publish directory: `frontend/dist`

---

## 7. Deployment to Vercel (frontend only)

- Vercel → New Project → Select frontend folder
- Framework: Vite
- Build Command: `npm run build`
- Output: `dist`

Backend must run elsewhere (Railway/Render).

---

## 8. Deployment to Netlify (frontend only)

- Drag-and-drop the `frontend/dist` folder
OR
- Connect Git + configure build:

```bash
npm install
npm run build
```

publish: `frontend/dist`

---

## 9. Optional — Nginx Reverse Proxy (VPS)

Example:

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  location / {
    root /var/www/playbook-frontend/dist;
    try_files $uri /index.html;
  }

  location /api/ {
    proxy_pass http://localhost:4000/;
  }

  location /socket.io/ {
    proxy_pass http://localhost:4000/socket.io/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}
```

---

## 10. Testing After Deployment

Hit:
- `GET /api/playbooks`
- `POST /api/analyze`
- Live WebSocket feed (`liveAnalysis` event)
- Frontend loads graph + panels

---

**Deployment complete 🎉**
