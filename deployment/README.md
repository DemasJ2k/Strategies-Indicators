# 🚀 Flowrex Production Deployment Guide

Transform Flowrex from a local development tool into a production-ready, always-on trading platform.

## 📋 Deployment Options

Choose the deployment method that best fits your needs:

| Option | Best For | Cost | Difficulty | Setup Time |
|--------|----------|------|------------|------------|
| **Railway** | Quick deployment, zero DevOps | $5-20/mo | ⭐ Easy | 10 min |
| **Render** | Alternative PaaS option | $7-25/mo | ⭐ Easy | 15 min |
| **VPS** | Full control, cost optimization | $5-24/mo | ⭐⭐⭐ Moderate | 30-60 min |
| **Docker Compose** | Local/staging deployment | Free | ⭐⭐ Easy | 5 min |

## Quick Start Guides

- **[Railway Deployment →](./RAILWAY.md)** - Recommended for beginners
- **[VPS Deployment →](./VPS.md)** - For advanced users wanting full control
- **[Docker Compose →](#local-docker-compose)** - For local testing

## 🎯 What You Get After Deployment

### Production Features

✅ **Always-On Backend**
- Server runs 24/7
- Auto-restarts on crashes
- Health checks + monitoring

✅ **Secure HTTPS**
- Auto SSL certificates
- Encrypted connections
- Protected webhooks

✅ **Production Database**
- PostgreSQL with backups
- Auto-scaling
- Connection pooling

✅ **WebSocket Support**
- Real-time market data
- Live signal updates
- Socket.IO persistence

✅ **Multi-User Ready**
- User authentication
- Encrypted secrets
- Workspace isolation

✅ **Webhook Integration**
- MT5 → Flowrex
- TradingView → Flowrex
- Live broker feeds

## 📦 Deployment Files

```
deployment/
├── README.md                   # This file
├── RAILWAY.md                  # Railway deployment guide
├── VPS.md                      # VPS deployment guide
├── Dockerfile.backend          # Backend Node/TS container
├── Dockerfile.frontend         # Frontend React + Nginx container
├── nginx.frontend.conf         # Frontend nginx config with API proxy
├── docker-compose.yml          # 3-service orchestration (postgres + backend + frontend)
├── healthcheck.sh              # Health monitoring script
└── production.env.template     # Production environment template

.dockerignore                   # Docker build optimization
```

## 🔧 Pre-Deployment Checklist

Before deploying, ensure you have:

- [ ] **OpenAI API Key** (required for AI assistant)
- [ ] **PostgreSQL Database** (auto-provisioned on Railway/Render)
- [ ] **JWT Secret** - Generate: `openssl rand -base64 64`
- [ ] **Encryption Key** - Generate: `openssl rand -base64 32`
- [ ] **Domain Name** (optional but recommended)
- [ ] **Broker API Keys** (optional - users can add their own)

## 🐳 Local Docker Compose

Perfect for testing before production deployment.

### Quick Start

```bash
# 1. Copy environment template
cp deployment/production.env.template deployment/production.env

# 2. Edit production.env and fill in required values
nano deployment/production.env

# 3. Generate secrets
echo "JWT_SECRET=$(openssl rand -base64 64)" >> deployment/production.env
echo "ENCRYPTION_KEY=$(openssl rand -base64 32)" >> deployment/production.env

# 4. Start services (postgres + backend + frontend)
cd deployment
docker-compose up -d

# 5. Check status
docker-compose ps

# 6. View logs
docker-compose logs -f backend

# 7. Test backend health
./healthcheck.sh

# Or test manually
curl http://localhost:4000/health  # Backend
curl http://localhost:8080/health  # Frontend
```

### Access Flowrex

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:8080/api (proxied through nginx)
- **Direct Backend**: http://localhost:4000 (internal, not exposed)
- **Health Checks**:
  - Backend: http://localhost:4000/health
  - Frontend: http://localhost:8080/health

### Stop Services

```bash
docker-compose down
```

### View Logs

```bash
# All services
docker-compose logs -f

# Backend only
docker-compose logs -f backend

# Frontend only
docker-compose logs -f frontend

# Database only
docker-compose logs -f postgres
```

## 🔐 Security Best Practices

### Environment Variables

**NEVER** commit `.env` files to version control!

```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo "*.env" >> .gitignore
```

### Generate Strong Secrets

```bash
# JWT Secret (64 bytes)
openssl rand -base64 64

# Encryption Key (32 bytes)
openssl rand -base64 32

# Database Password
openssl rand -base64 24
```

### Webhook Security

Each user sets their own unique webhook secrets in Workspace Settings:
- MT5 webhook secret
- TradingView webhook secret

Never share these secrets or commit them to code.

## 📊 Monitoring & Logs

### Health Checks

All deployments include automatic health monitoring:

```bash
# Manual health check
curl https://your-domain.com/health

# Expected response
{"status":"ok","timestamp":"2024-01-01T00:00:00.000Z","service":"Market Playbook Agent API"}
```

### Application Logs

**Railway:**
```bash
railway logs
```

**Docker Compose:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

**VPS:**
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
journalctl -u flowrex -f
```

### Database Logs

```bash
docker-compose logs -f postgres
```

## 🔄 Updates & Rollbacks

### Update Flowrex

**Railway:** Push to GitHub
```bash
git push origin main
# Auto-deploys in 2-3 minutes
```

**VPS:**
```bash
cd /opt/flowrex
git pull origin main
docker-compose down
docker-compose build
docker-compose up -d
```

### Rollback

**Railway:**
- Dashboard → Deployments → Click previous deployment → Redeploy

**VPS:**
```bash
git log --oneline  # Find commit
git checkout <commit-hash>
docker-compose down
docker-compose build
docker-compose up -d
```

## 💾 Database Backups

### Automated Backups

**Railway Pro:** Automatic daily backups included

**VPS:** Set up cron job (see VPS.md)

### Manual Backup

```bash
# Docker Compose
docker-compose exec postgres pg_dump -U flowrex flowrex > backup.sql

# Compress
gzip backup.sql
```

### Restore Backup

```bash
# Decompress
gunzip backup.sql.gz

# Restore
docker-compose exec -T postgres psql -U flowrex -d flowrex < backup.sql
```

## 🌐 Custom Domain Setup

### Railway

1. Project Settings → Domains
2. Add custom domain: `app.yourdomain.com`
3. Add CNAME record in your DNS:
   ```
   CNAME app -> your-app.up.railway.app
   ```

### VPS with Let's Encrypt

```bash
# Install certbot
apt install certbot python3-certbot-nginx

# Get certificate
certbot --nginx -d yourdomain.com

# Auto-renews every 90 days
```

## 🐛 Troubleshooting

### Backend Won't Start

```bash
# Check logs
docker-compose logs backend

# Check environment
docker-compose exec backend env | grep -i key

# Restart
docker-compose restart backend
```

### Frontend Won't Load

```bash
# Check logs
docker-compose logs frontend

# Check nginx config
docker-compose exec frontend nginx -t

# Restart
docker-compose restart frontend
```

### Database Connection Errors

```bash
# Check PostgreSQL
docker-compose ps postgres
docker-compose logs postgres

# Test connection
docker-compose exec postgres psql -U flowrex -d flowrex -c "SELECT 1"
```

### WebSocket Issues

Check nginx configuration supports WebSocket upgrades:
```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### SSL Certificate Errors

```bash
# Check certificate
certbot certificates

# Renew
certbot renew --dry-run
```

## 📈 Performance Optimization

### Database Tuning

Add to `docker-compose.yml`:
```yaml
postgres:
  command: |
    postgres
    -c shared_buffers=256MB
    -c max_connections=200
    -c effective_cache_size=1GB
```

### Backend Scaling

Run multiple backend instances:
```yaml
backend:
  deploy:
    replicas: 3
```

### Frontend Scaling

Run multiple frontend instances:
```yaml
frontend:
  deploy:
    replicas: 2
```

### Caching

Add Redis for session storage (optional):
```yaml
redis:
  image: redis:alpine
  restart: unless-stopped
```

## 🎯 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] Database schema initialized
- [ ] SSL certificate installed
- [ ] Health checks passing
- [ ] Backups configured
- [ ] Monitoring set up
- [ ] Webhook URLs updated (MT5, TradingView)
- [ ] Test user registration and login
- [ ] Test all major features (signals, journal, portfolio)
- [ ] Load testing performed

## 💰 Cost Comparison

| Platform | Setup | Monthly Cost | Included |
|----------|-------|-------------|----------|
| **Railway Hobby** | 5 min | $5-10 | DB, SSL, monitoring |
| **Railway Pro** | 5 min | $20-30 | + Auto-backups, higher limits |
| **VPS (Hetzner)** | 60 min | $5-15 | Full control, manual setup |
| **VPS (DigitalOcean)** | 60 min | $12-24 | Easier setup, more support |

## 📚 Next Steps

After successful deployment:

1. **Configure Webhooks**
   - Update MT5 EA with your production webhook URL
   - Update TradingView alerts
   - Test webhook delivery

2. **Set Up Monitoring**
   - Uptime monitoring (UptimeRobot, Better Uptime)
   - Error tracking (Sentry)
   - Log aggregation

3. **Enable Backups**
   - Database backups
   - Environment variable backups
   - Code repository backups

4. **Scale as Needed**
   - Monitor resource usage
   - Upgrade plan when necessary
   - Add caching layer if needed

## 🆘 Support & Resources

- **Documentation**: Check individual deployment guides
- **Logs**: Always check logs first for debugging
- **Health Endpoint**: Monitor `/health` for uptime

## 🎉 Success Indicators

Your deployment is successful when:

- ✅ `/health` endpoint returns 200 OK
- ✅ Frontend loads without errors
- ✅ User can register and login
- ✅ Signals are generated correctly
- ✅ Webhooks receive and process data
- ✅ Database persists data across restarts
- ✅ WebSocket connections stay alive

---

**Congratulations!** You now have a production-ready, institutional-grade trading platform running 24/7. 🚀
