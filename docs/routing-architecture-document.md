# Navya Collection
# Routing Architecture Document (RAD)

## Objective
Define the complete navigation structure of the Navya Collection website.

This document explains:
- How many pages the website will have.
- What the URL structure will look like.
- How public and protected routes will work.
- How dynamic routes will behave.
- How SEO-friendly URLs will be created.
- How error pages and redirects will behave.

## 1. Purpose
- Define routing architecture.
- Ensure consistent navigation.
- Optimize for SEO.

## 2. Routing Strategy

**Framework:** Next.js App Router

### Proposed Route Group Structure

```text
app/
├── (public)/
├── (auth)/
├── (customer)/
├── (admin)/
└── api/
```

## 3. Public Routes

### Public Pages
- `/`
- `/shop`
- `/categories`
- `/categories/[categorySlug]`
- `/product/[slug]`
- `/search`
- `/offers`
- `/contact`
- `/about`
- `/privacy-policy`
- `/terms-and-conditions`
- `/shipping-policy`
- `/return-policy`

## 4. Authentication Routes

### Auth Pages
- `/login`
- `/verify-otp`
- `/logout`

## 5. Customer Routes (Protected)

### Customer Account Pages
- `/account`
- `/account/profile`
- `/account/addresses`
- `/account/orders`
- `/account/orders/[orderId]`
- `/account/wishlist`
- `/account/settings`

## 6. Cart & Checkout

### Cart and Checkout Flow
- `/cart`
- `/checkout`
- `/checkout/address`
- `/checkout/payment`
- `/checkout/review`
- `/order-success`
- `/order-failed`

## 7. Order Tracking

### Tracking Pages
- `/track-order`

## 8. Admin Routes

### Admin Area
```text
/admin
/admin/dashboard
/admin/products
/admin/products/new
/admin/products/[id]
/admin/categories
/admin/orders
/admin/orders/[id]
/admin/customers
/admin/coupons
/admin/banners
/admin/reports
/admin/settings
```

## 9. API Routes

### Example API Endpoints
```text
/api/auth/send-otp
/api/auth/verify-otp
/api/products
/api/products/[id]
/api/cart
/api/orders
/api/payment
/api/shiprocket
/api/upload
```

## 10. Route Protection

### Route Categories
- Public Routes → Accessible by everyone.
- Customer Routes → Login required.
- Admin Routes → Admin authentication required.
- API Routes → Middleware protection and validation.

## 11. SEO Routing

### SEO Guidelines
- Use human-readable slugs.
- Use canonical URLs.
- Use dynamic metadata.
- Keep breadcrumb-friendly path structure.

### Example SEO URLs
```text
/product/black-cotton-shirt-xl
/category/gents-shirts
```

## 12. Error Routes

### Error Pages
- `404` – Page Not Found
- `500` – Server Error
- `Maintenance Page` – Future scope

## 13. Middleware

### Middleware Responsibilities
- Authentication
- Authorization
- Redirect unauthenticated users
- Protect admin routes
- Rate limiting (future)

## 14. Navigation Flow

```text
Home
  ↓
Category
  ↓
Product
  ↓
Cart
  ↓
Checkout
  ↓
Payment
  ↓
Order Success
```

## 15. Future Routes

- `/blogs`
- `/faq`
- `/support`
- `/returns`
- `/exchange`
- `/gift-cards`
- `/loyalty`
- `/notifications`

## Deliverable
After this document is complete, the website will have a 100% routing blueprint. This blueprint will help implement the Next.js App Router folder structure and navigation in a straightforward way.
