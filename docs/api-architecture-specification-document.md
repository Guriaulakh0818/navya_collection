# Navya Collection
# API Architecture & Specification Document (AASD)

**Document Version:** 1.0
**Project:** Navya Collection E-commerce Platform
**Phase:** 2 – System Architecture
**Task:** 6
**Status:** Planning

## Document Objective
This document defines the standardized API architecture for the Navya Collection platform.

It covers:
- API architecture
- Endpoint naming
- Request and response format
- Authentication
- Validation
- Error handling
- Status codes
- API versioning
- Security standards

This document will help both frontend and backend teams follow the same API contract.

## 1. API Architecture

### API Style
- RESTful API

### Base URL
**Development**
```text
http://localhost:3000/api
```

**Production**
```text
https://navyacollection.store/api
```

### Versioning
```text
/api/v1/
```

Future versions:
```text
/api/v2/
/api/v3/
```

## 2. API Categories

| Category | Purpose |
|----------|---------|
| Authentication | Login and OTP |
| Products | Product data |
| Categories | Product categories |
| Cart | Shopping cart |
| Wishlist | Wishlist |
| Orders | Orders |
| Payments | Razorpay |
| Shipping | Shiprocket |
| Customer | Profile |
| Admin | Dashboard |
| Upload | Images |
| Coupons | Discounts |
| Reviews | Product reviews |

## 3. Authentication APIs

### Send OTP
```http
POST /api/v1/auth/send-otp
```

**Request**
```json
{
  "mobile": "9876543210"
}
```

**Success Response**
```json
{
  "success": true,
  "message": "OTP sent successfully."
}
```

### Verify OTP
```http
POST /api/v1/auth/verify-otp
```

**Request**
```json
{
  "mobile": "9876543210",
  "otp": "123456"
}
```

**Response**
```json
{
  "success": true,
  "token": "jwt_token",
  "user": {}
}
```

## 4. Product APIs

### Get Products
```http
GET /api/v1/products
```

**Supported Filters**
- Category
- Search
- Price
- Size
- Color
- Sort
- Page

### Get Product Details
```http
GET /api/v1/products/{slug}
```

### Search Products
```http
GET /api/v1/products/search
```

## 5. Category APIs
```http
GET /api/v1/categories
GET /api/v1/categories/{slug}
```

## 6. Cart APIs

### Get Cart
```http
GET /api/v1/cart
```

### Add to Cart
```http
POST /api/v1/cart
```

### Update Cart
```http
PUT /api/v1/cart/{id}
```

### Remove Item
```http
DELETE /api/v1/cart/{id}
```

## 7. Wishlist APIs
```http
GET /api/v1/wishlist
POST /api/v1/wishlist
DELETE /api/v1/wishlist/{id}
```

## 8. Address APIs
```http
GET /api/v1/addresses
POST /api/v1/addresses
PUT /api/v1/addresses/{id}
DELETE /api/v1/addresses/{id}
```

## 9. Checkout APIs
```http
POST /api/v1/checkout
```

**Responsibilities**
- Validate cart
- Validate stock
- Validate coupon
- Calculate totals

## 10. Order APIs

### Create Order
```http
POST /api/v1/orders
```

### Get Orders
```http
GET /api/v1/orders
```

### Get Order Details
```http
GET /api/v1/orders/{id}
```

### Cancel Order
```http
POST /api/v1/orders/{id}/cancel
```

## 11. Payment APIs

### Create Razorpay Order
```http
POST /api/v1/payments/create-order
```

### Verify Payment
```http
POST /api/v1/payments/verify
```

### COD
Handled during order creation.

## 12. Shipping APIs

### Create Shipment
```http
POST /api/v1/shipping/create
```

### Track Shipment
```http
GET /api/v1/shipping/{trackingId}
```

## 13. Review APIs
```http
POST /api/v1/reviews
GET /api/v1/reviews/{productId}
```

## 14. Admin APIs

### Products
```http
POST /api/v1/admin/products
PUT /api/v1/admin/products/{id}
DELETE /api/v1/admin/products/{id}
```

### Orders
```http
GET /api/v1/admin/orders
PUT /api/v1/admin/orders/{id}
```

### Customers
```http
GET /api/v1/admin/customers
```

### Coupons
```http
GET /api/v1/admin/coupons
POST /api/v1/admin/coupons
PUT /api/v1/admin/coupons/{id}
DELETE /api/v1/admin/coupons/{id}
```

## 15. Standard Response Format

### Success
```json
{
  "success": true,
  "message": "Request completed successfully.",
  "data": {}
}
```

### Error
```json
{
  "success": false,
  "message": "Invalid request.",
  "errors": []
}
```

## 16. HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

## 17. API Security
- HTTPS only
- JWT / Session Authentication
- Secure Cookies
- Rate Limiting
- Input Validation
- Request Size Limits
- CORS Configuration
- Logging
- Audit Trail (future)

## 18. API Documentation Standards
Every API must include:
- Endpoint
- HTTP Method
- Purpose
- Authentication Required (Yes/No)
- Request Body
- Query Parameters
- Path Parameters
- Success Response
- Error Response
- Validation Rules

## 19. Future APIs
- Returns
- Exchanges
- Loyalty Program
- Gift Cards
- Notifications
- Blogs
- FAQs
- Marketplace Sync
- Analytics Dashboard

## Deliverables
After completing this document, the project will have:
- A complete REST API contract.
- Standard request/response formats.
- Consistent endpoint naming.
- Security and validation guidelines.
- Clear implementation reference for frontend and backend.
