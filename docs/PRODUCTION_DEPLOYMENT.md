# TRINAYAA ENTERPRISES — PRODUCTION DEPLOYMENT GUIDE
## Enterprise Node.js Architecture, Containerization, Reverse Proxy & Operational Procedures

**System Version:** TRINAYAA E-Commerce v1.0.0 (Production)  
**Target Environment:** Linux VPS / Cloud VM (Ubuntu 22.04 / 24.04 LTS or Debian 12) or Docker Engine  
**Domain:** `https://trinayaa.in`  

---

## 1. Hosting Architecture Overview

The TRINAYAA platform is built on an enterprise high-performance stack:
- **Server Runtime**: Node.js v22+ (LTS) running Express and tRPC.
- **Frontend SPA**: React 19 single-page application pre-compiled by Vite into `dist/public` and served by Express with dynamic SEO meta/schema injection.
- **Database Engine**: Embedded SQLite 3 in Write-Ahead Logging (WAL) mode (`data/trinayaa.db`).
- **Media Storage**: Persistent local storage for product catalogue images and admin uploads (`client/public/uploads`).

### Hosting Platform Compatibility:

> [!IMPORTANT]
> **Persistent Disk Required**: Because TRINAYAA utilizes SQLite with WAL concurrency and persistent disk uploads, **serverless/ephemeral static hosts (such as standard Vercel or Netlify static tiers) must NOT be used**, as they discard local file writes when container instances terminate.
> 
> **Recommended Platforms**:
> 1. **VPS / Cloud Instance**: DigitalOcean Droplet, Hetzner Cloud, AWS EC2, or Google Compute Engine running Node.js + PM2 or Docker.
> 2. **Container PaaS with Persistent Volumes**: Railway, Render, or Fly.io with an attached persistent volume mounted at `/app/data` and `/app/client/public/uploads`.

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env` on your production server:

```bash
cp .env.example .env
```

### Essential Production Variables:

```ini
# Server Configuration
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_APP_URL=https://trinayaa.in

# Cryptographic & Session Secrets (Must be 32+ random characters)
SESSION_SECRET=generate_with_openssl_rand_hex_32
JWT_SECRET=generate_with_openssl_rand_hex_32

# Database Path
DATABASE_PATH=/app/data/trinayaa.db

# Live Razorpay Credentials (Obtain from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxx

# Live Telegram Bot Credentials
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_SECRET=your_telegram_webhook_secret_hex
TELEGRAM_ALLOWED_ADMIN_IDS=9988776655,1122334455
```

---

## 3. Deployment Option A: Docker & Docker Compose (Recommended)

### Step 1: Clone Repository & Configure Environment
```bash
git clone <repository_url> /opt/trinayaa
cd /opt/trinayaa
cp .env.example .env
nano .env # Paste your live secrets
```

### Step 2: Ensure Data & Uploads Folders Exist with Proper Permissions
```bash
mkdir -p data client/public/uploads
chmod 755 data client/public/uploads
```

### Step 3: Launch Containers
```bash
docker compose up -d --build
```

### Step 4: Verify Container Health
```bash
docker ps
curl -i http://localhost:3000/health
```

Expected output:
```json
{"status":"ok","uptime":15,"timestamp":"2026-11-02T19:45:00.000Z","service":"trinayaa-storefront-api","version":"1.0.0"}
```

---

## 4. Deployment Option B: Bare-Metal / Native Node.js with PM2

### Step 1: Install Node.js 22 LTS
```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm pm2
```

### Step 2: Build Application
```bash
cd /opt/trinayaa
pnpm install --frozen-lockfile
pnpm build
```

### Step 3: Run Seed Routine (First-Time Only)
```bash
# If data/trinayaa.db does not exist yet:
pnpm db:seed
```

### Step 4: Configure PM2 Process Manager
Create `ecosystem.config.cjs`:
```javascript
module.exports = {
  apps: [
    {
      name: "trinayaa",
      script: "dist/index.js",
      instances: 1, // SQLite requires single-process write access in WAL mode
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
```

Start the application:
```bash
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

---

## 5. Nginx Reverse Proxy & SSL (HTTPS) Configuration

Install Nginx and Certbot:
```bash
sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/trinayaa`:
```nginx
server {
    server_name trinayaa.in www.trinayaa.in;

    client_max_body_size 50M;

    # Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

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
    }

    # Static assets cache control
    location /assets/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Uploads cache control
    location /uploads/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        expires 7d;
        add_header Cache-Control "public, no-transform";
    }
}
```

Enable configuration and generate SSL Certificate:
```bash
sudo ln -s /etc/nginx/sites-available/trinayaa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
sudo certbot --nginx -d trinayaa.in -d www.trinayaa.in
```

---

## 6. Webhook Registration Protocols

### A. Razorpay Webhook Registration
1. Log into your [Razorpay Dashboard](https://dashboard.razorpay.com/).
2. Navigate to **Settings** > **Webhooks** > **Add New Webhook**.
3. **Webhook URL**: `https://trinayaa.in/api/webhooks/razorpay`
4. **Secret**: Enter the exact secret string defined in `RAZORPAY_WEBHOOK_SECRET`.
5. **Active Events**:
   - `order.paid`
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
6. Save and send a test event to verify `200 OK` response.

### B. Telegram Bot Webhook Registration
To connect your production server to Telegram:
```bash
curl -F "url=https://trinayaa.in/api/webhooks/telegram" \
     -F "secret_token=YOUR_TELEGRAM_WEBHOOK_SECRET" \
     https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook
```

To verify webhook status:
```bash
curl https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getWebhookInfo
```

---

## 7. Automated Database Backup Routine

Set up an automated daily backup using cron:

```bash
crontab -e
```

Add the following line to back up the database every day at 3:00 AM:
```cron
0 3 * * * cd /opt/trinayaa && /usr/bin/node scripts/backup_and_restore.js >> /var/log/trinayaa_backup.log 2>&1
```

### Off-Site Backup Recommendation:
Synchronize the `/opt/trinayaa/data/backups/` directory to an encrypted cloud storage bucket (e.g. AWS S3, Google Cloud Storage, or Backblaze B2) using `rclone` or `aws s3 sync`.

---

## 8. Rollback & Disaster Recovery

If database recovery is required:
1. Stop the application:
   ```bash
   pm2 stop trinayaa # or: docker compose stop
   ```
2. Locate the desired backup file in `data/backups/`.
3. Restore the backup:
   ```bash
   cp data/backups/trinayaa_backup_<TIMESTAMP>.db data/trinayaa.db
   ```
4. Restart the application:
   ```bash
   pm2 start trinayaa # or: docker compose start
   ```
5. Confirm health:
   ```bash
   curl http://localhost:3000/health
   ```

