# JiivaaKart — Complete Design System & Color Architecture (design.md)

> **Single Source of Truth (SSOT)** for all Color Tokens, Visual Hierarchy, Typography, Surfaces, and Multi-Portal UI Consistency across JiivaaKart.
> Permanent reference document to eliminate all color discrepancies across Storefront, Marketing, Customer Account, Seller Portal, and Admin Portal.

---

## 1. Executive Summary & Brand Identity

### 1.1 Brand Foundation

- **Legal Entity**: JiivaaKart Private Limited
- **Brand Name**: **JiivaaKart**
- **Brand Tagline**: _Style That Speaks_
- **Visual Essence**: Premium Indian E-Commerce Marketplace combining timeless trust, bespoke elegance, and vibrant retail energy (inspired by high-standard commerce platforms like Myntra Luxe, Tata CLiQ Luxury, and Flipkart SuperElite).

### 1.2 Core Brand Color DNA

| Role                | Color Name          | Hex Code  | Purpose & Brand Association                                                                    |
| :------------------ | :------------------ | :-------- | :--------------------------------------------------------------------------------------------- |
| **Primary Brand**   | **Royal Navy**      | `#183A73` | Primary brand authority, navigation bar, key headings, primary buttons, luxury grounding.      |
| **Brand Accent**    | **Sunset Orange**   | `#F15A25` | High-energy calls-to-action (Add to Cart, Buy Now), promotional highlights, active indicators. |
| **Primary Deep**    | **Midnight Navy**   | `#09172E` | Footers, dark sidebar, high-contrast headings, inverted surfaces.                              |
| **App Canvas**      | **Main Background** | `#FAFAFA` | Page background, calm neutral base reducing eye strain.                                        |
| **Card Surface**    | **Surface / Cards** | `#FFFFFF` | Product cards, tables, modal containers, checkout forms.                                       |
| **Foreground Text** | **Foreground**      | `#1E1E1E` | Primary body and heading text for maximum crisp readability.                                   |
| **Muted Text**      | **Muted Text**      | `#6B7280` | Secondary descriptions, captions, dates, breadcrumbs.                                          |
| **Card Border**     | **Border**          | `#E5E7EB` | Subtle clean boundary for cards, inputs, and tables.                                           |
| **Divider**         | **Divider**         | `#F3F4F6` | Subtle separators between list items and layout sections.                                      |
| **Rating / Amber**  | **Amber**           | `#F59E0B` | Star ratings and review highlights.                                                            |
| **Success**         | **Success**         | `#22C55E` | Order delivered, KYC approved, in-stock badge.                                                 |
| **Error**           | **Error**           | `#EF4444` | Payment failed, cancelled order, out-of-stock badge.                                           |
| **Info**            | **Info**            | `#3B82F6` | Shipped, in-transit, informational badges.                                                     |

---

## 2. Complete Website Architecture & Page Audit (70 Routes)

The JiivaaKart platform consists of **70 unique routes** organized across 5 distinct portals. Every route and its key UI features have been cataloged below:

### 2.1 Customer Storefront & Public Commerce (18 Pages)

|  #  | Route               | Page Title / Role            | Key UI Elements & Color Features                                                                                                     |
| :-: | :------------------ | :--------------------------- | :----------------------------------------------------------------------------------------------------------------------------------- |
|  1  | `/`                 | Home Page                    | Hero Slider, Announcement Bar, Curated Categories, Flash Sale Carousel, Boutique Showcase, Social Proof.                             |
|  2  | `/men`              | Men's Fashion Hub            | Gender banner, sub-category chips, seasonal collection grid, price filter cards.                                                     |
|  3  | `/women`            | Women's Fashion Hub          | Hero lookbook, ethnic & western carousels, boutique cards, festive banners.                                                          |
|  4  | `/kids`             | Kids & Baby Hub              | Pastel-toned accents, age-group filters, multi-pack badges.                                                                          |
|  5  | `/shop`             | All Products Catalog         | Filter sidebar (facets), sorting dropdown, product grid, active filter pills, pagination.                                            |
|  6  | `/shop/[slug]`      | Dedicated Seller Storefront  | Merchant banner, seller rating badge, verified boutique seal, shop search, product feed.                                             |
|  7  | `/shops`            | Featured Boutiques Directory | Verified boutique directory, city badges, top seller spotlight, rating breakdown.                                                    |
|  8  | `/category`         | Category Taxonomy Index      | Department cards, visual hierarchy, category search.                                                                                 |
|  9  | `/category/[slug]`  | Subcategory Feed             | Category banner, breadcrumb bar, faceted product filters, quick-add buttons.                                                         |
| 10  | `/product/[slug]`   | Product Details Page (PDP)   | Image gallery, variant selectors (size/color), Add to Cart CTA, Buy Now CTA, Seller Card, Delivery Pincode checker, Reviews section. |
| 11  | `/search`           | Global Search Results        | Query header, keyword suggestions, zero-state fallback, filtered product cards.                                                      |
| 12  | `/cart`             | Shopping Cart                | Multi-seller grouped cart items, quantity stepper, coupon box, price summary, checkout button.                                       |
| 13  | `/checkout`         | One-Page Checkout            | Address selector/modal, delivery options, payment radio cards (Razorpay/COD), order summary breakdown.                               |
| 14  | `/checkout/success` | Order Confirmed              | Celebration icon, order number badge, delivery timeline tracker, continue shopping button.                                           |
| 15  | `/checkout/failure` | Payment Failed               | Retry payment button, failed transaction alert, customer support link.                                                               |
| 16  | `/wishlist`         | Saved Items                  | Grid of favorited products, move to cart button, remove item action.                                                                 |
| 17  | `/city/[slug]`      | City Landing Page (SEO/GEO)  | Regional heritage banner, local boutique list, regional fast-delivery badges.                                                        |
| 18  | `/become-seller`    | Merchant Acquisition Landing | Benefits grid, seller registration CTA, fee transparency table, seller FAQs.                                                         |

### 2.2 Marketing, Legal & Consumer Policies (9 Pages)

|  #  | Route                   | Page Title / Role          | Key UI Elements & Color Features                                                       |
| :-: | :---------------------- | :------------------------- | :------------------------------------------------------------------------------------- |
| 19  | `/about`                | About JiivaaKart           | Brand narrative hero, core values cards, leadership note, craftsmanship highlights.    |
| 20  | `/contact`              | Customer Support & Help    | Contact inquiry form, grievance officer details, support channels, response SLA cards. |
| 21  | `/faq`                  | Frequently Asked Questions | Categorized accordion tabs, search FAQ bar, helpfulness feedback.                      |
| 22  | `/privacy-policy`       | Privacy Policy             | Legal documentation layout, section sidebar navigation, date stamps.                   |
| 23  | `/terms-and-conditions` | Terms & Conditions         | Marketplace legal framework, disclaimer callouts, merchant and customer obligations.   |
| 24  | `/shipping-policy`      | Shipping & Delivery Policy | Courier SLAs, dispatch timelines, pin code coverage table.                             |
| 25  | `/return-policy`        | Returns & Exchange Policy  | 7-day return flow, non-returnable items badge, refund turnaround cards.                |
| 26  | `/cancellation-policy`  | Cancellation Policy        | Cancellation windows, automated instant refund rules.                                  |
| 27  | `/seller-agreement`     | Master Seller Agreement    | Merchant fee structure, penalty clauses, commercial settlement terms.                  |

### 2.3 Authentication & Customer Account Portal (7 Pages)

|  #  | Route                          | Page Title / Role           | Key UI Elements & Color Features                                                            |
| :-: | :----------------------------- | :-------------------------- | :------------------------------------------------------------------------------------------ |
| 28  | `/login`                       | Customer & Merchant Login   | Mobile OTP input, Google One-Tap OAuth button, terms disclaimer, resend timer.              |
| 29  | `/account`                     | Customer Account Dashboard  | Profile summary card, quick action shortcuts, recent orders snapshot.                       |
| 30  | `/account/orders`              | Order History               | Order status badges (Placed, Shipped, Delivered, Cancelled), tracking link, action buttons. |
| 31  | `/account/orders/[id]`         | Order Tracking & Details    | Step progress tracker (Timeline), item list, invoice download, return request CTA.          |
| 32  | `/account/orders/[id]/success` | Post-Checkout Redirection   | Instant order state card, SMS/Email notification reminder.                                  |
| 33  | `/account/addresses`           | Saved Addresses Manager     | Default address badge, edit/delete actions, new address modal form.                         |
| 34  | `/account/settings`            | Profile & Security Settings | Personal details edit, email verification badge, phone change modal.                        |

### 2.4 Merchant Seller Portal (14 Pages)

|  #  | Route                         | Page Title / Role               | Key UI Elements & Color Features                                                                    |
| :-: | :---------------------------- | :------------------------------ | :-------------------------------------------------------------------------------------------------- |
| 35  | `/seller/dashboard`           | Merchant Cockpit                | Real-time sales KPIs, pending dispatch alert, revenue chart, top products.                          |
| 36  | `/seller/products`            | Catalog & Inventory Manager     | Product list table, stock status pills (In Stock, Low Stock, Out of Stock), bulk actions.           |
| 37  | `/seller/products/new`        | Multi-Step Product Creator      | Image dropzone, category selector, variant matrix generator (size/color/SKU), price/tax inputs.     |
| 38  | `/seller/products/[id]/edit`  | Product Editor                  | Image manager, variant updater, approval status banner.                                             |
| 39  | `/seller/orders`              | Order Fulfillment Center        | Tabbed views (Pending, Ready to Ship, Shipped, Delivered, Cancelled), manifest generator.           |
| 40  | `/seller/orders/[id]/invoice` | Merchant Tax Invoice            | Printable PDF-style layout, GSTIN breakdown, seller & buyer addresses.                              |
| 41  | `/seller/orders/[id]/label`   | Shipping Label & Barcode        | Courier AWB barcode, package dimensions, return address block.                                      |
| 42  | `/seller/finance/payouts`     | Settlements & Ledger            | Net payout balance card, bank account verification, settlement ledger table, commission deductions. |
| 43  | `/seller/analytics`           | Business Intelligence           | Sales velocity, return rate tracker, customer traffic breakdown.                                    |
| 44  | `/seller/profile`             | Boutique Profile & Verification | Business PAN/GST upload, bank account details, brand logo uploader.                                 |
| 45  | `/seller/settings`            | Operational Preferences         | Pickup address configuration, shipping partner preferences, vacation mode toggle.                   |
| 46  | `/seller/shop`                | Storefront Customization        | Banner image crop tool, boutique bio, return address picker.                                        |
| 47  | `/sellers`                    | Seller Directory List           | Public marketplace seller list.                                                                     |
| 48  | `/sellers/[id]`               | Public Seller Profile           | Public seller page with rating, badges, and catalog.                                                |

### 2.5 Admin Operations & Governance Portal (22 Pages)

|  #  | Route                        | Page Title / Role             | Key UI Elements & Color Features                                                      |
| :-: | :--------------------------- | :---------------------------- | :------------------------------------------------------------------------------------ |
| 49  | `/admin`                     | Root Admin Guard              | Redirects to dashboard or login depending on session.                                 |
| 50  | `/admin/login`               | Super Admin Secure Login      | Dedicated admin credential auth with rate limiting.                                   |
| 51  | `/admin/set-password`        | Admin Credential Setup        | Initial super-admin password provisioning.                                            |
| 52  | `/admin/dashboard`           | Command Center                | GMV aggregate, active orders counter, commission accrued, system health indicators.   |
| 53  | `/admin/products`            | Master Product Catalog        | Platform-wide inventory table, featured toggles, category filtering.                  |
| 54  | `/admin/products/approvals`  | Merchant QC Queue             | Approval/Rejection modal, image compliance checker, quality notes.                    |
| 55  | `/admin/orders`              | Master Order Log              | Omnichannel order log, multi-seller shipment split inspector, payment audit logs.     |
| 56  | `/admin/returns`             | Return & Refund Governance    | Return reason approval, reverse pickup status, refund issuance button.                |
| 57  | `/admin/categories`          | Taxonomy & Attribute Engine   | Dynamic category tree, attribute mapping, SEO slug manager.                           |
| 58  | `/admin/coupons`             | Global & Merchant Coupons     | Coupon creator, discount rule builder (percentage/flat), usage limit counters.        |
| 59  | `/admin/offers`              | Promotional Campaign Engine   | Flash deal scheduler, hero slider banner manager, discount tags.                      |
| 60  | `/admin/reviews`             | Review Moderation Queue       | Star rating filter, verified purchase badge, spam flag & approval buttons.            |
| 61  | `/admin/sellers`             | Merchant Approval Roster      | KYC verification status (Pending, Approved, Suspended), commission tier tags.         |
| 62  | `/admin/sellers/[id]`        | Merchant Deep Dive            | Merchant bank details, sales volume, active listings, payout logs.                    |
| 63  | `/admin/shops`               | Boutique Storefront Registry  | Boutique verification badge, suspension toggle, logo inspection.                      |
| 64  | `/admin/team`                | Internal Staff Access Control | Role manager (Owner, Super Admin, Finance, Support), invite email modal.              |
| 65  | `/admin/users`               | Customer Registry             | User list, order count, registered dates, block/unblock controls.                     |
| 66  | `/admin/shipping`            | Logistics & Courier Control   | Shiprocket courier integrations, pincode serviceable matrix, rate calculator.         |
| 67  | `/admin/analytics`           | Enterprise BI & Trends        | Cohort analysis, average order value (AOV), refund percentage trends.                 |
| 68  | `/admin/finance/commission`  | Marketplace Take-Rate Engine  | Category-level commission sliders (e.g. 10%, 15%), payment gateway fee configuration. |
| 69  | `/admin/finance/settlements` | Vendor Payout Authorizer      | T+7 batch settlement engine, bank transfer batch exporter, payout status tags.        |
| 70  | `/admin/unauthorized`        | RBAC Access Denied            | Security warning, role escalation contact button, return home CTA.                    |

---

## 3. Current Color Discrepancy Audit (Findings)

Our codebase scan revealed **72 unique hex codes** and significant color fragmentation across components:

### 3.1 Legacy Brand Colors Still Lingering

Prior to rebranding to JiivaaKart, the project used legacy colors (`#183A73` and `#F15A25`). These are still actively hardcoded in several files:

- **`#F15A25` (Old Orange)**: Found **133 times** across 6 files, including:
  - `src/app/admin/products/page.tsx`
  - `src/frontend/features/auth/components/login-form.tsx`
  - `src/frontend/features/categories/components/CategoryExplorer.tsx`
  - `src/frontend/features/categories/components/CategoryFilteredView.tsx`
  - `src/backend/services/order-email.service.ts`
  - `src/frontend/features/notifications/templates/index.ts`
- **`#183A73` (Old Navy)**: Found **59 times** across 7 files, including:
  - `src/app/(public)/city/[slug]/page.tsx`
  - `src/frontend/components/layout/header/MobileMenu.tsx`
  - `src/frontend/features/auth/components/login-form.tsx`
  - `src/frontend/features/categories/components/CategoryBanner.tsx`
  - `src/frontend/features/categories/components/CategoryExplorer.tsx`
  - `src/backend/services/order-email.service.ts`
  - `src/frontend/features/notifications/templates/index.ts`

### 3.2 Competing Tailwind Color Families

| Tailwind Family | Occurrences | Issues / Inconsistencies                                                                                                     |
| :-------------- | :---------: | :--------------------------------------------------------------------------------------------------------------------------- |
| `amber-*`       |  **1,238**  | Heavily used for warm accents, star ratings, alert banners, and some buttons instead of the official `orange-*` brand color. |
| `orange-*`      |   **284**   | Official brand accent, but currently overshadowed by `amber-*`.                                                              |
| `slate-*`       |  **3,643**  | Dominant neutral scale, but randomly mixed with `gray-*` (179 times).                                                        |
| `navy-*`        |  **1,047**  | Primary brand scale, but some admin tables and buttons randomly use `indigo-*` (126 times) or `blue-*` (60 times).           |
| `emerald-*`     |   **613**   | Used for success states, but inconsistent with `brand.success` (`#22C55E`).                                                  |
| `brand-*`       |    **8**    | Design tokens defined in `tailwind.config.ts` are barely used (only 8 times)!                                                |

### 3.3 Surface & Background Inconsistencies

- Some pages use `bg-slate-50` (`#F8FAFC`).
- Other pages use `bg-gray-50` (`#F9FAFB`).
- Main layout uses `bg-brand-background` (`#FAFAFA`).
- Result: Noticeable background color shifts when navigating between Storefront, Account, Seller, and Admin pages.

---

## 4. Proposed Standardized Design System & Color Tokens

To ensure **100% permanent consistency** across all 70 pages, the following unified token taxonomy is established:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        JIIVAAKART COLOR SYSTEM                         │
├───────────────────┬───────────────────┬────────────────────────────────┤
│   PRIMARY BRAND   │   ACCENT & CTA    │       NEUTRAL & SURFACE        │
│   Jiivaa Navy     │   Saffron Orange  │   Off-White & Clean Slate      │
│     #0A2342       │     #F28C28       │    Canvas: #FAFAFA             │
│   (Shades 50-900) │   (Shades 50-900) │    Surface: #FFFFFF            │
│                   │                   │    Border: #E2E8F0             │
├───────────────────┴───────────────────┴────────────────────────────────┤
│                            SEMANTIC STATES                             │
│   SUCCESS: #16A34A (Green)       │   WARNING: #D97706 (Amber)          │
│   ERROR:   #DC2626 (Red)         │   INFO:    #0284C7 (Sky/Blue)       │
└────────────────────────────────────────────────────────────────────────┘
```

### 4.1 Palette Specifications

#### Palette 1: Primary Brand — Jiivaa Navy (`navy`)

Used for brand authority, navigation bar, footer, table headers, and high-priority action framing.

- `navy-50`: `#F0F4F8` (Ultra-light tint for active navigation tabs)
- `navy-100`: `#D9E2EC` (Subtle navy card border / selected card background)
- `navy-200`: `#BCCCDC` (Muted decorative lines)
- `navy-300`: `#829AB1` (Subtle icons in navy context)
- `navy-400`: `#486581` (Secondary text in dark sections)
- `navy-500`: `#143660` (Hover state for primary buttons)
- **`navy-600` / `DEFAULT`**: **`#0A2342`** (The Core Jiivaa Navy)
- `navy-700`: `#081C35` (Active / Pressed state for buttons)
- `navy-800`: `#061528` (Header and mobile drawer background)
- `navy-900`: `#051329` (Footer background and deep contrast elements)

#### Palette 2: Brand Accent & Action — Saffron Orange (`orange`)

Used for commerce CTAs ("Add to Cart", "Buy Now", "Proceed to Checkout"), discount tags, badge highlights, and active notification pips.

- `orange-50`: `#FFF7ED` (Discount pill background, active filter chip background)
- `orange-100`: `#FFEDD5` (Promo banner background, soft alert container)
- `orange-200`: `#FED7AA` (Coupon border highlight)
- `orange-300`: `#FDBA74` (Secondary accent border)
- `orange-400`: `#FB923C` (Lighter orange for gradients & hover)
- **`orange-500` / `DEFAULT`**: **`#F28C28`** (The Core Jiivaa Orange CTA)
- `orange-600`: `#E07A18` (Hover state for orange buttons)
- `orange-700`: `#B56110` (Dark orange text on light orange background)
- `orange-800`: `#8A4A0A` (Deep orange contrast border)
- `orange-900`: `#5E3205` (Text for high-contrast warnings)

#### Palette 3: Neutrals & Surfaces (`surface` & `slate`)

Provides an ultra-clean, modern luxury canvas that makes product photography pop.

- **Canvas / App Background**: `#FAFAFA` (`bg-[#FAFAFA]` or `bg-brand-background`)
- **Card / Sheet Surface**: `#FFFFFF` (`bg-white`)
- **Muted Surface / Table Alternate Row**: `#F8FAFC` (`bg-slate-50`)
- **Border Subtle**: `#F1F5F9` (`border-slate-100`)
- **Border Default**: `#E2E8F0` (`border-slate-200`)
- **Border Strong / Input Focused**: `#CBD5E1` (`border-slate-300`)
- **Text Caption / Placeholder**: `#94A3B8` (`text-slate-400`)
- **Text Muted / Subtitle**: `#64748B` (`text-slate-500`)
- **Text Body**: `#334155` (`text-slate-700`)
- **Text Heading / Strong**: `#0F172A` (`text-slate-900`)

#### Palette 4: Semantic Status Roles

Consistent status communication across Order tracking, Seller KYC, and Admin management:

| Status State       | Background (10%)            | Border (30%)                     | Text / Icon (Solid)            | Semantic Meaning                                  |
| :----------------- | :-------------------------- | :------------------------------- | :----------------------------- | :------------------------------------------------ |
| **Success**        | `bg-emerald-50` (`#ECFDF5`) | `border-emerald-200` (`#A7F3D0`) | `text-emerald-700` (`#047857`) | Delivered, Approved, Paid, Active, In Stock       |
| **Warning**        | `bg-amber-50` (`#FFFBEB`)   | `border-amber-200` (`#FDE68A`)   | `text-amber-800` (`#92400E`)   | Pending Verification, Low Stock, Action Needed    |
| **Error / Danger** | `bg-red-50` (`#FEF2F2`)     | `border-red-200` (`#FECACA`)     | `text-red-700` (`#B91C1C`)     | Cancelled, Rejected, Out of Stock, Failed         |
| **Info / Process** | `bg-sky-50` (`#F0F9FF`)     | `border-sky-200` (`#BAE6FD`)     | `text-sky-700` (`#0369A1`)     | Shipped, In Transit, Processing, KYC Under Review |

---

## 5. Element & Component Color Role Mapping (The Verification Blueprint)

Here is the exact assignment of colors to each UI element across the platform for the user's review and approval:

### 5.1 Global Layout Components

| UI Element                | Proposed Color Token     | Hex / Class                                        | Visual Behavior                                                        |
| :------------------------ | :----------------------- | :------------------------------------------------- | :--------------------------------------------------------------------- |
| **Top Announcement Bar**  | Navy Deep                | `bg-navy-900 text-white`                           | Continuous marquee, high-contrast white text with orange accent links. |
| **Header Navbar**         | White Glassmorphism      | `bg-white/95 border-b border-slate-200`            | Backdrop blur with crisp border, sticky at top.                        |
| **Header Logo Mark**      | Navy & Orange on White   | Squircle container                                 | Navy "J" + Orange "K" on rounded white container.                      |
| **Navigation Links**      | Slate Body to Navy       | `text-slate-700 hover:text-navy-600`               | Clean transition on hover.                                             |
| **Search Bar Input**      | Slate Light to Navy Ring | `bg-slate-50 border-slate-200 focus:ring-navy-600` | Pill-shaped, subtle shadow.                                            |
| **Cart Badge Count**      | Brand Orange             | `bg-orange-500 text-white`                         | Vibrant pill badge displaying total cart items.                        |
| **Footer Container**      | Midnight Navy            | `bg-navy-900 text-slate-300`                       | Deep luxury contrast anchoring the bottom of all public pages.         |
| **Footer Bottom Sub-Bar** | Deepest Navy             | `bg-[#030D1A] border-t border-navy-800`            | Copyright, legal links, payment network logos.                         |

### 5.2 Commerce & Storefront Components

| UI Element                                    | Proposed Color Token    | Hex / Class                                             | Visual Behavior                               |
| :-------------------------------------------- | :---------------------- | :------------------------------------------------------ | :-------------------------------------------- |
| **Primary Action Button ("Buy Now")**         | Brand Orange            | `bg-orange-500 hover:bg-orange-600 text-white`          | High-conversion primary purchase CTA.         |
| **Secondary Action Button ("Add to Cart")**   | Jiivaa Navy             | `bg-navy-600 hover:bg-navy-700 text-white`              | Strong authoritative brand button.            |
| **Outline Button ("View Details", "Filter")** | Navy Outline            | `border border-navy-600 text-navy-600 hover:bg-navy-50` | Balanced secondary weight.                    |
| **Product Card Container**                    | White with Slate Border | `bg-white border border-slate-200/80 hover:shadow-card` | Clean card with smooth hover elevation.       |
| **Discount Badge ("30% OFF")**                | Brand Orange Soft       | `bg-orange-50 text-orange-700 border border-orange-200` | High-visibility savings indicator.            |
| **Star Rating Stars**                         | Warm Amber              | `text-amber-400 fill-amber-400`                         | Universal gold/amber star rating standard.    |
| **Wishlist Heart Active**                     | Coral Red               | `text-red-500 fill-red-500`                             | Emotional favoriting feedback.                |
| **Verified Boutique Badge**                   | Sky Blue Soft           | `bg-sky-50 text-sky-700 border border-sky-200`          | Trust seal on boutique cards and storefronts. |

### 5.3 Form & Interactive Controls

| UI Element                  | Proposed Color Token       | Hex / Class                                                                          | Visual Behavior                                             |
| :-------------------------- | :------------------------- | :----------------------------------------------------------------------------------- | :---------------------------------------------------------- |
| **Text Inputs & Selects**   | Crisp White / Slate Border | `bg-white border-slate-200 text-slate-900 focus:border-navy-600 focus:ring-navy-600` | Uniform input styling across storefront, seller, and admin. |
| **Checkbox & Radio Active** | Jiivaa Navy                | `text-navy-600 focus:ring-navy-600`                                                  | Consistent branded selection controls.                      |
| **Toggle Switch (Active)**  | Brand Orange               | `bg-orange-500`                                                                      | Active toggle indicator for settings.                       |
| **Tab Bar Active Tab**      | Navy with Underline        | `text-navy-600 border-b-2 border-navy-600 font-semibold`                             | Clean indicator for active view/section.                    |

### 5.4 Seller & Admin Portal Dashboards

| UI Element                      | Proposed Color Token         | Hex / Class                                                          | Visual Behavior                                       |
| :------------------------------ | :--------------------------- | :------------------------------------------------------------------- | :---------------------------------------------------- |
| **Admin Sidebar**               | Midnight Navy                | `bg-navy-900 text-slate-300`                                         | Professional enterprise grade dark sidebar.           |
| **Admin Sidebar Active Item**   | Orange Accent Pill           | `bg-orange-500 text-white font-medium`                               | Instantly highlights active administrative module.    |
| **Seller Sidebar**              | White Surface / Slate Border | `bg-white border-r border-slate-200`                                 | Clean retail merchant workspace.                      |
| **Seller Sidebar Active Item**  | Navy Soft Pill               | `bg-navy-50 text-navy-700 font-medium`                               | Subtle, comfortable daily workspace indicator.        |
| **KPI Stat Cards**              | White with Subtle Top Accent | `bg-white border border-slate-200 shadow-xs`                         | Revenue in Navy, Orders in Orange, Growth in Emerald. |
| **Data Tables Header**          | Slate Header                 | `bg-slate-50 text-slate-700 font-semibold border-b border-slate-200` | Clean, scannable tabular data presentation.           |
| **Data Table Alternating Rows** | Pure White & Off-White       | `hover:bg-slate-50/60 transition-colors`                             | Subtle row hover feedback.                            |

---

## 6. Implementation Plan & Zero-Discrepancy Guarantee

Once the user approves the color role mapping above, the execution will proceed in strict phases:

1. **Phase 1: Token Centralization in Code**
   - Update `tailwind.config.ts` to fully incorporate the complete `navy`, `orange`, `slate`, and `brand` scales.
   - Update `src/app/globals.css` CSS variables (`--primary`, `--secondary`, `--accent`, `--border`, `--ring`).
   - Sync `src/shared/constants/colors.ts` and `src/shared/config/brand-assets.ts`.

2. **Phase 2: Purge Legacy Hardcoded Hex Colors**
   - Replace all 133 occurrences of `#F15A25` with `orange-500` (`#F28C28`) or `orange-600`.
   - Replace all 59 occurrences of `#183A73` with `navy-600` (`#0A2342`) or `navy-700`.
   - Normalize scattered `amber-*` button styles to standard `orange-*` tokens.

3. **Phase 3: Portal-by-Portal Verification**
   - Verify Storefront (18 pages).
   - Verify Marketing & Legal (9 pages).
   - Verify Account & Auth (7 pages).
   - Verify Seller Portal (14 pages).
   - Verify Admin Portal (22 pages).

4. **Phase 4: Automated Test Validation**
   - Run complete unit and integration test suite (`npm test`) to guarantee all 661 tests continue passing.

---

_Created as the permanent Single Source of Truth for JiivaaKart on 2026-10-18._
