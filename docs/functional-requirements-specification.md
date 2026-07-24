# Navya Collection
# Functional Requirements Specification (FRS)

**Document Version:** 1.0
**Project:** Navya Collection E-commerce Platform
**Document Type:** Functional Requirements Specification (FRS)
**Prepared By:** Navya Collection Development Team
**Status:** Approved
**Last Updated:** July 2026

## 1. Document Purpose

This document defines the complete functional requirements of the Navya Collection E-commerce Platform. It serves as the official reference for designers, developers, testers, and future maintenance teams.

The purpose of this document is to clearly define:
- What the software should do.
- How users interact with the system.
- How the system responds.
- Business rules.
- Functional behaviour.
- System workflows.

## 2. Project Overview

Navya Collection is a modern fashion e-commerce platform focused on selling Gents and Kids Garments across India.

The website is designed to provide a premium shopping experience while maintaining affordability, trust, and scalability.

### Current Business Categories
- Gents Garments
- Kids Garments

### Future Expansion
- Women
- Accessories

### Business Model
Offline + Online Ecommerce

### Primary Sales Channel
Official Website

### Future Channels
- Amazon
- Flipkart
- Meesho

## 3. User Roles

### Customer
Customer can:
- Browse Products
- Search Products
- Filter Products
- View Product Details
- Add Products to Cart
- Add Products to Wishlist
- Login using Mobile OTP
- Manage Addresses
- Place Orders
- Track Orders
- View Order History
- Review Products

### Administrator
Administrator can:
- Manage Products
- Manage Categories
- Manage Inventory
- Manage Customers
- Manage Orders
- Manage Coupons
- Manage Homepage Banners
- View Reports
- View Analytics
- Configure Website

## 4. Functional Modules

| Module ID | Module Name |
|-----------|-------------|
| M01 | Homepage |
| M02 | Product Catalogue |
| M03 | Product Details |
| M04 | Authentication |
| M05 | Customer Profile |
| M06 | Wishlist |
| M07 | Shopping Cart |
| M08 | Checkout |
| M09 | Orders |
| M10 | Order Tracking |
| M11 | Reviews |
| M12 | Contact |
| M13 | Admin Dashboard |

## 5. Module Specifications

### Module M01 – Homepage
**Purpose:** Provide an engaging landing page that builds trust and allows customers to discover products quickly.

**Features:**
- Hero Banner
- Featured Categories
- Trending Products
- New Arrivals
- Best Sellers
- Featured Offers
- Customer Testimonials
- Newsletter
- Footer

**User Actions:**
- Browse Categories
- Open Product Pages
- Search Products
- Navigate through Website

### Module M02 – Product Catalogue
**Features:**
- Category Listing
- Product Grid
- Pagination
- Sorting
- Search
- Filters

**Filters:**
- Category
- Price
- Size
- Color
- Availability

**Sorting:**
- Latest
- Best Selling
- Price Low to High
- Price High to Low

### Module M03 – Product Details
**Display Information:**
- Product Images
- Product Name
- SKU
- Category
- Price
- Discount
- Available Sizes
- Available Colors
- Stock Status
- Description
- Specifications
- Related Products

**Available Actions:**
- Add to Cart
- Buy Now
- Add to Wishlist

### Module M04 – Authentication
**Login Method:** Mobile Number + OTP

**Functional Flow:**
Customer enters Mobile Number → System validates Mobile Number → Generate OTP → Send OTP → Customer enters OTP → Verify OTP → Customer Login Successful

**Validation Rules:**
- Indian Mobile Number only
- OTP expiry = 5 Minutes
- Maximum OTP Resend = 3
- Maximum Verification Attempts = 5

### Module M05 – Customer Profile
Customer can:
- Edit Profile
- Manage Addresses
- View Order History
- Manage Wishlist
- Logout

### Module M06 – Wishlist
Customer can:
- Add Products
- Remove Products
- Move Product to Cart

Wishlist shall remain available after future logins.

### Module M07 – Shopping Cart
Customer can:
- Add Products
- Remove Products
- Increase Quantity
- Decrease Quantity

**Validation:**
- Quantity must not exceed available stock.
- Out-of-stock products cannot be purchased.

### Module M08 – Checkout
**Workflow:** Cart → Authentication → Address → Coupon → Payment → Review Order → Place Order

**Supported Payment Methods:**
- Cash on Delivery
- Razorpay

### Module M09 – Orders
Customer can:
- View Orders
- View Order Details
- Cancel Order (Before Shipment)

Future:
- Download Invoice

### Module M10 – Order Tracking
Customer enters:
- Mobile Number
- Order ID

System displays:
- Order Placed
- Confirmed
- Packed
- Shipped
- Out for Delivery
- Delivered

### Module M11 – Reviews
Verified Customers can:
- Give Ratings
- Write Reviews

Future:
- Upload Images

### Module M12 – Contact
Customer can:
- Call
- WhatsApp
- Email
- Submit Contact Form

### Module M13 – Admin Dashboard
**Dashboard Displays:**
- Revenue
- Sales
- Orders
- Customers
- Pending Orders

**Product Management:**
- Add Product
- Edit Product
- Delete Product
- Upload Images
- Update Inventory

**Order Management:**
- View Orders
- Update Status
- Print Invoice
- Generate Shipping Label

**Customer Management:**
- Search Customers
- View Customer Details
- View Customer Orders

**Coupon Management:**
- Create Coupon
- Edit Coupon
- Activate Coupon
- Deactivate Coupon
- Delete Coupon

## 6. Business Rules
- Every Product must belong to one Category.
- Every Order must contain at least one Product.
- Mobile Number must be unique.
- Stock Quantity cannot become negative.
- Order ID must always be unique.
- Only Verified Users can place Orders.
- Only Verified Buyers can submit Reviews.

## 7. Non Functional Requirements

### Performance
- Homepage Load Time < 3 Seconds
- Product Page < 2 Seconds
- Mobile First
- Responsive Design

### Security
- HTTPS
- OTP Authentication
- Secure Payments
- Input Validation
- Rate Limiting

### Compatibility
- Chrome
- Firefox
- Edge
- Safari

## 8. Third Party Integrations
- Supabase
- Prisma ORM
- Cloudinary
- Razorpay
- Shiprocket
- MSG91
- Google Analytics
- Google Search Console

## 9. Success Criteria
The software shall be considered complete when:
- Customer can browse products.
- Customer can login using Mobile OTP.
- Customer can place orders.
- Customer can track orders.
- Administrator can manage products.
- Administrator can manage orders.
- Payment gateway functions correctly.
- Website performs reliably on all devices.

## 10. Revision History

| Version | Description |
|---------|-------------|
| 1.0 | Initial Functional Requirements Specification |

## Document Approval
**Status:** Approved

This document serves as the official Functional Requirements Specification (FRS) for the development of the Navya Collection E-commerce Platform.
