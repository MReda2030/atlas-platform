# Manual Deployment Commands for Digital Ocean

Run these commands on your server after connecting via SSH: `ssh root@164.90.214.139`

## Step 1: Update System
```bash
apt update && apt upgrade -y
```

## Step 2: Install Node.js 20 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs
node -v  # Verify installation
```

## Step 3: Install PostgreSQL
```bash
apt install -y postgresql postgresql-contrib
```

## Step 4: Install Additional Tools
```bash
npm install -g pm2
apt install -y nginx git
```

## Step 5: Setup PostgreSQL Database
```bash
# Generate a strong password first
DB_PASSWORD=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-25)
echo "Database Password: $DB_PASSWORD"

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE atlas_production;
CREATE USER atlas_user WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE atlas_production TO atlas_user;
ALTER DATABASE atlas_production OWNER TO atlas_user;
\c atlas_production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL ON SCHEMA public TO atlas_user;
EOF
```

## Step 6: Configure PostgreSQL
```bash
# Get PostgreSQL version
PG_VERSION=$(ls /etc/postgresql/ | head -n1)
echo "local   all   atlas_user   md5" >> /etc/postgresql/$PG_VERSION/main/pg_hba.conf
systemctl restart postgresql
```

## Step 7: Clone Repository
```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/MReda2030/atlas-platform.git
cd atlas-platform
```

## Step 8: Install Dependencies
```bash
npm install
```

## Step 9: Create Environment File
```bash
# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 32)

cat > .env.production <<EOF
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://164.90.214.139
PORT=3000
DATABASE_URL="postgresql://atlas_user:$DB_PASSWORD@localhost:5432/atlas_production"
DIRECT_URL="postgresql://atlas_user:$DB_PASSWORD@localhost:5432/atlas_production"
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="24h"
FORCE_HTTPS=false
SECURE_COOKIES=false
LOG_LEVEL=info
NEXT_TELEMETRY_DISABLED=1
EOF

cp .env.production .env
```

## Step 10: Setup Database Schema
```bash
npm run db:generate
npm run db:push
npm run db:seed  # Optional: seed demo data
```

## Step 11: Build Application
```bash
npm run build
```

## Step 12: Setup PM2
```bash
cat > ecosystem.config.js <<'EOF'
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
    }
  }]
};
EOF

mkdir -p /var/log/pm2 /var/log/atlas
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 13: Configure Nginx
```bash
cat > /etc/nginx/sites-available/atlas-platform <<'EOF'
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
EOF

rm -f /etc/nginx/sites-enabled/default
ln -sf /etc/nginx/sites-available/atlas-platform /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

## Step 14: Setup Firewall
```bash
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## Step 15: Verify Deployment
```bash
pm2 status
systemctl status nginx
systemctl status postgresql
curl http://localhost:3000
```

## Success Indicators
- ✅ PM2 shows "online" status
- ✅ Nginx is active
- ✅ Application responds to curl
- ✅ Access via browser: http://164.90.214.139

## Default Login Credentials
- **Admin**: admin@atlas.com / password123
- **Buyer**: buyer@atlas.com / password123

## Important Notes
1. **Save the generated passwords** (DB_PASSWORD and JWT_SECRET)
2. **Change default login passwords** immediately after first login
3. **Consider setting up SSL certificate** for HTTPS
4. **Setup regular backups** of database and files

## Troubleshooting Commands
```bash
# View application logs
pm2 logs atlas-platform

# Restart application
pm2 restart atlas-platform

# Check Nginx logs
tail -f /var/log/nginx/error.log

# Test database connection
psql -U atlas_user -d atlas_production
```