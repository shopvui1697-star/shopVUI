# Plan: Google OAuth2 Authentication

## Architecture

### Auth Flow
1. User clicks "Sign in with Google" → redirected to `/api/auth/google`
2. API redirects to Google OAuth consent screen
3. Google calls back to `/api/auth/google/callback`
4. API creates/updates User in PostgreSQL via Prisma
5. API issues JWT access token (15min) + refresh token (7d)
6. Frontend stores tokens in httpOnly cookies
7. Frontend includes JWT in Authorization header for API calls
8. AuthGuard validates JWT on protected endpoints

### Package Structure
```
packages/db/           → Prisma client + schema (shared)
packages/shared/src/   → Auth types added to existing package
apps/api/src/auth/     → NestJS auth module
apps/web/              → Auth context, middleware, login page
apps/admin/            → Auth context, middleware, login page
```

### Tech Decisions
- **Prisma in `packages/db`**: Shared across apps
- **Passport.js**: Google OAuth2 + JWT strategies for NestJS
- **JWT (access + refresh)**: Stateless auth with refresh rotation
- **No NextAuth.js**: Auth logic centralized in NestJS API
- **httpOnly cookies**: Secure token storage in frontend

### Dependencies
- `@prisma/client`, `prisma` → packages/db
- `@nestjs/passport`, `passport`, `passport-google-oauth20`, `@nestjs/jwt`, `passport-jwt`, `@nestjs/config` → apps/api
- `@shopvui/db` → apps/api

## Implementation Order
1. packages/db (Prisma + User model)
2. Docker Compose (PostgreSQL)
3. packages/shared (auth types)
4. apps/api auth module
5. apps/web auth
6. apps/admin auth
