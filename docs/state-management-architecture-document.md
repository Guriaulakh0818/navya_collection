# State Management Architecture Document (SMAD)

**Document Version:** 1.0
**Project:** Navya Collection E-commerce Platform
**Phase:** 2 – Frontend Architecture
**Task:** 8
**Status:** Planning

---

## 1. Document Objective

This document defines the complete state management strategy for the Navya Collection e-commerce platform.

It specifies:

- Global state
- Local state
- Server state
- Session state
- Cache strategy
- State persistence
- Data synchronization

The objective is to ensure predictable, scalable, and high-performance state management across the application.

---

## 2. State Management Strategy

### Primary Technologies

| Technology | Purpose |
|---|---|
| React Context API | Auth session context |
| Zustand | Global client stores |
| TanStack Query (React Query) | Server state and API caching |
| Local Storage | Guest cart, wishlist, preferences |
| Cookies (Authentication) | Secure session tokens |

### Why This Stack?

- Lightweight
- Easy to maintain
- Excellent performance
- Optimized server caching
- Less boilerplate than Redux

---

## 3. State Classification

The application state is divided into four categories.

### Local UI State

Examples:

- Modal Open/Close
- Dropdown
- Accordion
- Tabs
- Loading indicators
- Form validation

Managed by:

- `useState`
- `useReducer` (complex forms)

### Global Client State

Examples:

- Shopping Cart
- Wishlist
- Theme (future)
- User Preferences
- Sidebar State

Managed by:

- Zustand

### Server State

Examples:

- Products
- Categories
- Orders
- Customer Profile
- Reviews

Managed by:

- TanStack Query

### Session State

Examples:

- Logged-in User
- Authentication Status
- Access Token / Session Cookie

Managed by:

- Secure HTTP-only Cookies
- Auth Context

---

## 4. Global Store Structure

```
stores/
│
├── auth.store.ts
├── cart.store.ts
├── wishlist.store.ts
├── ui.store.ts
├── checkout.store.ts
└── search.store.ts
```

---

## 5. Authentication State

**Store:** `auth.store.ts`

**Contains:**

- User ID
- Name
- Mobile Number
- Login Status
- Session Expiry
- Role

**Actions:**

- Login
- Logout
- Refresh Session

---

## 6. Cart State

**Store:** `cart.store.ts`

**Contains:**

- Items
- Quantity
- Total Price
- Discount
- Shipping Charges
- Grand Total

**Actions:**

- Add Item
- Remove Item
- Update Quantity
- Clear Cart

**Persistence:**

- Local Storage (Guest)
- Database (Logged-in User)

---

## 7. Wishlist State

**Store:** `wishlist.store.ts`

**Contains:**

- Product IDs

**Actions:**

- Add
- Remove
- Clear

**Synchronization:**

- Merge guest wishlist after login.

---

## 8. Checkout State

**Store:** `checkout.store.ts`

**Contains:**

- Selected Address
- Selected Payment Method
- Applied Coupon
- Delivery Charges
- Order Summary

**Actions:**

- Select Address
- Apply Coupon
- Choose Payment
- Reset Checkout

---

## 9. Search State

**Store:** `search.store.ts`

**Contains:**

- Search Keyword
- Selected Filters
- Sort Option
- Current Page

**Actions:**

- Update Filters
- Reset Filters
- Change Sorting
- Update Search Query

---

## 10. UI State

**Store:** `ui.store.ts`

**Contains:**

- Sidebar Open
- Mobile Menu
- Login Modal
- Loading States
- Toast Notifications

---

## 11. Server State (TanStack Query)

**Cached Resources:**

- Product List
- Product Details
- Categories
- Customer Orders
- Reviews

**Features:**

- Automatic caching
- Background refetch
- Optimistic updates (where appropriate)
- Request deduplication

---

## 12. State Persistence

| State | Storage |
|---|---|
| Cart (Guest) | Local Storage |
| Wishlist (Guest) | Local Storage |
| Authentication | Secure Cookies |
| User Preferences | Local Storage |
| Theme (Future) | Local Storage |

---

## 13. State Synchronization

### Guest → Logged-in User

After successful login:

1. Merge Cart
2. Merge Wishlist
3. Sync User Profile
4. Refresh Session

---

## 14. Error Handling

Each state store should handle:

- API Failure
- Validation Error
- Network Error
- Timeout
- Session Expiry

---

## 15. Loading Strategy

Types:

- Initial Loading
- Skeleton Loading
- Button Loading
- Infinite Scroll Loading

---

## 16. Cache Invalidation Rules

Invalidate cache after:

- Product update
- Order placement
- Profile update
- Review submission
- Coupon application

---

## 17. Folder Structure

```
src/
├── stores/
├── hooks/
├── providers/
├── lib/
└── services/
```

---

## 18. Performance Guidelines

- Keep global state minimal.
- Avoid storing server data in Zustand.
- Use React Query for all API-driven data.
- Memoize expensive selectors.
- Split stores by domain (Auth, Cart, Wishlist, etc.).

---

## 19. Security Considerations

- Never store OTP or payment data in client state.
- Do not expose sensitive user information in Local Storage.
- Authentication must rely on secure cookies.
- Validate state on every protected API request.

---

## 20. Future Enhancements

- Offline cart synchronization
- Background sync
- Push notification state
- Real-time inventory updates
- Multi-device cart synchronization

---

## Deliverables

After implementing this architecture:

- Predictable data flow
- Faster UI updates
- Efficient API usage
- Reliable session management
- Better scalability and maintainability