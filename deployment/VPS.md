# Flowrex VPS Deployment Guide

Deploy Flowrex on your own VPS (DigitalOcean, Vultr, Linode, AWS EC2, etc.) for maximum control and cost optimization.

## Prerequisites

- VPS with Ubuntu 22.04 LTS (minimum 2GB RAM recommended)
- Root or sudo access
- Domain name (optional but recommended)

## Step 1: Server Setup

### Connect to VPS
```bash
ssh root@your-server-ip
```

### Update system
```bash
apt update && apt upgrade -y
```

### Install Docker & Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
apt install docker-compose -y

# Verify installation
docker --version
docker-compose --version
```

### Install additional tools
```bash
apt install -y git curl nginx certbot python3-certbot-nginx
```

## Step 2: Clone Repository

```bash
# Create app directory
mkdir -p /opt/flowrex
cd /opt/flowrex

# Clone your repository
git clone https://github.com/your-username/flowrex.git .

# Or if using SSH
git clone git@github.com:your-username/flowrex.git .
```

## Step 3: Configure Environment

```bash
# Copy production template
cp deployment/production.env.template .env

# Edit with your values
nano .env
```

Fill in ALL required values:
```bash
NODE_ENV=production
PORT=4000

# Generate secrets
JWT_SECRET=$(openssl rand -base64 64)
ENCRYPTION_KEY=$(openssl rand -base64 32)

# Add your API keys
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://flowrex:password@postgres:5432/flowrex
DB_PASSWORD=your-secure-db-password
```

## Step 4: Build and Start Services

```bash
# Build Docker images
docker-compose build

# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app
```

## Step 5: Initialize Database

```bash
# Wait for PostgreSQL to be ready
docker-compose exec postgres pg_isready

# Run schema migration
docker-compose exec -T postgres psql -U flowrex -d flowrex < db/schema.sql

# Verify tables created
docker-compose exec postgres psql -U flowrex -d flowrex -c "\dt"
```

## Step 6: Configure Nginx Reverse Proxy

### Option A: Using included nginx.conf (recommended)

```bash
# Copy nginx config
cp deployment/nginx.conf /etc/nginx/nginx.conf

# Test configuration
nginx -t

# Reload nginx
systemctl reload nginx
```

### Option B: Simple reverse proxy

Create `/etc/nginx/sites-available/flowrex`:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
ln -s /etc/nginx/sites-available/flowrex /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

## Step 7: SSL Certificate (Let's Encrypt)

```bash
# Stop nginx temporarily
systemctl stop nginx

# Get certificate
certbot --nginx -d your-domain.com

# Auto-renewal is configured by default
# Test renewal
certbot renew --dry-run

# Start nginx
systemctl start nginx
```

## Step 8: Firewall Configuration

```bash
# Allow SSH, HTTP, HTTPS
ufw allow OpenSSH
ufw allow 'Nginx Full'

# Enable firewall
ufw enable

# Check status
ufw status
```

## Step 9: Auto-Start on Boot

```bash
# Enable Docker service
systemctl enable docker

# Ensure containers restart on boot
# (already configured in docker-compose.yml with restart: unless-stopped)
```

## Step 10: Monitoring Setup

### Create systemd health check service

Create `/etc/systemd/system/flowrex-healthcheck.service`:

```ini
[Unit]
Description=Flowrex Health Check
After=docker.service

[Service]
Type=oneshot
WorkingDirectory=/opt/flowrex
ExecStart=/usr/bin/docker-compose exec -T app /app/healthcheck.sh

[Install]
WantedBy=multi-user.target
```

Create timer `/etc/systemd/system/flowrex-healthcheck.timer`:

```ini
[Unit]
Description=Run Flowrex health check every 5 minutes

[Timer]
OnBootSec=5min
OnUnitActiveSec=5min

[Install]
WantedBy=timers.target
```

Enable:
```bash
systemctl daemon-reload
systemctl enable flowrex-healthcheck.timer
systemctl start flowrex-healthcheck.timer
```

## Maintenance

### View Logs
```bash
# All services
docker-compose logs -f

# Just app
docker-compose logs -f app

# Just database
docker-compose logs -f postgres
```

### Update Flowrex
```bash
cd /opt/flowrex

# Pull latest code
git pull origin main

# Rebuild and restart
docker-compose down
docker-compose build
docker-compose up -d

# Check status
docker-compose ps
```

### Backup Database
```bash
# Create backup
docker-compose exec postgres pg_dump -U flowrex flowrex > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-$(date +%Y%m%d).sql
```

### Restore Database
```bash
# Decompress
gunzip backup-20240101.sql.gz

# Restore
docker-compose exec -T postgres psql -U flowrex -d flowrex < backup-20240101.sql
```

## Automated Backups

Create `/opt/flowrex/scripts/backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/flowrex/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

docker-compose exec -T postgres pg_dump -U flowrex flowrex | gzip > "$BACKUP_DIR/flowrex_$DATE.sql.gz"

# Keep only last 30 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +30 -delete

echo "Backup completed: flowrex_$DATE.sql.gz"
```

Make executable:
```bash
chmod +x /opt/flowrex/scripts/backup.sh
```

Add to crontab:
```bash
crontab -e

# Add line:
0 2 * * * /opt/flowrex/scripts/backup.sh
```

## Performance Tuning

### PostgreSQL
Edit `docker-compose.yml` to add:
```yaml
postgres:
  command: postgres -c shared_buffers=256MB -c max_connections=200
```

### App Scaling
To run multiple app instances:
```yaml
app:
  deploy:
    replicas: 3
```

## Troubleshooting

### App won't start
```bash
# Check logs
docker-compose logs app

# Check if port 4000 is in use
lsof -i :4000

# Restart services
docker-compose restart
```

### Database connection errors
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Check database logs
docker-compose logs postgres

# Verify DATABASE_URL
docker-compose exec app env | grep DATABASE_URL
```

### SSL issues
```bash
# Check certificate
certbot certificates

# Renew certificate
certbot renew

# Check nginx config
nginx -t
```

## Cost Estimate (VPS)

- **DigitalOcean**: $12-24/month (2-4GB RAM)
- **Vultr**: $10-20/month (2-4GB RAM)
- **Linode**: $12-24/month (2-4GB RAM)
- **Hetzner**: $5-15/month (2-4GB RAM, best value)

## Security Checklist

- [ ] Strong passwords for database
- [ ] JWT_SECRET and ENCRYPTION_KEY generated securely
- [ ] Firewall enabled
- [ ] SSH key authentication (disable password auth)
- [ ] SSL certificate installed
- [ ] Regular backups configured
- [ ] Auto-updates enabled
- [ ] Monitoring in place

## Next Steps

- Set up monitoring (Uptime Robot, Better Uptime)
- Configure log rotation
- Set up error tracking (Sentry)
- Enable CDN (Cloudflare)
- Configure automatic updates
