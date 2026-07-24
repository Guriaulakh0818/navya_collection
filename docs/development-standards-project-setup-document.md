# Development Standards & Project Setup Document (DSPSD)

**Document Version:** 1.0
**Project:** Navya Collection E-commerce Platform
**Phase:** 2 – Development Standards
**Task:** 10
**Status:** Approved

---

## 1. Document Objective

This document establishes the official development standards, coding conventions, project structure, Git workflow, quality standards, and collaboration guidelines for the Navya Collection project.

The objective is to ensure that the codebase remains:

- Clean
- Consistent
- Scalable
- Secure
- Easy to maintain

---

## 2. Technology Stack

### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend

- Next.js Route Handlers
- Prisma ORM

### Database

- PostgreSQL (Supabase)

### Storage

- Cloudinary

### Authentication

- Mobile OTP (MSG91)

### Payment

- Razorpay

### Shipping

- Shiprocket

### Hosting

- Vercel

---

## 3. Package Manager

Official package manager: **pnpm**

Reasons:

- Faster installs
- Efficient disk usage
- Better monorepo support

---

## 4. Node.js Version

Official version: **Latest LTS**

Project must include:

- `.nvmrc`

---

## 5. Project Folder Structure

```
src/
│
├── app/
├── components/
├── features/
├── hooks/
├── lib/
├── services/
├── stores/
├── providers/
├── types/
├── utils/
├── constants/
├── config/
├── middleware/
└── styles/
```

---

## 6. Naming Conventions

### Folders

```
product-card/
checkout-summary/
```

### Components

```
ProductCard.tsx
CheckoutSummary.tsx
```

### Hooks

```
useCart.ts
useWishlist.ts
```

### Utilities

```
formatPrice.ts
generateSlug.ts
```

### Constants

```
routes.ts
api.ts
colors.ts
```

---

## 7. TypeScript Standards

- Strict mode enabled
- No use of `any` unless unavoidable
- Shared interfaces stored in `/types`
- Reusable enums for statuses and roles

---

## 8. Styling Standards

- Tailwind CSS utility classes
- shadcn/ui components as base
- Avoid inline styles
- Responsive-first development
- CSS only when utilities are insufficient

---

## 9. Component Standards

Every component must:

- Have a single responsibility
- Accept typed props
- Avoid unnecessary re-renders
- Be reusable
- Follow accessibility guidelines

---

## 10. State Management Standards

| State Type | Solution |
|---|---|
| Local UI | `useState` |
| Complex local logic | `useReducer` |
| Global client state | Zustand |
| Server state | TanStack Query |
| Authentication | Secure Cookies + Context |

---

## 11. API Standards

- RESTful naming
- Versioned endpoints (`/api/v1`)
- Standard success/error responses
- Input validation
- Proper HTTP status codes

---

## 12. Git Workflow

### Main Branches

- `main`
- `develop`

### Feature Branches

- `feature/product-page`
- `feature/cart`
- `feature/checkout`
- `feature/admin-dashboard`

### Bug Fixes

- `fix/cart-calculation`
- `hotfix/payment-error`

---

## 13. Commit Message Convention

**Format:**

```
type(scope): description
```

### Examples

```
feat(cart): add quantity selector
fix(auth): resolve OTP validation issue
docs(api): update payment endpoints
refactor(product): optimize product card
style(home): improve hero section spacing
```

---

## 14. Code Review Checklist

Before merging:

- [ ] Code compiles successfully
- [ ] No TypeScript errors
- [ ] ESLint passes
- [ ] Prettier formatting applied
- [ ] Responsive on mobile/tablet/desktop
- [ ] Accessibility checked
- [ ] API errors handled
- [ ] No sensitive data exposed

---

## 15. VS Code Extensions

Recommended:

- ESLint
- Prettier
- Tailwind CSS IntelliSense
- Prisma
- Error Lens
- GitLens
- Path IntelliSense
- Import Cost
- Material Icon Theme

---

## 16. Linting & Formatting

### ESLint

- Enforce code quality
- Detect unused variables
- Catch potential bugs

### Prettier

- Automatic formatting
- Consistent style across project

---

## 17. Environment Standards

- Never commit `.env.local`
- Keep `.env.example` updated
- Validate required variables on startup

---

## 18. Security Standards

- Sanitize all user inputs
- Validate API requests
- Store secrets securely
- Use HTTPS in production
- Protect admin routes
- Apply rate limiting

---

## 19. Performance Standards

- Optimize images
- Lazy load heavy components
- Dynamic imports where appropriate
- Use caching for server data
- Minimize unnecessary client-side JavaScript

---

## 20. Testing Standards (Future)

### Recommended Tools

- Vitest
- React Testing Library
- Playwright

### Coverage Goals

- Critical business flows
- Checkout
- Authentication
- Payment
- Order placement

---

## 21. Documentation Standards

Every new feature should include:

- Feature description
- API updates (if any)
- Database changes (if any)
- Testing notes

---

## 22. Deployment Checklist

Before production deployment:

- [ ] Build passes
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Payment gateway tested
- [ ] OTP tested
- [ ] Image uploads verified
- [ ] SEO metadata configured
- [ ] Analytics connected

---

## 23. Definition of Done (DoD)

A feature is considered complete only if:

- [ ] Functional requirements implemented
- [ ] Code reviewed
- [ ] Tests passed (where applicable)
- [ ] Responsive
- [ ] Accessible
- [ ] Performance acceptable
- [ ] Documentation updated
- [ ] Ready for deployment

---

## Deliverables

After following this document, the project will have:

- Standardized development practices
- Consistent code quality
- Reliable collaboration workflow
- Production-ready project structure
- Easier maintenance and scaling