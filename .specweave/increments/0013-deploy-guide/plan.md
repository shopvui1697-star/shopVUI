# Architecture Plan: 0013-deploy-guide

## Overview

Single deliverable: `DEPLOY.md` at the repo root. No code changes, no new packages, no ADRs needed. The "architecture" below defines the document structure, section ordering rationale, and accuracy-verification strategy.

## Document Structure

```
DEPLOY.md
├── 1. Prerequisites                    (US-001: AC-US1-01)
├── 2. Environment Variables            (US-001: AC-US1-02, AC-US1-03)
│   ├── API Service
│   ├── Web Storefront
│   └── Admin Panel
├── 3. Local Development                (US-002)
│   ├── 3a. pnpm-based flow            (AC-US2-01)
│   ├── 3b. Docker Compose flow         (AC-US2-02)
│   └── 3c. Running individual apps     (AC-US2-03)
├── 4. Database Setup                   (US-003)
│   ├── 4a. Migrations                  (AC-US3-01)
│   ├── 4b. Seeding                     (AC-US3-02)
│   └── 4c. Reset & regenerate          (AC-US3-03)
├── 5. Google OAuth Configuration       (US-004)
│   ├── 5a. Creating credentials        (AC-US4-01)
│   ├── 5b. Callback URLs              (AC-US4-02)
│   └── 5c. Environment variable map    (AC-US4-03)
├── 6. Production Deployment            (US-005)
│   ├── 6a. Pre-deployment checklist    (AC-US5-01)
│   ├── 6b. Common commands reference   (AC-US5-02)
│   └── 6c. Production concerns         (AC-US5-03)
└── 7. Troubleshooting (bonus)
```

## Design Decisions

### D-001: Section ordering follows the developer timeline

Sections are ordered by the sequence a new developer actually follows: install tools, set env vars, start locally, set up database, configure auth, then eventually deploy. This mirrors the onboarding timeline and avoids forward-references.

### D-002: Environment variables documented as a table

Each service gets a table with columns: Variable | Required | Default | Description. This is scannable and diff-friendly. The `.env.example` template is provided inline rather than as a separate file -- keeps everything in one place and avoids sync drift between two files.

### D-003: Dual local-dev paths (pnpm vs Docker Compose)

Both paths are documented because the codebase supports both. Docker Compose is presented as the "zero-config" path, pnpm as the "full-control" path. Each gets its own subsection with the exact commands.

### D-004: No separate .env.example file

The spec says "includes a .env.example reference **or** inline template." We choose inline template within DEPLOY.md to avoid maintaining a second file that can drift out of sync. If the team later wants a `.env.example` file, it can be extracted from the guide.

## Environment Variables (verified from codebase)

### API Service (apps/api)
| Variable | Required | Default | Source |
|----------|----------|---------|--------|
| DATABASE_URL | Yes | - | jwt.strategy.ts, docker-compose.yml |
| JWT_SECRET | Yes | - | jwt.strategy.ts (throws if missing) |
| GOOGLE_CLIENT_ID | Yes | '' | google.strategy.ts via ConfigService |
| GOOGLE_CLIENT_SECRET | Yes | '' | google.strategy.ts via ConfigService |
| GOOGLE_CALLBACK_URL | Yes | '' | google.strategy.ts via ConfigService |
| WEB_URL | No | http://localhost:3000 | main.ts CORS, auth.controller.ts |
| ADMIN_URL | No | http://localhost:3001 | main.ts CORS, auth.controller.ts |
| PORT | No | 4000 | main.ts |
| NODE_ENV | No | - | main.ts helmet CSP toggle |
| THROTTLE_TTL | No | 60000 | app.module.ts |
| THROTTLE_LIMIT | No | 100 | app.module.ts |

### Web Storefront (apps/web)
| Variable | Required | Default | Source |
|----------|----------|---------|--------|
| NEXT_PUBLIC_API_URL | No | http://localhost:4000 | src/lib/api.ts, app/lib/auth.ts |

### Admin Panel (apps/admin)
| Variable | Required | Default | Source |
|----------|----------|---------|--------|
| NEXT_PUBLIC_API_URL | No | http://localhost:4000 | src/lib/api.ts, src/lib/auth.ts |

## Accuracy Verification Strategy

Before marking tasks complete, each section must be cross-checked against:
1. `docker-compose.yml` -- ports, service names, volume mounts
2. `package.json` -- script names and turbo commands
3. `turbo.json` -- task names and filter syntax
4. `packages/db/prisma/schema.prisma` -- migration path
5. `apps/api/src/main.ts` -- actual port, prefix, CORS config
6. Auth strategy files -- actual env var names used by ConfigService

## Scope Boundaries

**In scope**: Everything in spec.md US-001 through US-005.

**Out of scope** (per spec): CI/CD pipelines, cloud-provider guides, Kubernetes, monitoring, channel sync API credentials.

**Bonus section**: A short Troubleshooting section covering the 3-4 most common issues (port conflicts, Prisma client not generated, Docker volume stale) is added for practical value. This is not required by any AC but directly supports the "under 30 minutes onboarding" goal.

## Implementation Approach

Single task: write DEPLOY.md. No domain skill delegation needed -- this is a pure documentation deliverable with no frontend or backend code changes.

## Estimated Size

~200-300 lines of Markdown. Well within the 1500-line constraint.
