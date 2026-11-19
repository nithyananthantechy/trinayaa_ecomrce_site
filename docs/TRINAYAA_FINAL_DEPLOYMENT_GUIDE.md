# TRINAYAA ENTERPRISES — PRODUCTION DEPLOYMENT GUIDE
## Comprehensive Production Setup, Process Supervision, Reverse Proxy & Maintenance Manual

**Application:** TRINAYAA ENTERPRISES Botanical E-Commerce  
**Target Environment:** Linux / Ubuntu 22.04 LTS / 24.04 LTS (or Windows Server 2022)  
**Runtime:** Node.js v20.x or v22.x LTS, SQLite 3  
**Process Manager:** PM2 or systemd  
**Reverse Proxy:** Nginx with Let's Encrypt SSL/TLS  

---

## 1. SYSTEM PREREQUISITES & SERVER SPECIFICATIONS

### Recommended Minimum Hardware Specifications
- **CPU:** 2 vCPUs (x86_64 or ARM64)
- **RAM:** 2 GB (4 GB recommended for concurrent builds)
- **Disk:** 20 GB NVMe SSD (minimum 5 GB free for database snapshots and uploads)
- **OS:** Ubuntu 22.04 / 24.04 LTS (recommended) or Debian 12

### Software Dependencies
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install Node.js 22 LTS
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx git sqlite3

# Verify versions
node -v   # Must be v20.x or v22.x
npm -v    # Must be 10.x+
nginx -v  # Nginx 1.18+

# Install PM2 globally
sudo npm install -g pm2
```

---

## 2. APPLICATION INSTALLATION & BUILD

```bash
# Clone the repository into application directory
sudo mkdir -p /var/www/trinayaa
sudo chown -R $USER:$USER /var/www/trinayaa
cd /var/www/trinayaa

git clone <GIT_REPOSITORY_URL> .
git checkout master

# Install dependencies
npm ci

# Configure environment
cp .env.example .env
nano .env  # Populate live credentials, session secret, and Razorpay production keys

# Run database migration / schema initialization (if needed)
npm run db:push

# Build production bundle
npm run build
```

---

## 3. SQLITE DATABASE & UPLOAD STORAGE PERMISSIONS

SQLite requires read/write access to both the database file (`./data/trinayaa.db`) and the parent directory (`./data/`) to create WAL (`-wal`) and shared memory (`-shm`) journal files during operation.

```bash
# Create data and uploads directories
mkdir -p /var/www/trinayaa/data
mkdir -p /var/www/trinayaa/uploads

# Set proper ownership and permissions
sudo chown -R www-data:www-data /var/www/trinayaa/data
sudo chown -R www-data:www-data /var/www/trinayaa/uploads

sudo chmod 750 /var/www/trinayaa/data
sudo chmod 750 /var/www/trinayaa/uploads
sudo chmod 640 /var/www/trinayaa/data/trinayaa.db
```

---

## 4. PROCESS SUPERVISION (PM2)

Create `ecosystem.config.cjs` in `/var/www/trinayaa/`:

```javascript
module.exports = {
  apps: [
    {
      name: "trinayaa-store",
      script: "dist/index.js",
      cwd: "/var/www/trinayaa",
      instances: 1, // Single instance required for SQLite single-writer safety
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
      error_file: "/var/log/trinayaa/error.log",
      out_file: "/var/log/trinayaa/out.log",
      time: true,
    },
  ],
};
```

### Starting and Enabling the Application
```bash
sudo mkdir -p /var/log/trinayaa
sudo chown -R www-data:www-data /var/log/trinayaa

# Start with PM2 under www-data user
sudo -u www-data pm2 start ecosystem.config.cjs
sudo -u www-data pm2 save

# Generate systemd startup script so service auto-starts on server reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u www-data --hp /var/www
```

---

## 5. REVERSE PROXY & SSL CONFIGURATION (NGINX)

Create `/etc/nginx/sites-available/trinayaa`:

```nginx
server {
    server_name trinayaa.in www.trinayaa.in;

    # Client upload size limit (aligns with 10MB backend cap)
    client_max_body_size 15M;

    # Gzip compression for static assets
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    # Static uploads caching
    location /uploads/ {
        alias /var/www/trinayaa/uploads/;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # Static Vite build assets
    location /assets/ {
        alias /var/www/trinayaa/dist/public/assets/;
        expires 365d;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    # Reverse proxy to Node.js / Express
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
        proxy_read_timeout 90s;
    }
}
```

Enable site and provision SSL certificate:
```bash
sudo ln -s /etc/nginx/sites-available/trinayaa /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Issue Let's Encrypt SSL/TLS Certificate
sudo certbot --nginx -d trinayaa.in -d www.trinayaa.in
```

---

## 6. ZERO-DOWNTIME UPDATE / DEPLOYMENT PROCEDURE

To deploy future updates safely without data corruption:

```bash
cd /var/www/trinayaa

# 1. Create immediate pre-deployment database backup
sqlite3 ./data/trinayaa.db ".backup ./data/trinayaa_backup_pre_deploy.db"

# 2. Pull latest code
git pull origin master

# 3. Install dependencies and compile build
npm ci
npm run build

# 4. Gracefully reload PM2 process
sudo -u www-data pm2 reload trinayaa-store

# 5. Verify health endpoint
curl -f http://localhost:3000/health || echo "DEPLOYMENT FAILED"
```
