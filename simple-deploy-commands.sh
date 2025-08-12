#!/bin/bash
# Simple Atlas Platform Deployment Script
# Run these commands one by one on your server

echo "=== ATLAS PLATFORM DEPLOYMENT ==="
echo "Run these commands step by step after connecting to your server:"
echo "ssh root@164.90.214.139"
echo ""

echo "=== STEP 1: Install Node.js ==="
echo "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -"
echo "apt install -y nodejs"
echo "node -v  # Should show v20.x.x"
echo ""

echo "=== STEP 2: Install Other Tools ==="
echo "apt install -y postgresql postgresql-contrib nginx git"
echo "npm install -g pm2"
echo ""

echo "=== STEP 3: Setup Database ==="
echo "sudo -u postgres createdb atlas_production"
echo "sudo -u postgres psql -c \"CREATE USER atlas_user WITH PASSWORD 'Atlas2024!DB';\""
echo "sudo -u postgres psql -c \"GRANT ALL PRIVILEGES ON DATABASE atlas_production TO atlas_user;\""
echo "sudo -u postgres psql -d atlas_production -c \"CREATE EXTENSION IF NOT EXISTS 'uuid-ossp';\""
echo ""

echo "=== STEP 4: Clone Repository ==="
echo "mkdir -p /var/www && cd /var/www"
echo "git clone https://github.com/MReda2030/atlas-platform.git"
echo "cd atlas-platform"
echo ""

echo "=== STEP 5: Install Dependencies ==="
echo "npm install"
echo ""

echo "=== STEP 6: Create Environment File ==="
cat << 'EOF'
cat > .env << 'ENVEOF'
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://164.90.214.139
PORT=3000
DATABASE_URL="postgresql://atlas_user:Atlas2024!DB@localhost:5432/atlas_production"
DIRECT_URL="postgresql://atlas_user:Atlas2024!DB@localhost:5432/atlas_production"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-12345"
JWT_EXPIRES_IN="24h"
ENVEOF
EOF
echo ""

echo "=== STEP 7: Setup Database Schema ==="
echo "npm run db:generate"
echo "npm run db:push"
echo "npm run db:seed"
echo ""

echo "=== STEP 8: Build Application ==="
echo "npm run build"
echo ""

echo "=== STEP 9: Start with PM2 ==="
echo "pm2 start npm --name atlas-platform -- start"
echo "pm2 save"
echo "pm2 startup"
echo ""

echo "=== STEP 10: Configure Nginx ==="
cat << 'EOF'
cat > /etc/nginx/sites-available/atlas-platform << 'NGINXEOF'
server {
    listen 80;
    server_name 164.90.214.139;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF
EOF
echo ""
echo "ln -sf /etc/nginx/sites-available/atlas-platform /etc/nginx/sites-enabled/"
echo "rm -f /etc/nginx/sites-enabled/default"
echo "nginx -t"
echo "systemctl restart nginx"
echo ""

echo "=== STEP 11: Setup Firewall ==="
echo "ufw allow 22/tcp"
echo "ufw allow 80/tcp"
echo "ufw --force enable"
echo ""

echo "=== STEP 12: Check Status ==="
echo "pm2 status"
echo "systemctl status nginx"
echo "curl http://localhost:3000"
echo ""

echo "=== DEPLOYMENT COMPLETE ==="
echo "Visit: http://164.90.214.139"
echo "Login: admin@atlas.com / password123"