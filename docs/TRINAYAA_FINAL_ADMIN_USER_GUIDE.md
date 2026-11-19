# TRINAYAA ENTERPRISES — ADMINISTRATOR USER MANUAL
## Comprehensive Operational Guide for Store Administrators & Super Administrators

**Portal URL:** `https://trinayaa.in/admin`  
**Default Access Roles:** Super Admin (`SUPER_ADMIN`), Store Admin (`ADMIN`)  
**Application Version:** TRINAYAA v1.0.0-PROD-RC  

---

## 1. ACCESS & ROLES ARCHITECTURE

TRINAYAA features a three-tier role-based access control (RBAC) structure:

| Role Identifier | Console Access | Permissions Scope |
| :--- | :--- | :--- |
| **Super Admin** | Full Admin Console (`/admin`) | Unrestricted: Staff provisioning, global financial metrics, database backups, website policies, all store operations |
| **Store Admin** | Store Admin Console (`/admin`) | Operations: Catalogue management, inventory restock, order dispatch, shipping slips & invoices, support tickets, product reviews, customer 360 |
| **Retail Shop Handler** | Retail Operations Portal (`/retail`) | Offline POS sales, walk-in cash/card billing, assigned branch inventory only (strictly restricted from `/admin`) |

---

## 2. STORE MANAGEMENT MODULES

### 2.1 Catalogue & Inventory Management (`/admin?tab=inventory`)
- **Product Overview:** Manage all 162 botanical products across 9 categories.
- **Variant Pricing & Pack Sizes:** Each product supports 3 standard pack sizes (50g, 100g, 250g). Administrators can adjust selling price, MRP, and active stock per variant.
- **Stock Threshold Alerts:** Products dropping below the low-stock threshold (default: 10 units) appear with orange warning badges.
- **COD Availability:** Administrators can toggle Cash on Delivery availability per product based on botanical shelf life or shipping constraints.

### 2.2 Customer Orders & Dispatch Studio (`/admin?tab=orders`)
- **Order Pipeline:** View and filter orders by lifecycle status:
  - `Placed` -> `Confirmed` -> `Processing` -> `Shipped` -> `Delivered` -> `Cancelled`
- **Fulfilment Document Studio:** For any selected order, administrators can generate and print four statutory fulfilment documents in one click:
  1. **Customer Tax Invoice (`TRN-INV-YYYY-XXXXX`):** Includes GST 5% tax breakdown, HSN codes, and amount in Indian Rupee words.
  2. **Shipping Slip (`TRN-SHIP-YYYY-XXXXX`):** Warehouse packing checklist with carrier and consignment routing.
  3. **Delivery Challan (`TRN-DC-YYYY-XXXXX`):** Rule-compliant goods transport document.
  4. **Parcel / Packing Sticker (`TRN-LBL-YYYY-XXXXX`):** High-contrast 4x6 shipping sticker with prominent recipient PIN code and COD collection callout.
- **Document Idempotency:** Document numbers remain permanent once generated. Reprinting never changes the invoice or slip number.

### 2.3 Festival Offers & Promotional Campaigns (`/admin?tab=offers`)
- **Campaign Configuration:** Create holiday and festival promotions (e.g., Pongal, Diwali, Herbal Wellness Week).
- **Coupon Parameters:**
  - Coupon Code (e.g., `HERBAL10`, `PONGAL2026`)
  - Discount Type (Percentage `%` or Flat ₹)
  - Minimum Order Value (MOV) requirement
  - Maximum discount cap (₹)
  - Validity start and end timestamps
  - Total usage limit per campaign and per customer
- **Checkout Visibility:** Active campaigns automatically render promotional offer cards above the promo code input at checkout for customer discovery.

### 2.4 Product Subscriptions & Recurring Deliveries (`/admin?tab=subscriptions`)
- **Subscription Monitor:** View all active recurring customer subscriptions.
- **Cycle Engine:** Review scheduled delivery dates, skipped cycles, and linked recurring order references.
- **Subscription Management:** Administrators can pause, resume, or cancel subscriptions on behalf of customers who call support.
- **Renewal Processing:** Trigger batch renewal processing (`processRenewals`) to advance cycles and create dispatch orders.

### 2.5 Feedback, Reviews & Product Enquiries (`/admin?tab=feedback`)
Features three distinct tabs for customer communications:
1. **Customer Feedback & Suggestions:** Storefront feedback ratings and general enquiries.
2. **Product Reviews Moderation:** Approve, edit response, or moderate customer ratings on catalogue products.
3. **New Product Enquiries (Demand Capture):** Dedicated table capturing customer requests for unlisted botanicals:
   - Sourcing status updates: `PENDING_REVIEW`, `SOURCING`, `PROCURED`, `UNAVAILABLE`.
   - Contact customer via email/phone once rare herbs are procured.

### 2.6 Customer Returns & RMA Management (`/admin?tab=returns`)
- **Review Requests:** Inspect customer return requests submitted for delivered orders.
- **Approval & Pickup:** Approve or reject return requests with administrative rationale.
- **Warehouse Inspection Disposition:**
  - `RESTOCKED`: Restores the returned items into live salable inventory.
  - `DAMAGED_DISCARD`: Records write-off for broken seals or damaged goods without corrupting inventory counts.
- **Refund Recording:** Log manual Razorpay/UPI/bank transfer refund transaction references.

---

## 3. SECURITY & AUDIT PROCEDURES

- **Audit Logs (`/admin?tab=auditLogs`):** Every administrative action—price changes, order status overrides, document printing, and user role modifications—is permanently recorded with administrator name, timestamp, and IP address.
- **Admin Password Policy:** Passwords must meet a minimum 8-character complexity standard.
- **Session Timeout:** Administrative sessions expire automatically after 8 hours of inactivity.
