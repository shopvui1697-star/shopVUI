# ShopVui Deployment Guide

## Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Node.js | 20+ | [nodejs.org](https://nodejs.org/) |
| pnpm | 9.15.4 | `corepack enable && corepack prepare pnpm@9.15.4 --activate` |
| Docker & Docker Compose | Latest | [docker.com](https://www.docker.com/) |
| PostgreSQL | 16+ | Via Docker (recommended) or native install |

## Project Structure

```
shopvui/
├── apps/
│   ├── web/       # Customer storefront  (Next.js 15, port 3000)
│   ├── admin/     # Admin dashboard      (Next.js 15, port 3001)
│   └── api/       # Backend API          (NestJS,     port 4000)
├── packages/
│   ├── db/        # Prisma schema & migrations
│   ├── shared/    # Shared types & utilities
│   └── ui/        # Reusable React components
└── tooling/       # Shared ESLint, Prettier, TypeScript configs
```

## Environment Variables

Create a `.env` file at the project root:

```bash
# ── Database ──────────────────────────────────────────────
DATABASE_URL=postgresql://shopvui:shopvui_dev@localhost:5432/shopvui

# ── Google OAuth2 ─────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:4000/api/auth/google/callback

# ── JWT ───────────────────────────────────────────────────
JWT_SECRET=change-me-in-production
JWT_REFRESH_SECRET=change-me-in-production

# ── Frontend URLs (CORS & redirects) ─────────────────────
WEB_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001

# ── Rate Limiting (optional, defaults shown) ──────────────
# THROTTLE_TTL=60000
# THROTTLE_LIMIT=100

# ── Email / SMTP (optional) ──────────────────────────────
# If SMTP_HOST is blank, emails are logged to console (dev mode)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# MAIL_FROM=noreply@shopvui.com

# ── Channel Sync (Shopee / TikTok, optional) ─────────────
# SHOPEE_APP_KEY=
# SHOPEE_APP_SECRET=
# SHOPEE_REDIRECT_URI=http://localhost:4000/api/channels/oauth/shopee/callback
# TIKTOK_APP_KEY=
# TIKTOK_APP_SECRET=
# TIKTOK_REDIRECT_URI=http://localhost:4000/api/channels/oauth/tiktok/callback

# Channel token encryption key (required if using channel sync)
# Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# CHANNEL_ENCRYPTION_KEY=

# ── Payment Gateways (optional) ──────────────────────────
# VNPAY_TMN_CODE=DEMO
# VNPAY_HASH_SECRET=vnpay-secret
# VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
# VNPAY_RETURN_URL=http://localhost:3000/checkout/result
# MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
# MOMO_SECRET_KEY=momo-secret
# MOMO_RETURN_URL=http://localhost:3000/checkout/result

# ── Server ────────────────────────────────────────────────
NODE_ENV=development
PORT=4000
```

**Required for basic local dev**: `DATABASE_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`.

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select existing)
3. Navigate to **APIs & Services > Credentials**
4. Click **Create Credentials > OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add authorized redirect URI:
   - Development: `http://localhost:4000/api/auth/google/callback`
   - Production: `https://your-domain.com/api/auth/google/callback`
7. Copy **Client ID** and **Client Secret** to your `.env` file

## Local Development

### Option A: Native (recommended for development)

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL (if not running)
docker compose up postgres -d

# 3. Run database migrations
cd packages/db && pnpm db:migrate && cd ../..

# 4. (Optional) Seed the database
cd packages/db && pnpm dlx tsx prisma/seed.ts && cd ../..

# 5. Start all apps in parallel
pnpm dev
```

This starts:
- **Web storefront**: http://localhost:3000
- **Admin dashboard**: http://localhost:3001
- **API + Swagger docs**: http://localhost:4000/api/docs

### Option B: Full Docker Compose

```bash
docker compose up --build
```

This starts PostgreSQL + all three apps with hot-reload via volume mounts.

**Note**: When using Docker Compose, the API uses `DATABASE_URL=postgresql://shopvui:shopvui_dev@postgres:5432/shopvui` (hostname `postgres` instead of `localhost`).

### Run a single app

```bash
pnpm --filter web dev        # Storefront only
pnpm --filter admin dev      # Admin only
pnpm --filter api dev  # API only
```

## Database

### Migrations

```bash
cd packages/db

# Apply pending migrations
pnpm db:migrate

# Push schema without creating migration files (prototyping)
pnpm db:push

# Generate Prisma client (runs automatically on pnpm install)
pnpm db:generate

# Open Prisma Studio (visual DB browser)
pnpm db:studio
```

### Reset database

```bash
cd packages/db
pnpm dlx prisma migrate reset
```

This drops all tables, re-applies migrations, and runs the seed script.

### Seed data

The seed script is at `packages/db/prisma/seed.ts`:

```bash
cd packages/db
pnpm dlx tsx prisma/seed.ts
```

## Common Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all apps in dev mode |
| `pnpm build` | Build all apps and packages |
| `pnpm test` | Run all tests (Vitest) |
| `pnpm lint` | Lint all packages |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm format` | Format code with Prettier |
| `pnpm format:check` | Check formatting without writing |
| `docker compose up` | Start everything via Docker |
| `docker compose up postgres -d` | Start only PostgreSQL |

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Generate strong random values for `JWT_SECRET` and `JWT_REFRESH_SECRET`
- [ ] Generate `CHANNEL_ENCRYPTION_KEY` if using channel sync:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Use a managed PostgreSQL instance (e.g., AWS RDS, Supabase)
- [ ] Update `DATABASE_URL` to production database
- [ ] Register Google OAuth app with production redirect URI
- [ ] Update `WEB_URL`, `ADMIN_URL`, `GOOGLE_CALLBACK_URL` to production domains
- [ ] Configure real SMTP credentials for email notifications
- [ ] Configure VNPay/Momo production credentials if using payments
- [ ] Configure Shopee/TikTok partner credentials if using channel sync
- [ ] Enable HTTPS (Helmet CSP auto-enables in production)
- [ ] Set up database backups
- [ ] Set up monitoring for cron jobs (commission processing runs hourly)
