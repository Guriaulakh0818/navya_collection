# Navya Collection
# Frontend Component Architecture Document (FCAD)

**Document Version:** 1.0
**Project:** Navya Collection E-commerce Platform
**Phase:** 2 – Frontend Architecture
**Task:** 7
**Status:** Planning

## 1. Document Objective
This document defines the complete frontend component architecture of the Navya Collection website.

It establishes:
- Reusable UI components
- Component hierarchy
- Naming conventions
- Folder structure
- Component responsibilities
- Reusability standards
- UI consistency

The goal is to build a scalable, maintainable, and production-ready frontend using Next.js + TypeScript + Tailwind CSS + shadcn/ui.

## 2. Component Design Principles
Every component must follow these principles:
- Single Responsibility
- Reusable
- Responsive
- Accessible (WCAG-friendly)
- Type-safe
- Modular
- Easy to maintain

## 3. Component Hierarchy

```text
Application
│
├── Layout Components
│   ├── Header
│   ├── Footer
│   ├── Sidebar
│   └── Mobile Navigation
│
├── Common UI Components
│
├── Product Components
│
├── Cart Components
│
├── Checkout Components
│
├── Customer Components
│
├── Admin Components
│
└── Utility Components
```

## 4. Folder Structure

```text
components/
│
├── ui/
│
├── common/
│
├── layout/
│
├── home/
│
├── product/
│
├── category/
│
├── search/
│
├── cart/
│
├── checkout/
│
├── account/
│
├── order/
│
├── review/
│
├── admin/
│
├── forms/
│
├── icons/
│
└── shared/
```

## 5. UI Components

These are generic reusable components.

### Buttons
- Primary Button
- Secondary Button
- Outline Button
- Ghost Button
- Icon Button
- Loading Button

### Inputs
- Text Input
- Mobile Input
- Search Input
- Password Input
- OTP Input
- Textarea

### Cards
- Product Card
- Category Card
- Order Card
- Review Card
- Offer Card

### Badges
- Sale
- New
- Trending
- Out of Stock
- Limited Stock

### Alerts
- Success
- Error
- Warning
- Information

### Modals
- Login Modal
- Confirm Modal
- Delete Confirmation
- Address Selection

### Loaders
- Skeleton Loader
- Spinner
- Progress Bar

## 6. Layout Components

### Header
Contains:
- Logo
- Navigation
- Search
- Wishlist
- Cart
- Account
- Mobile Menu

### Footer
Contains:
- About
- Categories
- Policies
- Social Links
- Copyright

### Sidebar
Used in:
- Admin Panel
- Customer Dashboard

## 7. Homepage Components
- Hero Banner
- Featured Categories
- New Arrivals
- Trending Products
- Best Sellers
- Offer Banner
- Newsletter
- Testimonials

## 8. Product Components
- Product Grid
- Product Card
- Product Gallery
- Image Zoom
- Price Display
- Discount Badge
- Size Selector
- Color Selector
- Quantity Selector
- Product Description
- Related Products

## 9. Search Components
- Search Bar
- Search Suggestions
- Recent Searches
- Popular Searches
- Filter Sidebar
- Sort Dropdown

## 10. Cart Components
- Cart Item
- Cart Summary
- Coupon Box
- Quantity Stepper
- Remove Button
- Empty Cart

## 11. Checkout Components
- Address Card
- Address Form
- Payment Method
- Order Summary
- Coupon Section
- Checkout Progress Indicator

## 12. Customer Components
- Profile Card
- Address Card
- Order List
- Wishlist Grid
- Account Navigation

## 13. Order Components
- Order Timeline
- Tracking Status
- Order Details
- Invoice Summary (Future)

## 14. Review Components
- Rating Stars
- Review Form
- Review List
- Rating Summary

## 15. Admin Components

### Dashboard
- KPI Cards
- Revenue Chart
- Orders Table
- Customer Table
- Product Table

### Management
- Product Form
- Category Form
- Coupon Form
- Banner Form

## 16. Shared Components
- Breadcrumb
- Pagination
- Empty State
- Error State
- Not Found
- Back Button
- Share Button

## 17. Component Naming Convention
Examples:
```text
ProductCard.tsx
ProductGallery.tsx
CheckoutSummary.tsx
OrderTimeline.tsx
PrimaryButton.tsx
```

## 18. Props Standard
Every component should define:
- Required Props
- Optional Props
- Default Values
- Event Handlers
- Accessibility Attributes

## 19. Styling Rules
- Tailwind CSS utilities
- shadcn/ui primitives
- Consistent spacing
- Responsive breakpoints
- Dark mode support (future-ready)

## 20. Performance Guidelines
- Lazy load heavy components
- Optimize images
- Memoize expensive renders where appropriate
- Avoid unnecessary re-renders
- Dynamic imports for large sections

## 21. Accessibility
Every interactive component must support:
- Keyboard navigation
- Visible focus states
- ARIA labels where needed
- Screen reader compatibility
- Sufficient color contrast

## Deliverables
After implementing this architecture:
- Consistent UI across the website
- Reusable component library
- Faster feature development
- Easier maintenance
- Scalable frontend structure
