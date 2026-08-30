# Navya Collection — Environment Architecture & Isolation Guide

**Version:** 1.0.0  
**Updated:** 30 August 2026  
**Scope:** Strict separation of Local Development/Testing and Live Production environments.

---

## 1. Core Architecture & Isolation Matrix

| Resource Layer          | LOCAL / DEV (`DATABASE_ENV=local`)                                  | STAGING / TEST (`DATABASE_ENV=test`) | PRODUCTION (`DATABASE_ENV=production`)                                                 |
| ----------------------- | ------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------- |
| **Host / Domains**      | `localhost:3000` / `0.0.0.0:3000`                                   | `preview.navyacollection.store`      | `navyacollection.store`, `admin.navyacollection.store`, `seller.navyacollection.store` |
| **Database**            | Isolated Local PostgreSQL (`localhost:5432/navya_collection_local`) | Ephemeral CI test database           | Live Production Supabase PostgreSQL pooler                                             |
| **Prisma Migrations**   | `npm run db:migrate` (`prisma migrate dev`)                         | `npm run db:migrate:deploy`          | `npm run db:migrate:deploy` (`prisma migrate deploy`)                                  |
| **Database Seeding**    | Permitted via `ALLOW_DATABASE_SEEDING=true`                         | Isolated test fixtures only          | **STRICTLY BLOCKED** (Fail-fast fatal guard)                                           |
| **Auth / JWT**          | Isolated dev secret, prefix: `local_jwt_...`                        | Ephemeral CI secret                  | Cryptographically secure production `JWT_SECRET`                                       |
| **Cookies**             | `navya_session`, `navya_admin_session` (SameSite: Lax)              | Secure HTTPS cookies                 | Strict HTTPS Secure cookies scoped to `.navyacollection.store`                         |
| **Browser Storage**     | Key namespace: `navya_local_*`                                      | Key namespace: `navya_test_*`        | Key namespace: `navya_*`                                                               |
| **Razorpay**            | Test Keys only (`rzp_test_*`)                                       | Test Keys only (`rzp_test_*`)        | Live Keys only (`rzp_live_*`)                                                          |
| **Shiprocket**          | Sandbox / Mock mode                                                 | Sandbox / Mock mode                  | Production credentials & live multi-pickup dispatch                                    |
| **Cloudinary**          | `navya-collection-dev/` root folder                                 | `navya-collection-test/` root folder | `navya-collection/` root folder                                                        |
| **Transactional Email** | Brevo simulated / dev bypass                                        | Brevo simulated                      | Live Brevo REST API v3 via verified sender                                             |

---

## 2. Environment Variables Specification

### 2.1 Local Environment (`.env.local`)

```ini
DATABASE_ENV="local"
NODE_ENV="development"

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/navya_collection_local"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/navya_collection_local"

NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="local_dev_jwt_secret_key_minimum_32_characters_long"
ALLOW_DATABASE_SEEDING="true"

# Razorpay Test Keys
RAZORPAY_KEY_ID="rzp_test_TUSsl0DgRczLN7"
RAZORPAY_KEY_SECRET="a6z4ZPaOIyai9gc1Twwsq8sU"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_TUSsl0DgRczLN7"

# Brevo Dev Key
BREVO_API_KEY="xkeysib-your_brevo_api_key_here"
BREVO_SENDER_EMAIL="gurvindersingh0218@gmail.com"

# Cloudinary Dev Storage
CLOUDINARY_CLOUD_NAME="bpsggcre"
CLOUDINARY_API_KEY="598383128674798"
CLOUDINARY_API_SECRET="QXLERlKWEx4jlxgyYAlMPyYfpko"
CLOUDINARY_ROOT_FOLDER="navya-collection-dev"
```

### 2.2 Production Environment (Vercel Environment Variables)

```ini
DATABASE_ENV="production"
NODE_ENV="production"

# Supabase Production Database
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=10"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-ap-south-1.pooler.supabase.com:5432/postgres"

# Production App URLs
NEXT_PUBLIC_APP_URL="https://navyacollection.store"
NEXT_PUBLIC_ADMIN_URL="https://admin.navyacollection.store"
NEXT_PUBLIC_SELLER_URL="https://seller.navyacollection.store"

# Secrets (Must be at least 32 characters, randomly generated)
JWT_SECRET="[STRONG_RANDOMLY_GENERATED_32+_CHAR_SECRET]"
NEXTAUTH_SECRET="[STRONG_RANDOMLY_GENERATED_32+_CHAR_SECRET]"

# Production Razorpay Live Credentials
RAZORPAY_KEY_ID="rzp_live_[PROD_KEY_ID]"
RAZORPAY_KEY_SECRET="[PROD_KEY_SECRET]"
RAZORPAY_WEBHOOK_SECRET="[PROD_WEBHOOK_SECRET]"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_live_[PROD_KEY_ID]"

# Production Shiprocket Credentials
SHIPROCKET_EMAIL="logistics@navyacollection.store"
SHIPROCKET_PASSWORD="[PROD_SHIPROCKET_PASSWORD]"

# Production Brevo
BREVO_API_KEY="xkeysib-[ACTIVE_V3_KEY]"
BREVO_SENDER_EMAIL="gurvindersingh0218@gmail.com"

# Production Cloudinary Root
CLOUDINARY_ROOT_FOLDER="navya-collection"
```

---

## 3. Environment Guard Rules

1. **Local Protection**:
   - If `DATABASE_ENV === 'local'` or `NODE_ENV === 'development'`, any connection string containing production identifiers (`zisieyoodosjbuocrjqd` or `supabase.com`) is **immediately aborted**.
2. **Production Safety**:
   - If `NODE_ENV === 'production'`, any connection string pointing to `localhost` or `127.0.0.1` is **immediately aborted**.
   - If `NODE_ENV === 'production'`, Razorpay keys starting with `rzp_test_` will trigger a configuration error.
   - If `NODE_ENV === 'production'`, `ALLOW_DATABASE_SEEDING` is ignored and `prisma/seed.ts` will **refuse to run**.
3. **Cookie Scoping**:
   - Production cookies are set with `Secure; HttpOnly; SameSite=Lax; Domain=.navyacollection.store` to allow seamless SSO between storefront, admin, and seller subdomains while preventing local cookies from clashing.

---

## 4. Product vs. Variant Inventory Architecture Plan

### 4.1 Current Reality:

- `Product.stock`: Legacy table-level aggregate stock column.
- `ProductVariant`: Fine-grained inventory columns:
  - `stock`: Initial allotted stock.
  - `availableStock`: Real-time units available for purchase.
  - `reservedStock`: Units locked during active checkout sessions.
  - `soldStock`: Total fulfilled units.

### 4.2 Single Source of Truth Rule:

1. **For Products with Variants** (e.g. Size/Color apparel): `ProductVariant.availableStock` is the **authoritative stock source**.
2. `Product.stock` acts as an indexed materialized sum:
   $$\text{Product.stock} = \sum \text{ProductVariant.availableStock}$$
3. All checkout allocations (`order.repository.ts`, `cart.service.ts`) decrement `ProductVariant.availableStock` in a serializable transaction.

---

## 5. Deployment & Execution Protocols

### Local Development:

```bash
# Apply schema updates locally
npm run db:migrate

# Seed local database safely
npm run db:seed
```

### Production Deployment:

```bash
# Generate client
npm run db:generate

# Apply pending production migrations safely (Zero data loss, no dev reset)
npx prisma migrate deploy

# Build and start
npm run build
npm start
```
