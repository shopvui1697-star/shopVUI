# ShopVui — DigitalOcean Multi-Domain Deployment Guide

> Droplet: **Ubuntu 24.04 / 2 vCPU / 2 GB RAM / Singapore (SGP1)**

## Architecture

```
                    Internet
                       │
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   shopvui.net   admin.shopvui.net  api.shopvui.net
          │            │            │
     ┌────┴────┐  ┌────┴────┐  ┌───┴────┐
     │  Nginx  │  │  Nginx  │  │ Nginx  │
     │  :443   │  │  :443   │  │ :443   │
     └────┬────┘  └────┬────┘  └───┬────┘
          │            │           │
    localhost:3000  localhost:3001  localhost:4000
     (Next.js web)  (Next.js admin)  (NestJS API)
          │            │           │
          └────────────┴───────────┘
                       │
                   PM2 (all 3)
                       │
                   MySQL 8.0
```

| Domain | App | Port | Nginx config |
|--------|-----|------|--------------|
| `shopvui.net` | Web storefront (Next.js) | 3000 | `/etc/nginx/sites-available/shopvui` |
| `admin.shopvui.net` | Admin dashboard (Next.js) | 3001 | `/etc/nginx/sites-available/shopvui.admin` |
| `api.shopvui.net` | API (NestJS) | 4000 | `/etc/nginx/sites-available/shopvui.api` |

---

## 1. Server Setup (as root)

```bash
apt update && apt upgrade -y

adduser deploy
usermod -aG sudo deploy

mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys

ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw enable
```

## 2. Swap (2 GB RAM droplet needs this)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
echo 'vm.swappiness=10' >> /etc/sysctl.conf
sysctl -p
```

## 3. Install Dependencies (as root)

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
corepack enable
corepack prepare pnpm@9.15.4 --activate

# Nginx
apt install -y nginx

# PM2
npm install -g pm2

# MySQL 8
apt install -y mysql-server
mysql_secure_installation
```

### Create MySQL database and user

```bash
sudo mysql
```

```sql
CREATE DATABASE shopvui CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'shopvui'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON shopvui.* TO 'shopvui'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## 4. Clone & Configure (as deploy user)

```bash
su - deploy
git clone https://github.com/user/shopvui.git ~/shopvui
cd ~/shopvui
pnpm install --frozen-lockfile
```

### Create `.env` at project root

```bash
cat > ~/shopvui/.env << 'EOF'
# Database
DATABASE_URL=mysql://shopvui:YOUR_STRONG_PASSWORD@localhost:3306/shopvui

# Google OAuth2
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=https://api.shopvui.net/api/auth/google/callback

# JWT (generate strong secrets!)
JWT_SECRET=GENERATE_WITH_openssl_rand_hex_64
JWT_REFRESH_SECRET=GENERATE_WITH_openssl_rand_hex_64

# Channel encryption
CHANNEL_ENCRYPTION_KEY=GENERATE_WITH_node_crypto_randomBytes_32

# Frontend URLs (for CORS & OAuth redirects)
WEB_URL=https://shopvui.net
ADMIN_URL=https://admin.shopvui.net
NEXT_PUBLIC_API_URL=https://api.shopvui.net/api
EOF
```

**Key differences from local dev**:
- URLs point to actual domains, not `localhost`
- `GOOGLE_CALLBACK_URL` uses `api.shopvui.net` since the API lives on its own subdomain
- `NEXT_PUBLIC_API_URL` must include the `/api` suffix because NestJS uses `setGlobalPrefix('api')` — all routes are under `/api/*`
- `NEXT_PUBLIC_*` vars are baked into the Next.js build, so you must **rebuild** web/admin after changing them

## 5. Build

Build one-at-a-time to stay within 2 GB RAM:

```bash
cd ~/shopvui

pnpm --filter @shopvui/db db:generate

cd packages/db
DATABASE_URL=mysql://shopvui:YOUR_STRONG_PASSWORD@localhost:3306/shopvui npx prisma migrate deploy
cd ~/shopvui

pnpm --filter @shopvui/db build
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter @shopvui/shared build 2>/dev/null || true
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter @shopvui/ui build 2>/dev/null || true
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter api build
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter web build
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter admin build
```

## 6. PM2 — Process Manager

Create `~/shopvui/ecosystem.config.cjs`:

```js
module.exports = {
  apps: [
    {
      name: 'web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3000',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
      instances: 1,
    },
    {
      name: 'admin',
      cwd: './apps/admin',
      script: 'node_modules/.bin/next',
      args: 'start --port 3001',
      env: { NODE_ENV: 'production' },
      max_memory_restart: '400M',
      instances: 1,
    },
    {
      name: 'api',
      cwd: './apps/api',
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      max_memory_restart: '300M',
      instances: 1,
    },
  ],
};
```

```bash
cd ~/shopvui
pm2 start ecosystem.config.cjs
pm2 save

# Startup on reboot (run as root)
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u deploy --hp /home/deploy
```

Verify with `pm2 list` — you should see:

```
│ admin │ online │ :3001 │
│ api   │ online │ :4000 │
│ web   │ online │ :3000 │
```

## 7. DNS — Point Domains to Droplet

In your domain registrar (or DigitalOcean DNS), add **A records** pointing to the droplet IP:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | `@` | `YOUR_DROPLET_IP` | 300 |
| A | `www` | `YOUR_DROPLET_IP` | 300 |
| A | `admin` | `YOUR_DROPLET_IP` | 300 |
| A | `api` | `YOUR_DROPLET_IP` | 300 |

Wait for DNS propagation (usually 5–15 min), then verify:

```bash
dig +short shopvui.net
dig +short admin.shopvui.net
dig +short api.shopvui.net
```

## 8. Nginx — Multi-Domain Configuration

We use **3 separate Nginx config files**, one per domain. This is cleaner than path-based routing and avoids issues with Next.js assets and API CORS.

### 8a. Web storefront — `shopvui.net`

```bash
sudo nano /etc/nginx/sites-available/shopvui
```

```nginx
# Rate limiting (only needed once, shared across configs)
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

server {
    listen 80;
    server_name shopvui.net www.shopvui.net;

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
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    client_max_body_size 10M;
}
```

### 8b. Admin dashboard — `admin.shopvui.net`

```bash
sudo nano /etc/nginx/sites-available/shopvui.admin
```

```nginx
server {
    listen 80;
    server_name admin.shopvui.net;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    client_max_body_size 10M;
}
```

### 8c. API — `api.shopvui.net`

```bash
sudo nano /etc/nginx/sites-available/shopvui.api
```

```nginx
server {
    listen 80;
    server_name api.shopvui.net;

    location / {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://127.0.0.1:4000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    gzip_min_length 1000;

    client_max_body_size 10M;
}
```

### Enable all sites

```bash
sudo ln -s /etc/nginx/sites-available/shopvui /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/shopvui.admin /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/shopvui.api /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t
sudo systemctl restart nginx
```

## 9. SSL — Let's Encrypt (per domain)

Issue certificates **one domain at a time** — Certbot rewrites the Nginx configs to add the `listen 443 ssl` block and HTTP→HTTPS redirect automatically.

```bash
sudo apt install -y certbot python3-certbot-nginx

# Web (main domain + www)
sudo certbot --nginx -d shopvui.net -d www.shopvui.net

# Admin
sudo certbot --nginx -d admin.shopvui.net

# API
sudo certbot --nginx -d api.shopvui.net
```

Certbot auto-modifies each Nginx config to:
- Add `listen 443 ssl` with certificate paths
- Add HTTP→HTTPS redirect (`return 301`)

Verify auto-renewal:

```bash
sudo certbot renew --dry-run
```

After Certbot, your Nginx configs will have SSL blocks similar to:

```nginx
listen 443 ssl;
ssl_certificate /etc/letsencrypt/live/shopvui.net/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/shopvui.net/privkey.pem;
include /etc/letsencrypt/options-ssl-nginx.conf;
ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
```

## 10. Google OAuth — Production Redirect

In [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**:

1. Edit your OAuth 2.0 Client
2. Add **Authorized redirect URI**: `https://api.shopvui.net/api/auth/google/callback`
3. Add **Authorized JavaScript origins**: `https://shopvui.net`, `https://admin.shopvui.net`
4. Save

This matches the `GOOGLE_CALLBACK_URL` in your `.env`.

## 11. Deploy Script

Create `~/deploy.sh`:

```bash
#!/bin/bash
set -e

cd ~/shopvui
echo "==> Pulling latest code..."
git pull origin main

echo "==> Installing dependencies..."
pnpm install --frozen-lockfile

echo "==> Generating Prisma client..."
pnpm --filter @shopvui/db db:generate

echo "==> Running migrations..."
cd packages/db
npx prisma migrate deploy
cd ~/shopvui

echo "==> Building packages..."
pnpm --filter @shopvui/db build
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter @shopvui/shared build 2>/dev/null || true
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter @shopvui/ui build 2>/dev/null || true

echo "==> Building API..."
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter api build

echo "==> Building Web..."
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter web build

echo "==> Building Admin..."
NODE_OPTIONS="--max-old-space-size=1536" pnpm --filter admin build

echo "==> Restarting PM2..."
pm2 restart all

echo "==> Deploy complete!"
```

```bash
chmod +x ~/deploy.sh
```

Usage: SSH into the server and run `./deploy.sh`.

## 12. Monitoring & Logs

```bash
# PM2 process status
pm2 list

# Live logs (all apps)
pm2 logs

# Logs for a single app
pm2 logs api
pm2 logs web
pm2 logs admin

# PM2 monitoring dashboard
pm2 monit

# Nginx access/error logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# SSL certificate expiry
sudo certbot certificates
```

## Troubleshooting

| Symptom | Check | Fix |
|---------|-------|-----|
| 502 Bad Gateway | `pm2 list` — app crashed? | `pm2 restart <app>`, check `pm2 logs <app>` |
| API restart loop (↺ high count) | `pm2 logs api` | Fix crash cause, often missing env vars or DB connection |
| SSL certificate error | `sudo certbot certificates` | `sudo certbot renew` |
| DNS not resolving | `dig +short admin.shopvui.net` | Check A records in registrar |
| Nginx config error | `sudo nginx -t` | Fix syntax, then `sudo systemctl restart nginx` |
| Out of memory during build | `free -h` | Build one app at a time with `--max-old-space-size=1536` |
| CORS errors on API | Check `.env` `WEB_URL` / `ADMIN_URL` | Must match exact domain with `https://` |
