# TRINAYAA ENTERPRISES — ADMINISTRATOR USER GUIDE

**Welcome to the TRINAYAA Store Management Console**  
This guide is designed for store owners, inventory supervisors, customer support representatives, and dispatch managers managing day-to-day operations at TRINAYAA Enterprises.

---

## 1. Accessing the Admin Console

- **Console URL:** `https://trinayaa.in/admin` (or `http://localhost:3000/admin` in staging)
- **Initial Credentials:** Provided during handover.
- **Security Recommendation:** Change your password immediately upon first login.
- **Automatic Session Timeout:** For security, administrative sessions expire after period of inactivity.

---

## 2. Navigation Overview

The administration dashboard is organized into 5 functional sections in the left sidebar:

1. **Overview**
   - **Store Dashboard:** Real-time metrics including total revenue, active orders, customer count, low-stock alerts, and recent orders.
2. **Store Management**
   - **Products Catalogue:** Search, filter, edit prices, edit MRP, update stock levels, toggle Cash on Delivery (COD), and manage photo galleries.
   - **Botanical Categories:** Manage the 9 core categories, descriptions, and storefront display order.
   - **Inventory & Stock:** Granular inventory adjustment with reason codes (`RESTOCK`, `DAMAGE`, `RETURN`, `COUNT_ADJUSTMENT`).
   - **Customer Orders:** Search orders, inspect order items, update fulfilment states, and generate printable shipping slips.
   - **Offers & Discounts:** Configure festival banners, coupon codes, and promotional percentage discounts.
   - **Bulk CSV Import:** Batch upload or update botanical products via standard spreadsheet templates.
3. **Customer Management**
   - **Customer 360 & Profiles:** Search customers by name, phone, or email. View lifetime order history, active addresses, total spend, and rewards ledger.
   - **B2B Wholesale Enquiries:** Review multi-item bulk procurement enquiries submitted by Ayurvedic clinics, practitioners, and retail distributors.
   - **Support Helpdesk:** Respond to customer support tickets, review AI assistant chat transcripts, and resolve complaints.
   - **Reviews & Feedback:** Moderate customer product reviews and general storefront feedback before public display.
   - **Loyalty & Rewards:** Manage the customer rewards program, review earned points, and adjust customer point balances.
4. **Content & Settings**
   - **Policy CMS:** Edit Terms & Conditions, Privacy Policy, Shipping Policy, and Return/Refund Policy directly from the browser without code edits.
   - **Site Banners & Content:** Update announcement bars, botanical guarantee statements, and seasonal hero banners.
   - **Store Settings:** Configure global store parameters, minimum COD order threshold (default: ₹150), and business contact numbers.
5. **Operations**
   - **Telegram Admin Bot:** View authorized Telegram admins, authorize new staff user IDs, and test bot alerts.
   - **AI Product Studio:** Generate botanical product descriptions and imagery using integrated AI tools.

---

## 3. Product & Inventory Management

### Editing Product Prices & Stock
1. Go to **Store Management > Products Catalogue**.
2. Locate the product using the search bar (supports SKU, English name, or Tamil name).
3. Update the **Selling Price** directly in the table input box; click outside the box to save automatically.
4. Update the **Stock Level** directly; if stock falls to or below 10 units, a **⚠️ Low Stock** badge appears, and an alert is dispatched to Telegram.

### Managing Cash on Delivery (COD) per Product
1. In the Products table, locate the **COD** column.
2. Click the green **COD Active** pill to disable COD for sensitive or high-value items.
3. Disabled products require prepaid payment (UPI/Card) at checkout.

---

## 4. Order Fulfilment & Printable Shipping Slips

### Processing an Order
1. Go to **Store Management > Customer Orders**.
2. Click on any order to open the complete details drawer:
   - View customer name, phone, email, and shipping address.
   - Review ordered items, pack sizes, quantities, and payment status.
3. Update the fulfilment state:
   - `Pending Payment` ➜ `Confirmed` ➜ `Processing` ➜ `Shipped` ➜ `Delivered`.
4. Enter the **Carrier Partner** (e.g., *India Post, DTDC, Professional Couriers*) and **AWB / Tracking Number**.

### Printing A4 Shipping Slips
1. In the order drawer or orders table, click the **Print Slip** button (`Printer` icon).
2. The system renders an official, client-formatted A4 dispatch slip complete with:
   - TRINAYAA header and botanical emblem.
   - Consignee address and contact numbers.
   - Payment method and status.
   - Itemized table with SKUs, Tamil names, pack sizes, and quantities.
   - Financial totals and dispatch signatory block.
3. Press **Print Slip** (`Ctrl+P`) to print on standard A4 paper or thermal packing labels.

---

## 5. Customer 360 & Loyalty Rewards

### Inspecting Customer Profiles
1. Go to **Customer Management > Customer 360**.
2. Search by phone number, customer name, or email.
3. Click a customer to open their complete timeline:
   - Registered address and alternative delivery addresses.
   - Total lifetime spend and total order count.
   - Reward points balance and transaction history.
   - Support tickets submitted by the customer.

### Moderating Reviews & Rewarding Feedback
1. Go to **Customer Management > Reviews & Feedback**.
2. Inspect pending customer reviews.
3. Click **Approve** to publish the review on the public product page.
4. When feedback is submitted, the customer is automatically credited loyalty points (default: 50 points = ₹50 value toward future purchases).

---

## 6. Telegram Admin Bot Operations

Authorized managers receive live store alerts on Telegram without opening a browser:

1. **Order Notifications:** Instant alert whenever a customer places an order.
2. **Low-Stock Alerts:** Alert dispatched when stock drops $\le 10$ units.
3. **Bot Commands:**
   - `/start` or `/help` — Opens the interactive quick-action menu.
   - `/stats` — Live revenue, active orders, and product counts.
   - `/orders` — Summarizes recent pending orders.
   - `/stock` — Lists products requiring restocking.
   - Natural language commands: Type simple words like `orders`, `stock`, `வணக்கம்`.
4. **Authorizing New Staff:**
   - In Admin Panel, go to **Operations > Telegram Bot**.
   - Enter the staff member's numerical Telegram User ID (obtained from `@userinfobot`).
   - Click **Authorize Admin**.
