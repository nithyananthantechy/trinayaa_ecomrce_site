# TRINAYAA E-COMMERCE — PRODUCTION DEPLOYMENT GUIDE

**Target System:** Linux VPS (Ubuntu 22.04 LTS / 24.04 LTS or Debian 12) / Docker Container  
**Application Stack:** Node.js 22 LTS, SQLite 3 (WAL mode), Vite + React 19, Nginx / Reverse Proxy  
**Entity:** TRINAYAA ENTERPRISES, Erode, Tamil Nadu  

---

## 1. System Prerequisites

Before deployment, ensure the production server has the following packages installed:

- **Operating System:** Ubuntu 22.04 / 24.04 LTS (recommended) or Debian 12.
- **Node.js:** Version `22.x LTS` (or `24.x`).
- **Package Manager:** `pnpm` (version `10.18.0` via Corepack) or `npm`.
- **Process Manager:** `pm2` or `systemd`.
- **Web Server:** `nginx` (with Let's Encrypt Certbot for SSL).
- **Disk Space:** Minimum 10 GB free space (for botanical image assets, database, and backups).
- **RAM:** Minimum 2 GB RAM (4 GB recommended).

---

## 2. Server Environment Setup

### 2.1 Install Node.js 22 & Corepack
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git build-essential sqlite3

# Install Node.js 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Expected: v22.x or later
npm -v    # Expected: v10.x or later

# Enable pnpm via corepack
sudo corepack enable
sudo corepack prepare pnpm@10.18.0 --activate
pnpm -v   # Expected: 10.18.0
```

### 2.2 Clone Application Code
```bash
# Create dedicated application directory
sudo mkdir -p /var/www/trinayaa
sudo chown -R $USER:$USER /var/www/trinayaa

# Clone the repository
git clone <YOUR_GIT_REPOSITORY_URL> /var/www/trinayaa
cd /var/www/trinayaa
```

### 2.3 Install Dependencies
```bash
# Install frozen production dependencies
pnpm install --frozen-lockfile
```

---

## 3. Environment Configuration (`.env`)

Create the production `.env` file from the verified `.env.example`:

```bash
cp .env.example .env
nano .env
```

### Required Production Environment Variables:

```dotenv
# ==========================================
# TRINAYAA PRODUCTION ENVIRONMENT
# ==========================================

# Node & Server Runtime
NODE_ENV=production
PORT=3000
PUBLIC_BASE_URL=https://trinayaa.in
NEXT_PUBLIC_APP_URL=https://trinayaa.in

# Cryptographic & Session Secrets (Generate with `openssl rand -hex 32`)
SESSION_SECRET=REPLACE_WITH_UNIQUE_64_CHAR_HEX_SECRET
JWT_SECRET=REPLACE_WITH_UNIQUE_64_CHAR_HEX_SECRET

# Database Path (Ensure directory exists and has write permissions)
DATABASE_PATH=/var/www/trinayaa/data/trinayaa.db
DATABASE_URL=sqlite:/var/www/trinayaa/data/trinayaa.db

# Live Razorpay Credentials (from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Telegram Admin Bot (from @BotFather)
TELEGRAM_BOT_TOKEN=xxxxxxxxxx:xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TELEGRAM_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# Authorized Admin Telegram Numerical Chat IDs (comma-separated)
TELEGRAM_ALLOWED_ADMIN_IDS=123456789,987654321
TELEGRAM_ADMIN_IDS=123456789,987654321

# Optional Outbound Email (SMTP)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=support@trinayaa.in
# SMTP_PASS=app_specific_password_here
# SMTP_FROM="TRINAYAA Enterprises <support@trinayaa.in>"
```

> **Security Note:** Ensure file permissions on `.env` are restricted to the application user:
> `chmod 600 /var/www/trinayaa/.env`

---

## 4. Database Setup & Directory Permissions

Ensure the persistent `data/` and `uploads/` directories exist with proper permissions:

```bash
mkdir -p /var/www/trinayaa/data
mkdir -p /var/www/trinayaa/client/public/uploads
mkdir -p /var/www/trinayaa/backups

# Copy the verified baseline database if migrating
# cp /path/to/trinayaa.db /var/www/trinayaa/data/trinayaa.db

# Verify SQLite integrity
node -e "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync('/var/www/trinayaa/data/trinayaa.db'); console.log(db.prepare('PRAGMA integrity_check').get());"
```

---

## 5. Build & Startup

### 5.1 Build the Application
```bash
# Compiles Vite frontend to dist/public and bundles Express server to dist/index.js
pnpm run build
```

### 5.2 Process Management with PM2
Install PM2 globally to manage background execution, auto-restart on crashes, and system reboot recovery:

```bash
sudo npm install -g pm2

# Start TRINAYAA server
pm2 start dist/index.js --name "trinayaa-storefront" --time

# Verify application status
pm2 status
pm2 logs trinayaa-storefront --lines 50

# Configure auto-startup on server boot
pm2 startup
pm2 save
```

---

## 6. Nginx Reverse Proxy & SSL Configuration

### 6.1 Nginx Site Configuration
Create `/etc/nginx/sites-available/trinayaa`:

```nginx
server {
    server_name trinayaa.in www.trinayaa.in;

    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Static uploads and media caching
    location /uploads/ {
        alias /var/www/trinayaa/client/public/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    location /images/ {
        alias /var/www/trinayaa/client/public/images/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Reverse proxy to Node.js application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/trinayaa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6.2 SSL Setup via Certbot (HTTPS)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d trinayaa.in -d www.trinayaa.in
```

---

## 7. Automated Database Backup Routine

Set up an automated daily backup cron job to protect customer data:

```bash
# Open crontab
crontab -e

# Add daily backup at 03:00 AM IST (21:30 UTC):
30 21 * * * cp /var/www/trinayaa/data/trinayaa.db /var/www/trinayaa/backups/trinayaa_backup_$(date +\%Y\%m\%d_\%H\%M\%S).db && find /var/www/trinayaa/backups -type f -name "*.db" -mtime +30 -delete
```

---

## 8. Rollback Procedure

If a deployed release requires immediate rollback:

1. Stop current application:
   ```bash
   pm2 stop trinayaa-storefront
   ```
2. Checkout previous known stable Git tag:
   ```bash
   git checkout 91b5e95
   ```
3. Restore database backup if schema or data was modified:
   ```bash
   cp /var/www/trinayaa/backups/<TARGET_BACKUP_NAME>.db /var/www/trinayaa/data/trinayaa.db
   ```
4. Rebuild and restart:
   ```bash
   pnpm run build
   pm2 restart trinayaa-storefront
   ```
5. Check health:
   ```bash
   curl -I http://localhost:3000/health
   ```
