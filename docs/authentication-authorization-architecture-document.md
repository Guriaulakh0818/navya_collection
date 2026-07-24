# Navya Collection
# Authentication & Authorization Architecture Document (AAAD)

**Document Version:** 1.0
**Project:** Navya Collection E-commerce Platform
**Phase:** 2 – System Architecture
**Task:** 5
**Status:** Planning

## Document Objective
This document defines the complete authentication and authorization architecture for the Navya Collection website.

It explains:
- How customers will login.
- How admins will login.
- How sessions will be maintained.
- How protected pages will be secured.
- How APIs will be secured.
- How roles and permissions will work.

## 1. Authentication Strategy

### Customer Authentication
**Method:**
- Mobile Number
- One-Time Password (OTP)

**Why?**
- Fast login
- No password memory issue
- Better conversion
- Suitable for a mobile-first audience

### Admin Authentication
**Method:**
- Email + Password

**Future:**
- Two-Factor Authentication (2FA)

## 2. User Roles

### Guest
**Permissions:**
- Browse website
- Search products
- View product details
- Add to cart
- Add to wishlist (temporary)

**Restrictions:**
- No checkout
- No order history
- No account pages

### Customer
**Permissions:**
- Checkout
- Order placement
- Order tracking
- Wishlist
- Reviews
- Profile management
- Address management

### Administrator
**Permissions:**
- Product management
- Category management
- Inventory management
- Order management
- Customer management
- Coupon management
- Banner management
- Analytics
- Website settings

## 3. Customer Login Flow

```text
Enter Mobile Number
    ↓
Validate Number
    ↓
Generate OTP
    ↓
Send OTP (MSG91)
    ↓
Enter OTP
    ↓
Verify OTP
    ↓
Create Account (if new)
    ↓
Login Successful
    ↓
Redirect to Previous Page
```

## 4. Admin Login Flow

```text
Email
    ↓
Password
    ↓
Validate Credentials
    ↓
Create Session
    ↓
Admin Dashboard
```

## 5. Session Management

### Technology
- Secure HTTP-only Cookies
- JWT (or Supabase Auth session if applicable)

### Session Rules

**Customer:**
- Auto login after OTP verification
- Session persists until logout or expiry

**Admin:**
- Separate admin session
- Shorter timeout for security

## 6. Route Protection

### Public Routes
- Home
- Shop
- Categories
- Product
- Search
- Contact
- About

### Protected Customer Routes
- `/account`
- `/account/orders`
- `/account/profile`
- `/checkout`
- `/wishlist`

### Protected Admin Routes
- `/admin/*`

## 7. Authorization Rules

| Action | Guest | Customer | Admin |
|--------|-------|----------|-------|
| Browse Products | ✅ | ✅ | ✅ |
| Add to Cart | ✅ | ✅ | ✅ |
| Checkout | ❌ | ✅ | ✅ |
| Track Orders | ❌ | ✅ | ✅ |
| Manage Products | ❌ | ❌ | ✅ |
| Manage Orders | ❌ | ❌ | ✅ |
| Manage Customers | ❌ | ❌ | ✅ |

## 8. OTP Rules
- Length: 6 digits
- Expiry: 5 minutes
- Resend limit: 3 attempts
- Verification attempts: 5
- New OTP invalidates previous OTP

## 9. Account Creation
If mobile number exists:
- Login

If mobile number does not exist:
- Automatically create customer account

## 10. Logout

### Customer
- Clear session
- Redirect to homepage

### Admin
- Clear admin session
- Redirect to admin login

## 11. Security Features
- HTTPS only
- Secure cookies
- CSRF protection
- Rate limiting
- Input validation
- OTP expiry
- Session expiry
- API authentication
- Audit logging (future)

## 12. Middleware Responsibilities
Middleware will:
- Verify user session
- Protect customer routes
- Protect admin routes
- Redirect unauthenticated users
- Handle unauthorized access

## 13. Future Enhancements
- Google Login
- Apple Login
- WhatsApp OTP
- Passkeys
- Two-Factor Authentication
- Social Login

## Deliverables
After implementing this architecture:
- Secure customer authentication
- Secure admin authentication
- Protected routes
- Session management
- Role-based access control
- Scalable authentication system
