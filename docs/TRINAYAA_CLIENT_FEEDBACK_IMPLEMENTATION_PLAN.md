# TRINAYAA E-COMMERCE — CLIENT FEEDBACK IMPLEMENTATION PLAN (PHASE 0)

> **Document Version:** 1.0.0  
> **Date:** November 6, 2026  
> **Source Specification:** `Trinayaa Demo update.pdf` (11 Pages Client Feedback)  
> **Target Platform:** React 19 + TypeScript + Vite | Node.js + Express + tRPC | SQLite (WAL mode) + Drizzle ORM  
> **Core Status:** 162 Products Active, Preserved & Operational  

---

## 1. Executive Summary & Audit Overview

Following the successful first client demonstration of the TRINAYAA e-commerce platform, the client provided comprehensive feedback and refined requirements across 11 specification pages in `Trinayaa Demo update.pdf`.

This document represents the complete **Phase 0 Inspection and Implementation Plan**. It outlines the exact delta between the current production codebase and the client's requests, ensuring zero disruption to existing active features, 100% preservation of all 162 botanical products, strict data protection, and backward compatibility.

### Key Architectural Guidelines
1. **Preserve Storefront Theme**: Retain the approved warm ivory (`#FAF7EB`), forest green (`#123D28`), terracotta accents, and elegant botanical typography.
2. **Preserve All 162 Products**: All SKUs (`TRN-1001` through `TRN-1162`), prices, pack size variants (100g, 250g, 500g), descriptions, and clean botanical photography must remain intact.
3. **Real Data Integrity**: No mock data or fabricated customer transactions. All features connect directly to SQLite through Drizzle ORM and tRPC.
4. **Step-by-Step Delivery**: Do not implement all phases simultaneously. Proceed strictly phase-by-phase upon user approval.

---

## 2. Existing Codebase Inspection & Architecture Map

| Subsystem | Existing File(s) | Current State | Enhancement Strategy |
|---|---|---|---|
| **Branding & Logo** | `client/src/components/BrandMark.tsx` | Standard emblem + stretched `TRINAYAA` text | Calibrate full length font tracking & vertical centering |
| **Product Showcase UI** | `client/src/pages/Home.tsx`<br>`client/src/pages/Catalog.tsx` | Uses legacy pouch PNGs in some hero/featured spots | Point featured cards to approved 1024x1024 botanical templates |
| **B2B Bulk Enquiries** | *New Feature* | Currently only retail cart exists | Add "Shop for Business" enquiry workflow & admin view |
| **Customer Auth** | `server/routers.ts`<br>`server/db.ts` | Email + password login only | Add mobile OTP login option; remove admin link from modals |
| **Customer Addresses** | `server/db.ts` (`addressesRepo`) | Table exists; missing client-side UI | Implement Address Book in customer account & checkout selector |
| **Customer Support Bot** | `client/src/components/CustomerAssistantBot.tsx` | Uses TRINAYAA brand emblem | Replace button with generic customer support chat icon |
| **Customer Feedback** | *New Feature* | No dedicated feedback table | Add `customer_feedback` table, UI forms & admin review tab |
| **Customer Issues / Helpdesk** | *New Feature* | No central ticketing | Add `support_tickets` table with multi-channel logging |
| **Admin Customers** | `client/src/pages/admin/AdminDashboard.tsx` | Static customer table | Add real-time search, filters, pagination, and Customer 360 modal |
| **Product COD Settings** | `server/db.ts`<br>`drizzle/schema.ts` | Global COD only | Add product-level `isCodAvailable` flag + ₹150 min threshold |
| **Inventory & Telegram** | `server/telegram.ts`<br>`server/db.ts` | Alerts sent; stock numbers visible | Hide exact count when stock <= 10; add shipping slip generator |
| **Reward Points** | *New Feature* | No loyalty points ledger | Add `reward_points_ledger`, admin settings, and account display |
| **Content Management** | `server/db.ts` (`siteContentRepo`) | Banners & contact info only | Add Privacy, Terms, Shipping, Returns policy editors |
| **Social Links** | `client/src/pages/Home.tsx` | Instagram, Facebook, YouTube | Remove YouTube; add WhatsApp click-to-chat integration |
| **Footer Variations** | `client/src/pages/Home.tsx` | Single dark green footer | Create 5 previewable samples + Erode headquarters map |
| **Admin Sidebar Styling** | `client/src/pages/admin/AdminDashboard.tsx` | Dark green with muted gold | Refine header/footer with white cards & high-contrast text |

---

## 3. Detailed Phase-by-Phase Plan

---

### PHASE 1 — Branding and Storefront Refinements

#### Client Request (PDF Pages 1 & 2):
1. **TRINAYAA Logo Length & Centering**: Full length of `TRINAYAA` needs to fit and center cleanly with the subtext (`PURE SEEDS · RAW POWDERS · TRUE HERBS`).
2. **Product Bottle/Packaging UI**: Update hero/featured packaging previews to match the approved TRINAYAA template design.
3. **Feature Banner Font Size**: Increase font size slightly on trust badges ("Quality Sourcing", "Secure Checkout", "Careful Packing", "Pan India Delivery").
4. **B2B / B2C Separation**:
   - **Shop for Home**: Existing retail catalog, pricing, variants, and cart remain 100% unchanged.
   - **Shop for Business**: Add bulk enquiry page/modal with product selector, requested quantity (kg/units), Business Name, Contact Person, Phone, Email, Location/City, and optional GSTIN (validated if provided, but not compulsory to avoid blocking genuine buyers).

#### Existing Implementation:
- `BrandMark.tsx` renders emblem + `TRINAYAA` using flex distribution.
- `Home.tsx` features `initialProducts` with older `pouch_001.png` paths.
- Product grid has category filter buttons but no B2B/B2C mode switch.

#### Required Changes:
- **Database**:
  - Create table `business_enquiries`:
    - `id VARCHAR(64) PRIMARY KEY`
    - `businessName VARCHAR(255) NOT NULL`
    - `contactPerson VARCHAR(255) NOT NULL`
    - `phone VARCHAR(32) NOT NULL`
    - `email VARCHAR(320) NOT NULL`
    - `gstNumber VARCHAR(32)`
    - `city VARCHAR(128) NOT NULL`
    - `state VARCHAR(128) NOT NULL`
    - `productsRequested TEXT NOT NULL` (JSON array of `{ sku, name, quantity, unit }`)
    - `additionalNotes TEXT`
    - `status VARCHAR(32) DEFAULT 'NEW'` ('NEW' | 'CONTACTED' | 'QUOTED' | 'CLOSED')
    - `createdAt TEXT NOT NULL`
    - `updatedAt TEXT NOT NULL`
- **API (`server/routers.ts`)**:
  - `enquiries.submit`: Public procedure to submit quotation request with Zod validation.
  - `admin.enquiries.list`: Admin procedure to view, search, and update enquiry status.
- **Frontend**:
  - `BrandMark.tsx`: Calibrate letter spacing (`letter-spacing: 0.18em`), optical alignment, and responsive sizing across mobile/desktop headers.
  - `Home.tsx`:
    - Replace hardcoded pouch images with verified botanical generated photography from `/images/products/generated/{sku}.webp`.
    - Increase trust banner typography from `text-xs` to `text-sm font-medium`.
    - Add top-level switch in product section: `[ 🌿 Shop for Home ] [ 🏢 Shop for Business (Bulk) ]`.
    - "Shop for Business" renders an elegant bulk quotation form with product multi-select, quantity inputs, buyer verification fields, and instant success feedback.
- **Security Considerations**:
  - Rate-limit bulk enquiry submissions (max 5 per IP per hour) to prevent spam.
  - Sanitize all text fields before database insertion.
  - Do not expose business buyer contact details publicly.

---

### PHASE 2 — Customer Account, Address Management & OTP Authentication

#### Client Request (PDF Pages 2, 3, 4 & 5):
1. **Customer Account Overview**: Display customer name, phone, email, saved delivery addresses, previous orders with status, submitted feedback, and reward points.
2. **Address Management**: Allow customers to save multiple addresses, add/edit/delete, set default, and choose saved address during checkout.
3. **Authentication Enhancements**:
   - Keep password login.
   - Introduce OTP-based mobile login/registration.
   - Secure OTP handling (salted hash, 5-min TTL, rate limits, no logging/exposure).
   - If SMS provider unconfigured, clearly log configuration requirement without fake delivery claims.
4. **Remove Admin Link**: Remove "Store Administrator? Access Admin Portal" from customer login/register dialogs.

#### Existing Implementation:
- `users` table has basic customer info.
- `customer_addresses` table exists in `server/db.ts` with repository methods (`create`, `update`, `delete`, `setDefault`, `listByUserId`).
- `Home.tsx` has login modal with admin link, and account modal with static placeholders.

#### Required Changes:
- **Database**:
  - Create table `auth_otps`:
    - `id VARCHAR(64) PRIMARY KEY`
    - `phone VARCHAR(32) NOT NULL`
    - `otpHash VARCHAR(255) NOT NULL`
    - `purpose VARCHAR(32) NOT NULL` ('LOGIN' | 'REGISTER')
    - `attempts INTEGER DEFAULT 0`
    - `expiresAt INTEGER NOT NULL`
    - `createdAt TEXT NOT NULL`
- **API (`server/routers.ts`)**:
  - `auth.requestOtp`: Generates 6-digit cryptographically secure OTP, hashes with SHA-256 + salt, sends SMS via configured provider (or logs to secure provider stub if unconfigured), sets 5-minute expiry.
  - `auth.verifyOtp`: Validates OTP hash, verifies attempt threshold (< 5), creates/finds customer user, issues signed session token.
  - `addresses.list`, `addresses.create`, `addresses.update`, `addresses.delete`, `addresses.setDefault`: Verified and secured to ensure `ctx.user.id === address.userId`.
- **Frontend**:
  - Customer modal: Add tabs for `[ 📦 Orders ] [ 📍 Saved Addresses ] [ 💬 My Feedback ] [ 🎁 Rewards ]`.
  - Address Book UI: List saved addresses with "Default" badge, "Edit", "Delete", and "+ Add New Address" dialog.
  - Checkout Drawer: Add address selector dropdown showing saved addresses + "Add New Address" inline option.
  - Login / Register Dialog: Add tab for `[ Password Login ] [ Mobile OTP Login ]`. Remove the "Store Administrator?" footer link.
- **Security Considerations**:
  - Max 3 OTP requests per phone per 10 minutes.
  - Max 5 verification attempts per OTP before invalidation.
  - Strict ownership check: Customers can NEVER query or mutate addresses belonging to another `userId`.

---

### PHASE 3 — Feedback System, Customer Support & Issue Management

#### Client Request (PDF Pages 2, 5 & 7):
1. **Customer Feedback**:
   - Allow feedback on Homepage and inside Customer Account.
   - Store Customer ID, category, 1-5 rating, text, date, status, admin reply, points awarded.
   - Customer account shows feedback history.
   - Admin tab to review feedback and send reply.
2. **Customer Support Bot Icon**: Replace floating TRINAYAA emblem button with a generic support icon.
3. **Centralized Support / Issue Management**:
   - Capture inquiries, complaints, order issues from website.
   - Support admin manual entry for issues received via WhatsApp or Email.
   - Centralized helpdesk table in Admin panel.

#### Existing Implementation:
- `CustomerAssistantBot.tsx` provides AI Q&A but uses the brand emblem and doesn't store formal tickets.
- No database tables for customer reviews or support tickets.

#### Required Changes:
- **Database**:
  - Create table `customer_feedback`:
    - `id VARCHAR(64) PRIMARY KEY`
    - `userId VARCHAR(64)`
    - `customerName VARCHAR(255) NOT NULL`
    - `customerEmail VARCHAR(320) NOT NULL`
    - `customerPhone VARCHAR(32)`
    - `category VARCHAR(64) NOT NULL` ('Product Quality' | 'Packaging' | 'Delivery' | 'Customer Service' | 'General')
    - `rating INTEGER NOT NULL` (1 to 5)
    - `comment TEXT NOT NULL`
    - `status VARCHAR(32) DEFAULT 'PENDING'` ('PENDING' | 'APPROVED' | 'REJECTED' | 'REWARDED')
    - `adminReply TEXT`
    - `pointsAwarded INTEGER DEFAULT 0`
    - `createdAt TEXT NOT NULL`
    - `updatedAt TEXT NOT NULL`
  - Create table `support_tickets`:
    - `id VARCHAR(64) PRIMARY KEY`
    - `ticketNumber VARCHAR(32) NOT NULL UNIQUE` (e.g. `TIC-1001`)
    - `source VARCHAR(32) NOT NULL` ('WEBSITE' | 'WHATSAPP' | 'EMAIL' | 'PHONE')
    - `customerName VARCHAR(255) NOT NULL`
    - `customerContact VARCHAR(255) NOT NULL`
    - `category VARCHAR(64) NOT NULL` ('Product Enquiry' | 'Order Issue' | 'Payment Issue' | 'Complaint' | 'Feedback')
    - `orderNumber VARCHAR(64)`
    - `subject VARCHAR(255) NOT NULL`
    - `description TEXT NOT NULL`
    - `priority VARCHAR(32) DEFAULT 'MEDIUM'` ('LOW' | 'MEDIUM' | 'HIGH' | 'URGENT')
    - `status VARCHAR(32) DEFAULT 'OPEN'` ('OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED')
    - `resolutionNotes TEXT`
    - `createdAt TEXT NOT NULL`
    - `updatedAt TEXT NOT NULL`
- **API (`server/routers.ts`)**:
  - `feedback.submit`: Public/Customer procedure to submit rating & review.
  - `feedback.myFeedback`: Protected procedure for customer account history.
  - `admin.feedback.list`, `admin.feedback.reply`, `admin.feedback.updateStatus`.
  - `support.createTicket`: Public procedure to submit helpdesk request.
  - `admin.support.list`, `admin.support.createManual`, `admin.support.updateStatus`.
- **Frontend**:
  - `CustomerAssistantBot.tsx`: Replace `/images/brand/emblem_crisp.png` with Lucide `Headphones` / `MessageSquareText` icon with pulsing notification badge.
  - Homepage: Add "Share Your Experience" feedback trigger section / button.
  - Customer Account: Add "My Feedback" tab with past submissions and responses.
  - Admin Dashboard: Add two dedicated tabs:
    - **Customer Feedback Tab**: Review ratings, approve/reply, trigger loyalty reward points.
    - **Customer Support Tickets Tab**: Centralized helpdesk with status badges, filters, and "Log Manual Ticket" action.

---

### PHASE 4 — Admin Customer Management (Customer 360)

#### Client Request (PDF Pages 6 & 8):
1. **Customer Search & Filters**: Search customer records by Name, Email, or Phone Number; filter by status; add pagination.
2. **Customer Detail View (Customer 360)**: Clicking any customer row opens a dedicated profile drawer/modal showing full purchase history, saved addresses, submitted feedback, and account activity.

#### Existing Implementation:
- `AdminDashboard.tsx` has a basic customers table showing Name, Email, Phone, Total Orders, Total Spent, Registered Date.
- Rows are non-clickable and there is no search bar or detail view.

#### Required Changes:
- **API (`server/routers.ts`)**:
  - Enhance `admin.customers.list` to support `search`, `status`, `limit`, and `offset`.
  - Add `admin.customers.getDetails`: Fetches customer profile, all associated orders (`ordersRepo.listByCustomerId`), delivery addresses (`addressesRepo.listByUserId`), feedback history, and reward balance.
- **Frontend (`AdminDashboard.tsx`)**:
  - Add search input for Name/Email/Phone and status filter.
  - Add pagination controls (`Previous`, `Page X of Y`, `Next`).
  - Make customer table rows clickable with hover effect and "View Profile →" action.
  - Implement **Customer 360 Drawer**:
    - Header: Avatar, Name, Email, Phone, Status badge, Registration Date.
    - Stats: Lifetime Orders, Total Spent (₹), Average Order Value, Reward Points.
    - Tabbed Details:
      - `[ Orders History ]`: List of all past orders with status, date, items, total, and direct link to Order Details.
      - `[ Saved Addresses ]`: Delivery locations on file.
      - `[ Feedback & Inquiries ]`: Reviews and support tickets submitted by this customer.
- **Security Considerations**:
  - Strictly accessible only to authenticated administrators (`adminProcedure`).
  - Passwords and sensitive auth tokens never exposed in customer details API.

---

### PHASE 5 — Product-Level COD Management & Minimum Threshold Rule

#### Client Request (PDF Page 6):
1. **Product-Level COD Setting**: Each product must have a toggle to enable or disable Cash on Delivery.
2. **Admin Product Table Display**: Add a COD column in the product table showing COD availability.
3. **Server-Side Validation**: Validate both product-level COD eligibility and order-level minimum value during checkout.
4. **Configurable Minimum COD Value**: Configurable in Store Settings (initial threshold: ₹150).

#### Existing Implementation:
- `products` table does not contain a COD column.
- Orders router allows COD based solely on hardcoded or global setting.

#### Required Changes:
- **Database**:
  - Add column `isCodAvailable INTEGER NOT NULL DEFAULT 1` to `products` table.
  - Store content/settings: Add key `store_min_cod_threshold` (default `"150"`).
- **API (`server/routers.ts`)**:
  - `admin.products.update`: Allow updating `isCodAvailable`.
  - `orders.calculateSummary`: Return `isCodEligible: boolean` and `codIneligibilityReason?: string`.
    - Rule 1: Cart subtotal must be >= `store_min_cod_threshold` (₹150).
    - Rule 2: ALL items in cart must have `isCodAvailable === 1`.
  - `orders.create`: Enforce strict server-side check. If `paymentMethod === 'COD'` and order is ineligible, reject with error code `INELIGIBLE_FOR_COD`.
- **Frontend**:
  - `AdminDashboard.tsx` (Products Tab): Add "COD" column with green checkmark / red dash badge.
  - Admin Product Edit Dialog: Add switch: `Enable Cash on Delivery (COD) for this product`.
  - Product Card & ProductDetail: Show subtle "COD Available" badge if eligible.
  - Checkout Drawer:
    - If eligible: COD radio button is selectable.
    - If subtotal < ₹150: COD option is disabled with notice: `"COD available on orders above ₹150"`.
    - If any product has COD disabled: COD option is disabled with notice: `"COD unavailable: [Product Name] requires prepaid payment"`.
    - Razorpay prepaid checkout remains available at all times.

---

### PHASE 6 — Low-Stock Alerts, Concealment & Printable Shipping Slips

#### Client Request (PDF Pages 7 & 8):
1. **Low-Stock Behavior**:
   - Low-stock threshold configured to 10 units.
   - When stock <= 10: Hide exact stock count from website (do not show "Out of Stock" if stock remains; show "Limited Stock Available").
   - Send Telegram notification to admin bot when stock dips below threshold.
2. **Printable Shipping Address / Delivery Slip**:
   - In Admin Order Details: Add print option to print a packing/delivery slip to paste on shipment parcels.
   - In Telegram Admin Bot: Add command/button to retrieve printable shipping summary for authorized admins.

#### Existing Implementation:
- `ProductDetail.tsx` displays stock count.
- `server/telegram.ts` has alert helpers, but no deduplicated low-stock trigger policy.
- Admin order details modal displays address in text without print layout.

#### Required Changes:
- **Database**:
  - Add table `inventory_alert_state`:
    - `sku VARCHAR(64) PRIMARY KEY`
    - `lastAlertStock INTEGER NOT NULL`
    - `lastAlertSentAt TEXT NOT NULL`
- **Telegram Bot (`server/telegram.ts`)**:
  - Implement `sendLowStockAlert(product: Product, currentStock: number, threshold: number)`:
    - Sends message to all authorized admins:
      ```
      ⚠️ LOW STOCK ALERT
      • Product: Licorice Root (அதிமதுரம்)
      • SKU: TRN-1001
      • Remaining Stock: 7 units
      • Threshold: 10 units
      • Time: Nov 6, 2026, 3:30 PM
      ```
    - Track state in `inventory_alert_state` so repeated purchases at <= 10 don't spam notifications. Alert is re-armed only when stock is replenished > 10.
  - Implement Telegram `/shipping_label <order_number>` command and inline button on order alert. Returns clean, copyable delivery address format.
- **Frontend**:
  - `ProductDetail.tsx` & `Catalog.tsx`:
    - If stock > 10: Show `"In Stock"`.
    - If 1 <= stock <= 10: Show `"Limited Stock Available"` (hide exact number).
    - If stock === 0: Show `"Temporarily Out of Stock"`.
  - `AdminDashboard.tsx` (Order Details Modal):
    - Add `"Print Packing Slip"` button.
    - Opens a clean, print-formatted delivery slip (4"x6" standard parcel label layout) containing:
      - TRINAYAA sender branding & return address.
      - Order Number & Date.
      - Customer Name, Contact Phone & Full Delivery Address with PIN code.
      - Itemized package contents (Product Name, Pack Size, Quantity).
      - Payment Mode: `PREPAID (PAID)` or `CASH ON DELIVERY (Collect ₹XXX)`.

---

### PHASE 7 — Customer Reward & Loyalty Points System

#### Client Request (PDF Pages 8 & 9):
1. **Loyalty System Configuration in Store Settings**:
   - Configure points awarded for approved customer feedback/reviews (e.g. 50 points).
   - Configure points required to redeem a free product (e.g. 500 points).
   - Configure eligible free products or reward threshold.
2. **Points Ledger & Customer Display**:
   - Prevent duplicate reward claims for the same feedback.
   - Every points change recorded in an auditable ledger.
   - Display reward balance and redemption options in Customer Account.

#### Existing Implementation:
- No loyalty points tables or logic exist currently.

#### Required Changes:
- **Database**:
  - Create table `reward_points_ledger`:
    - `id VARCHAR(64) PRIMARY KEY`
    - `userId VARCHAR(64) NOT NULL`
    - `points INTEGER NOT NULL` (positive for earned, negative for redeemed)
    - `balanceAfter INTEGER NOT NULL`
    - `source VARCHAR(32) NOT NULL` ('FEEDBACK_REWARD' | 'PURCHASE_EARN' | 'REDEMPTION' | 'ADMIN_ADJUSTMENT')
    - `referenceId VARCHAR(64)` (e.g. `feedbackId` or `orderId`)
    - `description TEXT NOT NULL`
    - `createdAt TEXT NOT NULL`
- **API (`server/routers.ts`)**:
  - `admin.settings.getLoyaltyConfig` & `setLoyaltyConfig`: Manages points per review, redemption threshold, free product SKU.
  - `admin.feedback.awardPoints`: Awards configured points to customer for approved feedback; records transaction in ledger; prevents double-crediting.
  - `rewards.getBalance`: Returns current customer point balance and transaction history.
- **Frontend**:
  - `AdminDashboard.tsx` (Settings Tab): Add "Loyalty & Rewards Program" section:
    - Points awarded per approved review.
    - Points needed for free product reward.
    - Free product eligible SKU selector.
  - Customer Account Modal: Add "Reward Points" card with current balance, progress bar toward free botanical product, and transaction log.

---

### PHASE 8 — Content Management & Social Links (WhatsApp Integration)

#### Client Request (PDF Page 9):
1. **Editable Policy Pages**: Administrators can edit Privacy Policy, Terms & Conditions, Return Policy, Shipping Policy, About Us, and Store Contact in Admin panel.
2. **Social Links**: Remove YouTube icon/link completely; add WhatsApp business contact link with click-to-chat integration.

#### Existing Implementation:
- `siteContentRepo` handles announcement banners and basic contact numbers.
- `PolicyPage.tsx` displays hardcoded template text.
- Footer displays YouTube, Facebook, Instagram icons.

#### Required Changes:
- **API (`server/routers.ts`)**:
  - Expand `siteContent` keys:
    - `policy_privacy_policy`
    - `policy_terms_and_conditions`
    - `policy_shipping_policy`
    - `policy_return_policy`
    - `about_brand_story`
    - `social_whatsapp_number` (e.g. `919876543210`)
    - `social_instagram_url`
    - `social_facebook_url`
- **Frontend**:
  - `AdminDashboard.tsx` (Store Content Tab):
    - Add rich text / markdown editors for all 4 legal policies and About Us story.
    - Social Media Management: Inputs for WhatsApp Number, Instagram URL, Facebook URL. YouTube input completely removed.
  - `client/src/pages/PolicyPage.tsx`: Fetch dynamic content from `trpc.content.getAll` with existing formatted legal text as fallback.
  - Storefront Footers & Contact Pages:
    - Remove YouTube icon and link.
    - Add WhatsApp icon (`MessageSquare` / WhatsApp SVG) linking to `https://wa.me/{whatsappNumber}?text=Hello%20TRINAYAA%2C%20I%20have%20an%20enquiry`.

---

### PHASE 9 — Footer Variations & Erode Headquarters Map

#### Client Request (PDF Pages 1, 2 & 9):
1. **5 Visual Footer Samples for Client Approval**:
   - Sample 1: Split Half — One side Green (`#123D28`), One side White (`#FFFFFF`).
   - Sample 2: Split Half — One side White (`#FFFFFF`), One side Green (`#123D28`).
   - Sample 3: Packaging Theme — TRINAYAA packaging ivory/gold (`#FAF7EB` / `#8C6D3F`) on one side, forest green on other side.
   - Sample 4: Dual Split Contrast — White and Green with botanical motif borders.
   - Sample 5: Contact & Location Oriented — Featuring Erode Headquarters badge, working hours, and map.
   - **Crucial Rule**: Keep existing production footer active; provide a client preview route (`/footer-samples` or admin preview) to let the client inspect all 5 samples before committing.
2. **Erode Map Embed & Headquarters Details**:
   - Display Erode Headquarters in Contact section and Footer.
   - Use configurable map embed / link (latitude/longitude coordinates for Erode, Tamil Nadu: `11.3410° N, 77.7172° E`).

#### Existing Implementation:
- `client/src/pages/Contact.tsx` has text address.
- `Home.tsx` has single dark green footer.

#### Required Changes:
- Create `client/src/pages/FooterSamples.tsx` (route `/footer-samples` accessible for client review):
  - Renders all 5 footer designs side-by-side with toggle buttons, sample notes, and responsive mobile/desktop previews.
- In `Contact.tsx`:
  - Add responsive Google Maps iframe embed showing TRINAYAA Erode Headquarters location with "Get Directions" button.
- In Admin Store Content:
  - Add editable field for `headquarters_map_embed_url` and `headquarters_address`.

---

### PHASE 10 — Admin Visual Refinements

#### Client Request (PDF Pages 10 & 11):
1. **Admin Sidebar Header**: Header card containing the TRINAYAA emblem needs clean white background treatment for crisp visual distinction.
2. **Admin Sidebar Text Contrast**: Improve readability in the green sidebar using clean white text (`#FFFFFF`) with distinct active state styling (`#1F5638`).
3. **Admin Sidebar Footer**: Bottom profile card (Administrator name, email, Sign Out) needs clean white styling consistent with the header.

#### Existing Implementation:
- `AdminDashboard.tsx` sidebar has a dark green background with gold/olive subtext and dark red sign-out button.

#### Required Changes:
- **Frontend (`AdminDashboard.tsx`)**:
  - Sidebar Header: Wrap logo and title in an elegant ivory/white card container (`bg-white/95 text-[#123D28] rounded-xl shadow-sm p-3.5`).
  - Navigation Menu: Use crisp `#FFFFFF` for primary link text with subtle hover (`hover:bg-white/10`) and vibrant active highlight (`bg-[#1F5638] text-white border-l-4 border-[#E8BF83]`).
  - Sidebar Footer: Style the administrator profile block with a polished white card (`bg-white/95 text-[#123D28] rounded-xl p-3 shadow-sm`) and clean sign-out button.
  - Verify these styles are strictly isolated to the admin console and do NOT affect the customer storefront.

---

### PHASE 11 — Testing, Verification & Final Delivery

#### Execution Checklist:
1. **Database Verification**:
   - Verify all 162 botanical products (`TRN-1001` to `TRN-1162`) exist with valid prices, SKUs, and images.
   - Verify migrations execute cleanly on SQLite with WAL mode.
   - Verify customer data isolation (customer addresses cannot be queried by unauthorized users).
2. **COD Validation Testing**:
   - Test cart below ₹150 -> COD disabled.
   - Test cart above ₹150 with COD-enabled products -> COD available.
   - Test cart containing a product with `isCodAvailable = 0` -> COD disabled with explicit item warning.
   - Test prepaid Razorpay checkout works regardless of COD eligibility.
3. **Low-Stock Alert Testing**:
   - Test inventory <= 10 hides exact quantity on frontend.
   - Test Telegram bot notification fires on low-stock transition without duplicate spam.
4. **Automated Test Suite**:
   - Run `npm test` across all suites (must pass 100%).
   - Run `npm run check` (TypeScript verification, 0 errors).
   - Run `npm run build` (Production client & server bundle).
5. **Final Implementation Report**:
   - Compile comprehensive delivery report at `docs/TRINAYAA_CLIENT_FEEDBACK_IMPLEMENTATION_REPORT.md`.

---

## 4. Features Already Existing vs. Features to Enhance

| Feature Area | Already Implemented in Codebase | Required Enhancement | Avoid Duplicate |
|---|---|---|---|
| **Product Image Assets** | All 162 products converted to 1024x1024 WebP with names removed | Use existing WebP images for any new showcases | DO NOT re-crop or re-generate product images |
| **Telegram Bot** | Bot client, security checks, rate limiting, order alerts exist in `telegram.ts` | Add low-stock alert function & `/shipping_label` command | DO NOT rewrite the bot engine |
| **Address Repository** | `customer_addresses` table and `addressesRepo` CRUD methods exist | Add frontend Address Book modal and checkout integration | DO NOT create duplicate address table |
| **Store Content Key-Value** | `site_content` table and `siteContentRepo` exist in `db.ts` | Add keys for policies, WhatsApp, and loyalty settings | DO NOT build a separate CMS table |
| **Order Management** | Order creation, Razorpay verification, status history fully implemented | Add printable shipping slip and server-side COD validation | DO NOT alter existing order payment workflows |

---

## 5. Security & Risk Assessment

1. **Customer Data Privacy**:
   - Customer addresses, phone numbers, and past orders must be strictly scoped to the authenticated customer's session token (`ctx.user.id`).
   - Customer detail views in admin must require verified `ADMIN` or `SUPER_ADMIN` role.
2. **OTP Security**:
   - OTP codes are never logged to console, never sent in API responses, and never stored as plain text.
   - SHA-256 with per-record random salt is stored with a 5-minute expiry.
   - Enforce IP and phone rate limits (max 3 sends per 10 min, max 5 attempts per OTP).
3. **Database Backward Compatibility**:
   - Use `ALTER TABLE ... ADD COLUMN` or non-destructive migrations.
   - Existing tables (`users`, `products`, `orders`, `categories`, `inventory`) must never be dropped or truncated.
4. **Zero Disruptions to Active Storefront**:
   - Footer samples will be housed on `/footer-samples` for client selection before replacing the main footer.

---

## 6. Implementation Readiness & Handoff

- **Phase 0 Status**: COMPLETED.
- **Dependencies Identified**: SQLite schema updates (`isCodAvailable`, `business_enquiries`, `customer_feedback`, `support_tickets`, `reward_points_ledger`, `auth_otps`), tRPC router extensions, and frontend UI enhancements.
- **Next Step**: Await user confirmation to proceed with **PHASE 1 (Branding & Storefront Refinements)**.

