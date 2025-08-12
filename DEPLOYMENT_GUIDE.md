# Atlas Platform - Digital Ocean Deployment Guide

## Server Details
- **IP**: 164.90.214.139
- **User**: root
- **OS**: Ubuntu (assumed)

## Pre-Deployment Checklist

### 1. Production Environment File
Create `.env.production` with these settings:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://164.90.214.139:3000
PORT=3000

# Database (PostgreSQL on Digital Ocean)
DATABASE_URL="postgresql://atlas_user:STRONG_PASSWORD_HERE@localhost:5432/atlas_production"
DIRECT_URL="postgresql://atlas_user:STRONG_PASSWORD_HERE@localhost:5432/atlas_production"

# Security (MUST CHANGE)
JWT_SECRET="generate-256-bit-random-string-here"
JWT_EXPIRES_IN="24h"

# Production Settings
FORCE_HTTPS=false  # Set to true when SSL is configured
SECURE_COOKIES=false  # Set to true with HTTPS
```

## Deployment Steps

### Step 1: Server Setup (SSH to server first)

```bash
ssh root@164.90.214.139
```

### Step 2: Install Prerequisites

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL 15
apt install -y postgresql postgresql-contrib

# Install PM2 for process management
npm install -g pm2

# Install nginx for reverse proxy
apt install -y nginx

# Install git
apt install -y git
```

### Step 3: Setup PostgreSQL Database

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE atlas_production;
CREATE USER atlas_user WITH ENCRYPTED PASSWORD 'YOUR_STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE atlas_production TO atlas_user;

# Enable UUID extension
\c atlas_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
\q
```

### Step 4: Configure PostgreSQL for Local Connections

```bash
# Edit PostgreSQL configuration
nano /etc/postgresql/15/main/postgresql.conf
# Ensure: listen_addresses = 'localhost'

# Edit authentication
nano /etc/postgresql/15/main/pg_hba.conf
# Add: local   all   atlas_user   md5

# Restart PostgreSQL
systemctl restart postgresql
```

### Step 5: Clone and Setup Application

```bash
# Create app directory
mkdir -p /var/www
cd /var/www

# Clone repository
git clone https://github.com/MReda2030/atlas-platform.git
cd atlas-platform

# Install dependencies
npm install

# Create production environment file
nano .env.production
# Paste your production environment variables

# Copy to .env for Prisma
cp .env.production .env
```

### Step 6: Setup Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed initial data
npm run db:seed

# Apply indexes (optional but recommended)
npm run db:indexes
```

### Step 7: Build Application

```bash
# Build Next.js application
npm run build
```

### Step 8: Setup PM2 Process Manager

Create PM2 ecosystem file:

```bash
nano ecosystem.config.js
```

Add content:

```javascript
module.exports = {
  apps: [{
    name: 'atlas-platform',
    script: 'npm',
    args: 'start',
    cwd: '/var/www/atlas-platform',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/log/pm2/atlas-error.log',
    out_file: '/var/log/pm2/atlas-out.log',
    log_file: '/var/log/pm2/atlas-combined.log',
    time: true
  }]
};
```

Start application:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 9: Configure Nginx Reverse Proxy

```bash
nano /etc/nginx/sites-available/atlas-platform
```

Add configuration:

```nginx
server {
    listen 80;
    server_name 164.90.214.139;

    location / {
        proxy_pass http://localhost:3000;
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
ln -s /etc/nginx/sites-available/atlas-platform /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 10: Setup Firewall

```bash
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS (for future)
ufw --force enable
```

## Post-Deployment

### Monitoring Commands

```bash
# Check application status
pm2 status
pm2 logs atlas-platform

# Check nginx status
systemctl status nginx

# Check PostgreSQL
systemctl status postgresql

# View application logs
pm2 logs atlas-platform --lines 100
```

### Update Deployment

```bash
cd /var/www/atlas-platform
git pull origin main
npm install
npm run build
pm2 restart atlas-platform
```

### Backup Database

```bash
# Create backup
pg_dump -U atlas_user atlas_production > backup_$(date +%Y%m%d).sql

# Restore backup
psql -U atlas_user atlas_production < backup_20240101.sql
```

## Security Recommendations

1. **Change default passwords immediately**
2. **Setup SSL certificate** (Let's Encrypt recommended)
3. **Configure firewall rules**
4. **Setup regular backups**
5. **Monitor server resources**
6. **Setup log rotation**
7. **Disable root SSH** (create sudo user instead)

## Troubleshooting

### Application not starting
```bash
pm2 logs atlas-platform --err
npm run build  # Check for build errors
```

### Database connection issues
```bash
psql -U atlas_user -d atlas_production  # Test connection
systemctl status postgresql
```

### Nginx issues
```bash
nginx -t  # Test configuration
tail -f /var/log/nginx/error.log
```

## Performance Optimization

### 1. Enable Redis Cache (Optional)
```bash
apt install redis-server
systemctl enable redis-server
# Update .env with REDIS_URL
```

### 2. Database Indexes
```bash
npm run db:indexes  # Apply performance indexes
```

### 3. PM2 Cluster Mode (for multiple CPUs)
Update ecosystem.config.js:
```javascript
instances: 'max'  // Use all CPU cores
```

## Monitoring Setup (Optional)

### Install monitoring tools
```bash
# System monitoring
apt install htop

# PM2 monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

## Final Steps

1. Access your application at: http://164.90.214.139
2. Login with demo credentials to verify
3. Create production admin user
4. Delete demo users from production
5. Setup regular database backups
6. Configure monitoring alerts

## Support Commands Quick Reference

```bash
# Restart application
pm2 restart atlas-platform

# View logs
pm2 logs atlas-platform

# Database console
psql -U atlas_user -d atlas_production

# Update application
cd /var/www/atlas-platform && git pull && npm install && npm run build && pm2 restart atlas-platform

# Check disk space
df -h

# Check memory
free -h

# Check processes
pm2 status
```

## Important Notes

⚠️ **Security Warning**: 
- Never commit `.env` or `.env.production` files
- Use strong passwords for database and JWT
- Regularly update dependencies
- Monitor server logs for suspicious activity

✅ **Success Indicators**:
- Application accessible via browser
- Database connected successfully
- PM2 showing "online" status
- Nginx serving requests
- No errors in logs

---

For issues, check logs in:
- PM2: `pm2 logs`
- Nginx: `/var/log/nginx/`
- PostgreSQL: `/var/log/postgresql/`