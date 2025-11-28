# Flowrex Railway Deployment Guide

Railway is the **easiest** way to deploy Flowrex with automatic PostgreSQL provisioning, SSL, and zero DevOps overhead.

## Prerequisites

- GitHub account
- Railway account (https://railway.app)
- OpenAI API key

## Step 1: Prepare Your Repository

1. Push your Flowrex code to GitHub
2. Ensure all changes are committed

## Step 2: Create Railway Project

1. Go to https://railway.app
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your Flowrex repository
5. Railway will detect the Dockerfile automatically

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database" → "PostgreSQL"**
3. Railway automatically creates a database and injects `DATABASE_URL`

## Step 4: Configure Environment Variables

In Railway project settings → Variables, add:

### Required Variables

```bash
NODE_ENV=production
PORT=4000

# Generate with: openssl rand -base64 64
JWT_SECRET=your-jwt-secret-here

# Generate with: openssl rand -base64 32
ENCRYPTION_KEY=your-encryption-key-here

# OpenAI API
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o
```

### Optional: Broker API Keys

```bash
# Add these if you want global fallback keys
# Users can still add their own keys in workspace settings
OANDA_API_KEY=
OANDA_ACCOUNT_ID=
OANDA_ENV=practice

BINANCE_API_KEY=
BINANCE_API_SECRET=
```

## Step 5: Initialize Database Schema

Railway doesn't auto-run SQL files, so you need to manually initialize:

### Option A: Using Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run schema migration
railway run psql $DATABASE_URL < db/schema.sql
```

### Option B: Using Web SQL Editor

1. Open Railway project → PostgreSQL service
2. Click **"Data"** tab
3. Click **"Query"** button
4. Copy/paste contents of `db/schema.sql`
5. Execute

## Step 6: Deploy

Railway auto-deploys on every git push to main branch.

1. Make sure all environment variables are set
2. Railway will:
   - Build Docker image
   - Run migrations (if configured)
   - Start the server
   - Generate a public URL

## Step 7: Get Your Public URL

1. Go to Railway project → Settings
2. Click **"Generate Domain"**
3. Railway provides: `your-app-name.up.railway.app`
4. (Optional) Add custom domain

## Step 8: Test Deployment

Visit your Railway URL:
- `https://your-app.up.railway.app/health` - Should return `{"status":"ok"}`
- `https://your-app.up.railway.app` - Should load Flowrex frontend

## Step 9: Configure Webhooks

Update your MT5 EA and TradingView alerts:

**MT5 Webhook URL:**
```
https://your-app.up.railway.app/api/webhook/mt5
```

**TradingView Webhook URL:**
```
https://your-app.up.railway.app/api/webhook/tradingview
```

## Monitoring & Logs

### View Logs
```bash
railway logs
```

### Deployments
- Railway dashboard shows all deployments
- Auto-rollback on failed health checks

### Metrics
- CPU usage
- Memory usage
- Request counts

## Scaling

Railway auto-scales based on usage:
- Shared CPU plan: $5/month
- Pro plan: $20/month (recommended for production)

## Troubleshooting

### Build Fails

Check Railway build logs for errors:
```bash
railway logs --deployment
```

### Database Connection Fails

Verify `DATABASE_URL` is injected:
```bash
railway variables
```

### App Crashes After Deploy

Check runtime logs:
```bash
railway logs
```

Common issues:
- Missing environment variables
- Database schema not initialized
- Invalid API keys

## Updating Flowrex

Just push to GitHub:
```bash
git add .
git commit -m "Update Flowrex"
git push origin main
```

Railway auto-deploys within 2-3 minutes.

## Backup Database

### Automated Backups
Railway Pro includes automatic daily backups.

### Manual Backup
```bash
railway run pg_dump $DATABASE_URL > backup.sql
```

## Cost Estimate

- Hobby Plan: ~$5-10/month
- Pro Plan: ~$20-30/month (recommended)
- Includes: PostgreSQL, auto-SSL, CDN, monitoring

## Next Steps

- [ ] Set up custom domain
- [ ] Configure webhook secrets in user workspace settings
- [ ] Enable auto-backups
- [ ] Set up monitoring alerts
