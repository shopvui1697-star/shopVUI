---
id: US-001
feature: FS-012
title: "Input Validation (P0)"
status: completed
priority: P0
created: 2026-03-13T00:00:00.000Z
tldr: "**As a** platform operator."
project: shopvui
---

# US-001: Input Validation (P0)

**Feature**: [FS-012](./FEATURE.md)

**As a** platform operator
**I want** all API endpoints to validate incoming payloads with field-level rules
**So that** malformed or malicious input is rejected before reaching business logic

---

## Acceptance Criteria

- [x] **AC-US1-01**: Given class-validator and class-transformer are installed, when the API bootstraps, then a global ValidationPipe is registered in apps/api/src/main.ts with whitelist and transform options enabled
- [x] **AC-US1-02**: Given all 9 existing DTO files, when each is converted from a plain interface to a validated class, then every field has appropriate decorators (@IsNotEmpty, @IsEmail, @IsString, @IsNumber, @IsEnum, etc.)
- [x] **AC-US1-03**: Given a POST/PUT/PATCH request with an invalid body, when the ValidationPipe processes it, then the response is 400 with a JSON body containing field-level error messages
- [x] **AC-US1-04**: Given a POST/PUT/PATCH request with a valid body, when the ValidationPipe processes it, then the request passes through to the controller unchanged

---

## Implementation

**Increment**: [0012-production-hardening](../../../../../increments/0012-production-hardening/spec.md)

**Tasks**: See increment tasks.md for implementation details.


## Tasks

- [x] **T-004**: Install dependencies and register global ValidationPipe
- [x] **T-005**: Convert all 9 DTO files from interfaces to validated classes
