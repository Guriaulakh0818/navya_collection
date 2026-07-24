# Navya Collection - Technical Architecture Document (TAD)

## 1. Objective
Build a scalable, secure and maintainable e-commerce platform that supports the approved business model for Navya Collection, while leaving room for future expansion into women’s wear, accessories, marketplaces, and mobile commerce.

## 2. Architecture Overview

Customer
  -> Next.js Frontend
  -> Next.js API Layer
  -> Prisma ORM
  -> PostgreSQL (Supabase)

External Services:
- Cloudinary
- Razorpay
- Shiprocket
- MSG91
- Google Analytics
- Google Search Console

## 3. Architecture Principles
- Clean Architecture
- Modular Development
- Reusable Components
- Mobile First
- SEO First
- Performance First
- Security First
- Scalable Codebase
- Enterprise Folder Structure

## 4. Application Layers

### Presentation Layer
Responsible for UI, interactions, responsiveness, theme, and motion.

Technology:
- Next.js
- Tailwind CSS
- shadcn/ui

### Business Layer
Responsible for product logic, cart workflow, coupon checks, authentication, order validation, and business rules.

### Data Layer
Responsible for database access, CRUD operations, and entity relationships.

Technology:
- Prisma ORM
- PostgreSQL

### External Services Layer
Responsible for payment, shipping, OTP, image hosting, and analytics integration.

## 5. Module Architecture

### Public Module
- Home
- Shop
- Categories
- Product Details
- About
- Contact

### Customer Module
- Login
- Register
- OTP
- Profile
- Addresses
- Orders
- Wishlist
- Cart

### Checkout Module
- Address
- Coupon
- Payment
- Order Confirmation

### Admin Module
- Dashboard
- Products
- Categories
- Inventory
- Orders
- Customers
- Reviews
- Coupons
- Settings
- Analytics

### Shared Module
Reusable components and utilities such as:
- Button
- Card
- Badge
- Modal
- Input
- Table
- Pagination
- Loader
- Toast

## 6. Proposed Folder Structure

```text
app/
  api/
  (public)/
  (customer)/
  (checkout)/
  (admin)/
components/
  shared/
  ui/
features/
  public/
  customer/
  checkout/
  admin/
  shared/
lib/
  api/
  auth/
  validation/
  utils/
prisma/
  schema.prisma
```

## 7. Data Flow
Customer -> Frontend -> API -> Validation -> Prisma -> Database -> API -> Frontend -> Customer

## 8. Authentication Flow
Customer enters mobile number -> OTP generated -> MSG91 -> Customer enters OTP -> Verification -> Customer session created -> Access granted

## 9. Order Flow
Browse product -> Add to cart -> Checkout -> OTP -> Address -> Payment -> Order -> Shiprocket -> Tracking -> Delivery

## 10. File Organization Strategy
Each feature will be organized feature-wise and will include:
- Components
- Types
- Validation
- Services
- API
- Utilities

This preserves maintainability and allows independent feature development.

## 11. Coding Standards
- Single Responsibility Principle
- Small functions
- Type safety
- Reusable components
- Consistent naming
- No duplicate code

## 12. Naming Conventions

Folders: kebab-case
- product-card
- shopping-cart

Components: PascalCase
- ProductCard.tsx
- Navbar.tsx

Variables: camelCase
- productPrice
- customerName

Constants: UPPER_CASE
- MAX_PRODUCTS
- DEFAULT_LANGUAGE

## 13. API Standards
RESTful APIs with predictable routes:
- GET /api/products
- POST /api/orders
- PUT /api/orders/:id
- DELETE /api/products/:id

Every API must return:
- status code
- error message
- success message
- response data

## 14. Error Handling Strategy
- Centralized API error responses
- Validation errors for user actions
- Safe internal exceptions
- No raw DB errors exposed to users

## 15. Logging Strategy
- Application logs
- Server logs
- Payment logs
- Authentication logs
- Order logs
- Future support for monitoring and alerting

## 16. Performance Strategy
- Server Components by default
- Lazy loading
- Image optimization
- Dynamic imports
- Caching where appropriate
- Pagination
- Metadata optimization

## 17. Security Strategy
- HTTPS
- Secure cookies
- Input validation
- SQL injection protection via Prisma
- XSS protection
- CSRF protection
- Rate limiting
- Secure headers

## 18. Scalability Strategy
The codebase is designed for future expansion into:
- Mobile app
- ERP integration
- Warehouse systems
- Marketplace APIs
- AI recommendations
- Loyalty program

## 19. Development Workflow
Requirement -> Architecture -> Development -> Testing -> Review -> Git Commit -> Next Feature

No feature should move forward until the current one is stable.

## 20. Definition of Done
A task is complete only when:
- code is functional
- responsive
- no TypeScript errors
- no ESLint errors
- mobile tested
- desktop tested
- git committed
- document updated

## 21. Recommended Phase Split

### Phase 1
- Landing page
- Product catalog UI
- Cart UI
- Checkout UI
- Admin dashboard shell

### Phase 2
- OTP login integration
- Razorpay checkout
- PostgreSQL and Prisma setup
- Order management backend

### Phase 3
- Shiprocket integration
- Analytics and SEO enhancements
- Reviews, wishlist, and profile management

### Phase 4
- Multi-marketplace sync
- Mobile commerce and WhatsApp commerce
- AI recommendations and loyalty systems
