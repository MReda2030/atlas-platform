#!/bin/bash

# Atlas Platform - Digital Ocean Deployment Script
# This script automates the deployment process on Ubuntu server

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DB_NAME="atlas_production"
DB_USER="atlas_user"
APP_DIR="/var/www/atlas-platform"
REPO_URL="https://github.com/MReda2030/atlas-platform.git"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to generate secure password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_status "Starting Atlas Platform deployment..."

# Step 1: Update system
print_status "Step 1: Updating system packages..."
apt update && apt upgrade -y

# Step 2: Install Node.js 20 LTS
print_status "Step 2: Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node installation
node_version=$(node -v)
print_status "Node.js installed: $node_version"

# Step 3: Install PostgreSQL
print_status "Step 3: Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Step 4: Install other dependencies
print_status "Step 4: Installing PM2, Nginx, and Git..."
npm install -g pm2
apt install -y nginx git

# Step 5: Generate secure passwords
print_status "Step 5: Generating secure passwords..."
DB_PASSWORD=$(generate_password)
JWT_SECRET=$(generate_password)

echo "==============================================="
echo "IMPORTANT: Save these credentials securely!"
echo "Database Password: $DB_PASSWORD"
echo "JWT Secret: $JWT_SECRET"
echo "==============================================="

# Step 6: Setup PostgreSQL Database
print_status "Step 6: Setting up PostgreSQL database..."

# Create database and user
sudo -u postgres psql <<EOF
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER DATABASE $DB_NAME OWNER TO $DB_USER;
\c $DB_NAME
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
GRANT ALL ON SCHEMA public TO $DB_USER;
EOF

# Configure PostgreSQL for local connections
PG_VERSION=$(ls /etc/postgresql/ | head -n1)
echo "local   all   $DB_USER   md5" >> /etc/postgresql/$PG_VERSION/main/pg_hba.conf
systemctl restart postgresql

print_status "Database setup complete!"

# Step 7: Clone repository
print_status "Step 7: Cloning repository..."
mkdir -p /var/www
cd /var/www

if [ -d "$APP_DIR" ]; then
    print_warning "Application directory exists. Backing up..."
    mv $APP_DIR ${APP_DIR}_backup_$(date +%Y%m%d_%H%M%S)
fi

git clone $REPO_URL
cd $APP_DIR

# Step 8: Install dependencies
print_status "Step 8: Installing application dependencies..."
npm install

# Step 9: Create production environment file
print_status "Step 9: Creating production environment file..."
cat > .env.production <<EOF
# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://164.90.214.139
PORT=3000
APP_NAME="Atlas Travel Platform"
APP_VERSION="1.0.0"

# Database Configuration
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"
DIRECT_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME"

# Security
JWT_SECRET="$JWT_SECRET"
JWT_EXPIRES_IN="24h"
FORCE_HTTPS=false
SECURE_COOKIES=false
HSTS_MAX_AGE=31536000

# Logging
LOG_LEVEL=info
LOG_FILE="/var/log/atlas/app.log"

# Performance
MAX_CONNECTIONS=50
CONNECTION_TIMEOUT=30000
QUERY_TIMEOUT=15000

# Production
NEXT_TELEMETRY_DISABLED=1
INSTANCE_ID="prod-1"

# Features
FEATURE_ANALYTICS_V2=true
FEATURE_ADVANCED_REPORTING=true
FEATURE_AUDIT_LOGS=true
FEATURE_AUTO_BACKUP=false
EOF

# Copy to .env for Prisma
cp .env.production .env

print_status "Environment configuration created!"

# Step 10: Setup database schema
print_status "Step 10: Setting up database schema..."
npm run db:generate
npm run db:push

# Ask about seeding
read -p "Do you want to seed the database with demo data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run db:seed
    print_status "Database seeded with demo data"
else
    print_warning "Skipped database seeding"
fi

# Step 11: Build application
print_status "Step 11: Building application..."
npm run build

# Step 12: Setup PM2
print_status "Step 12: Setting up PM2 process manager..."

# Create PM2 ecosystem file
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
    },
    error_file: '/var/log/pm2/atlas-error.log',
    out_file: '/var/log/pm2/atlas-out.log',
    log_file: '/var/log/pm2/atlas-combined.log',
    time: true
  }]
};
EOF

# Create log directory
mkdir -p /var/log/pm2
mkdir -p /var/log/atlas

# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root

# Step 13: Configure Nginx
print_status "Step 13: Configuring Nginx reverse proxy..."

# Create Nginx configuration
cat > /etc/nginx/sites-available/atlas-platform <<'EOF'
server {
    listen 80;
    server_name 164.90.214.139;
    
    client_max_body_size 10M;
    
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
        proxy_read_timeout 90;
    }
}
EOF

# Remove default Nginx site if exists
rm -f /etc/nginx/sites-enabled/default

# Enable site
ln -sf /etc/nginx/sites-available/atlas-platform /etc/nginx/sites-enabled/

# Test and restart Nginx
nginx -t
systemctl restart nginx

# Step 14: Setup firewall
print_status "Step 14: Setting up firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Step 15: Create helpful scripts
print_status "Step 15: Creating management scripts..."

# Create update script
cat > /root/update-atlas.sh <<'EOF'
#!/bin/bash
cd /var/www/atlas-platform
git pull origin main
npm install
npm run build
pm2 restart atlas-platform
echo "Application updated successfully!"
EOF
chmod +x /root/update-atlas.sh

# Create backup script
cat > /root/backup-atlas.sh <<'EOF'
#!/bin/bash
BACKUP_DIR="/root/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
cd /var/www/atlas-platform
pg_dump -U atlas_user atlas_production > $BACKUP_DIR/atlas_db_$DATE.sql
tar -czf $BACKUP_DIR/atlas_files_$DATE.tar.gz .env.production public/
echo "Backup created at $BACKUP_DIR"
ls -lh $BACKUP_DIR/
EOF
chmod +x /root/backup-atlas.sh

# Final status check
print_status "Checking deployment status..."
echo ""
echo "==============================================="
echo "DEPLOYMENT STATUS"
echo "==============================================="

# Check PM2
if pm2 list | grep -q "atlas-platform"; then
    echo "✅ Application: Running"
else
    echo "❌ Application: Not running"
fi

# Check Nginx
if systemctl is-active --quiet nginx; then
    echo "✅ Nginx: Active"
else
    echo "❌ Nginx: Not active"
fi

# Check PostgreSQL
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL: Active"
else
    echo "❌ PostgreSQL: Not active"
fi

echo ""
echo "==============================================="
echo "DEPLOYMENT COMPLETE!"
echo "==============================================="
echo ""
echo "🌐 Application URL: http://164.90.214.139"
echo ""
echo "📝 IMPORTANT - Save these credentials:"
echo "   Database Password: $DB_PASSWORD"
echo "   JWT Secret: $JWT_SECRET"
echo ""
echo "📁 Application Location: /var/www/atlas-platform"
echo ""
echo "🔧 Useful Commands:"
echo "   View logs: pm2 logs atlas-platform"
echo "   Restart app: pm2 restart atlas-platform"
echo "   Update app: /root/update-atlas.sh"
echo "   Create backup: /root/backup-atlas.sh"
echo ""
echo "🔐 Default Login Credentials:"
echo "   Admin: admin@atlas.com / password123"
echo "   Buyer: buyer@atlas.com / password123"
echo ""
echo "⚠️  SECURITY REMINDER:"
echo "   1. Change default passwords immediately"
echo "   2. Consider setting up SSL certificate"
echo "   3. Create a non-root user for better security"
echo ""
echo "==============================================="