# Environment & Configuration Document (ECD)

**Document Version:** 1.0
**Project:** Navya Collection E-commerce Platform
**Phase:** 2 – Infrastructure & Development
**Task:** 9
**Status:** Planning

---

## 1. Document Objective

This document defines all environment variables, project configurations, secrets management, deployment configurations, and runtime settings for the Navya Collection platform.

The objectives are:

- Separate development and production configurations
- Secure sensitive credentials
- Standardize environment setup
- Simplify deployment
- Improve maintainability

---

## 2. Environment Types

| Environment | Purpose |
|---|---|
| Local Development | Developer machine |
| Development | Internal testing |
| Staging | Pre-production testing |
| Production | Live website |

---

## 3. Environment Files

| File | Purpose |
|---|---|
| `.env.example` | Template only (no secrets) |
| `.env.local` | Developer-specific values (never commit) |
| `.env.development` | Development environment values |
| `.env.staging` | Staging environment values |
| `.env.production` | Production secrets (managed by hosting platform) |

### Rules

- `.env.example` → Template only (no secrets)
- `.env.local` → Developer-specific values (never commit)
- `.env.production` → Production secrets (managed by hosting platform)

---

## 4. Application Configuration

### Application

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_NAME` | `Navya Collection` |
| `NEXT_PUBLIC_APP_URL` | `https://navyacollection.store` |
| `NEXT_PUBLIC_ENVIRONMENT` | `production` |

### Database

| Variable | Value |
|---|---|
| `DATABASE_URL` | *(to be set)* |
| `DIRECT_URL` | *(to be set)* |

**Provider:** PostgreSQL (Supabase)

### Authentication

| Variable | Value |
|---|---|
| `AUTH_SECRET` | *(to be set)* |
| `AUTH_TRUST_HOST` | `true` |

### OTP Provider

| Variable | Value |
|---|---|
| `MSG91_AUTH_KEY` | *(to be set)* |
| `MSG91_TEMPLATE_ID` | *(to be set)* |

### Cloudinary

| Variable | Value |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | *(to be set)* |
| `CLOUDINARY_API_KEY` | *(to be set)* |
| `CLOUDINARY_API_SECRET` | *(to be set)* |

### Razorpay

| Variable | Value |
|---|---|
| `RAZORPAY_KEY_ID` | *(to be set)* |
| `RAZORPAY_KEY_SECRET` | *(to be set)* |

### Shiprocket

| Variable | Value |
|---|---|
| `SHIPROCKET_EMAIL` | *(to be set)* |
| `SHIPROCKET_PASSWORD` | *(to be set)* |

### Google Services

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | *(to be set)* |
| `GOOGLE_SITE_VERIFICATION` | *(to be set)* |

### Email (Future)

| Variable | Value |
|---|---|
| `SMTP_HOST` | *(to be set)* |
| `SMTP_PORT` | *(to be set)* |
| `SMTP_USER` | *(to be set)* |
| `SMTP_PASSWORD` | *(to be set)* |

---

## 5. Secrets Management

### Sensitive Values

- Database credentials
- API keys
- JWT/Auth secrets
- Razorpay secret
- Cloudinary secret
- MSG91 key

### Rules

- Never hardcode secrets.
- Never expose secrets in frontend code.
- Store production secrets in Vercel Environment Variables.

---

## 6. Public vs Private Variables

### Public

- Accessible in browser.
- **Prefix:** `NEXT_PUBLIC_`
- Examples:
  - Site URL
  - App Name
  - Analytics ID

### Private

- Server-side only.
- Examples:
  - Database URL
  - API secrets
  - Payment secrets
  - OTP credentials

---

## 7. Configuration Management

Configuration categories:

- Application
- Database
- Authentication
- Storage
- Payments
- Shipping
- Analytics
- Email

---

## 8. Logging Configuration

### Development

- Detailed console logs
- API request logs
- Error stack traces

### Production

- Error logs only
- Sensitive data masked
- Structured logging

---

## 9. Feature Flags

Example:

- `NEXT_PUBLIC_ENABLE_REVIEWS=true`
- `NEXT_PUBLIC_ENABLE_BLOG=false`
- `NEXT_PUBLIC_ENABLE_WISHLIST=true`

### Benefits

- Enable/disable features without changing code.
- Controlled rollout of new modules.

---

## 10. File Upload Configuration

### Allowed Formats

- JPG
- PNG
- WEBP

### Maximum Size

| Type | Limit |
|---|---|
| Product Images | 5 MB |
| Banner Images | 10 MB |

### Storage

- Cloudinary

---

## 11. Security Configuration

- HTTPS enforced
- Secure cookies
- CORS restrictions
- CSP headers (future)
- Rate limiting
- Environment-based secrets

---

## 12. Error Handling

The application should handle:

- Missing environment variables
- Invalid API keys
- Database connection failures
- Third-party service outages

During startup, required variables should be validated to prevent runtime failures.

---

## 13. Build Configuration

| Category | Value |
|---|---|
| Framework | Next.js |
| Language | TypeScript |
| Package Manager | pnpm (recommended) |
| Node Version | Latest LTS version (to be fixed in `.nvmrc`) |

---

## 14. Deployment Configuration

| Service | Provider |
|---|---|
| Hosting | Vercel |
| Database | Supabase |
| Image Storage | Cloudinary |
| Payments | Razorpay |
| Shipping | Shiprocket |

---

## 15. Backup & Recovery

- Daily database backups (Supabase plan dependent)
- Cloudinary asset backups
- Environment variables exported securely
- Version-controlled configuration templates

---

## 16. Monitoring

### Current Tools

- Google Analytics
- Google Search Console

### Future

- Sentry (Error Monitoring)
- Uptime Robot (Availability Monitoring)

---

## 17. Configuration Validation Checklist

Before deployment, verify:

- [ ] All required environment variables are set.
- [ ] Database connection is successful.
- [ ] Payment gateway credentials are correct.
- [ ] OTP service is working.
- [ ] Image uploads succeed.
- [ ] Analytics is configured.

---

## Deliverables

After implementing this document:

- Standardized environment setup
- Secure secret management
- Reliable deployments
- Easy onboarding for new developers
- Consistent configuration across all environments