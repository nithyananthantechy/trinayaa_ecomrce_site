# TRINAYAA ENTERPRISES — CLIENT HANDOVER & STORE MANUAL
## Comprehensive Administration, Telegram Bot, Customer Journeys & Technical Operations Guide

**Client:** TRINAYAA ENTERPRISES, Erode, Tamil Nadu  
**Platform:** TRINAYAA Botanical E-Commerce Platform v1.0.0 (Production)  
**Catalogue:** 162 Single-Ingredient Botanicals across 9 Categories  

---

## 1. Store Administration (Admin Dashboard)

### A. Accessing the Admin Console
- **URL**: `https://trinayaa.in/admin` (or `/admin/login`)
- **Credentials**: Provided securely out-of-band by the engineering team upon server provisioning.
- **Security Features**: Protected by role-based authorization (`ADMIN` or `SUPER_ADMIN`). Inactive after session expiry. All actions logged in `admin_audit_logs`.

### B. Product Management
1. **Navigating to Products**: Click **Products** in the admin sidebar (`/admin/products`).
2. **Adding a New Product**:
   - Click **+ Add Product**.
   - Enter **English Name** (e.g. *Licorice Root*) and **Tamil Botanical Name** (e.g. *அதிமதுரம்*).
   - Enter unique SKU (formatted `TRN-XXXX`), select Category, and specify pack size (e.g. *100g*).
   - Set **MRP** and **Selling Price** (MRP must always be $\ge$ Selling Price).
   - Upload high-resolution product imagery (PNG, JPEG, WebP up to 10MB).
   - Specify stock quantity (e.g. 100).
   - Click **Save & Publish**.
3. **Editing Products**: Click the edit pencil icon on any product card or row. Update pricing, descriptions, or imagery.
4. **Archiving Products**: Click **Archive** to soft-delete a product. Archived products immediately disappear from public storefront listings but retain historical sales records.

### C. Category Management
- Navigate to **Categories** (`/admin/categories`).
- View total assigned products per category.
- Categories containing active products have deletion protection enabled to prevent broken references.

### D. Inventory & Stock Controls
- Navigate to **Inventory** (`/admin/inventory`).
- Real-time stock status badges:
  - **In Stock** (Green): Stock > 10 units.
  - **Low Stock** (Amber): Stock $\le$ 10 units.
  - **Out of Stock** (Red): Stock = 0.
- Click **Adjust Stock** to update quantities via **SET**, **ADD (+)**, or **SUBTRACT (-)** with an optional audit reason.

### E. Festive Offers & Promotional Campaigns
- Navigate to **Offers & Coupons** (`/admin/offers`).
- Click **+ New Campaign**.
- Specify Coupon Code (e.g. `FEST10`), Discount Type (Percentage or Flat Amount), Discount Value, Minimum Order Value (e.g. ₹499), Maximum Discount Cap, and Validity Window.
- Expired or below-minimum orders are automatically rejected at checkout.

### F. Order Management & Fulfillments
- Navigate to **Orders** (`/admin/orders`).
- Filter by status: `Pending Payment`, `Confirmed`, `Processing`, `Packed`, `Shipped`, `Out for Delivery`, `Delivered`, `Cancelled`, `Refunded`.
- **Fulfilling an Order**:
  1. Open the order details modal.
  2. Transition status from `Confirmed` to `Packed` $\rightarrow$ `Shipped`.
  3. Enter **Carrier Name** (e.g. *ST Courier, Professional Couriers, India Post Speed Post*) and **AWB Tracking Number**.
  4. Click **Update Status**. The customer immediately receives an automated notification with their tracking details.

### G. Customer Refunds
- In the Order Details modal, click **Issue Refund**.
- The system automatically marks the order as `Refunded`, updates the payment record, restores the ordered quantities back into the live inventory, and logs the action in the audit log.

### H. Banner & Content Management
- Navigate to **Content** (`/admin/content`).
- Customize top announcement banner text (e.g. *Special Festival Discount: Use code FEST10 for 10% OFF*).
- Update store story, support email, phone numbers, and WhatsApp links.

---

## 2. Telegram Admin Bot Integration

The TRINAYAA Telegram Admin Bot provides full mobile store management directly from Telegram without needing to log in via a browser.

### A. Setup & Starting the Bot
1. Open Telegram and search for your bot handle (e.g. `@TrinayaaAdminBot`).
2. Send `/start`.
3. If your Telegram User ID has been added to `TELEGRAM_ALLOWED_ADMIN_IDS`, you will receive the administrative greeting and quick command keyboard.
4. If unauthorized, access is denied immediately.

### B. Core Bot Commands
- `/orders` — View recent customer orders, pending shipments, and fulfillment status.
- `/order <ORDER_NUMBER>` — View full customer details, ordered items, delivery address, and payment status (e.g. `/order TRN-52823`).
- `/status <ORDER_NUMBER> <NEW_STATUS>` — Update order lifecycle (e.g. `/status TRN-52823 Shipped`).
- `/stock <SKU>` — Query current live inventory and selling price (e.g. `/stock TRN-1001`).
- `/setstock <SKU> <QUANTITY>` — Update stock to exact value (e.g. `/setstock TRN-1001 50`).
- `/adjuststock <SKU> <DELTA>` — Adjust inventory by delta (e.g. `/adjuststock TRN-1001 +10` or `/adjuststock TRN-1001 -5`).
- `/stats` — Instant business snapshot: Today's revenue, pending orders, and low-stock count.
- `/offers` — List all active discount codes and promotional campaigns.

### C. Authorizing New Administrators
To add or remove store managers from Telegram access:
1. Obtain the manager's numerical Telegram ID (can be retrieved by sending `/start` to `@userinfobot`).
2. Add the ID to `TELEGRAM_ALLOWED_ADMIN_IDS` in `.env` (separated by commas).
3. Restart the server or update via the Admin Settings console.

---

## 3. Customer Operations & Journey

### A. Registration & Login
- Customers click **Account** in the header.
- Register with **Full Name**, **Email Address**, **Mobile Number** (10-digit Indian format), and secure password.
- Passwords are encrypted with 100,000 PBKDF2 hashing rounds.

### B. Shopping & Cart Persistence
- Customers can browse by category, search by English or Tamil names, filter by availability, and add items to their cart.
- Carts persist across devices and merge seamlessly when a guest logs in.

### C. Checkout & Payment
- Checkout requires login to safeguard delivery addresses.
- Multi-address book supports Indian addresses with 6-digit PIN validation.
- Delivery charges:
  - **FREE delivery** for orders $\ge$ ₹799.
  - Standard ₹60 delivery fee for orders < ₹799.
- Payment is handled securely via Razorpay supporting UPI (Google Pay, PhonePe, Paytm), Debit/Credit Cards, and NetBanking.

### D. Order Tracking
- Customers can track orders at `https://trinayaa.in/track-order`.
- Enter **Order Number** (e.g. `TRN-10023`) and registered phone/email.
- Displays live status timeline, carrier, tracking number, and privacy-masked details.

---

## 4. Technical Operations & Maintenance

### A. Server Commands
- **Start Application**: `npm run start` (or `pm2 start trinayaa` / `docker compose up -d`)
- **Health Check**: `curl http://localhost:3000/health`
- **Rebuild Code**: `npm run build`
- **Execute Tests**: `npm run test`

### B. Database Backup & Restore
- **Manual Backup**:
  ```bash
  node scripts/backup_and_restore.js
  ```
- **Backup Location**: Stored in `data/backups/trinayaa_backup_<TIMESTAMP>.db`.
- **Restoration**: Copy backup over `data/trinayaa.db` while application is stopped.

### C. Troubleshooting Common Scenarios
1. **Payment Webhook Not Confirming Orders**:
   - Check Razorpay Dashboard webhook logs for HTTP 200 responses.
   - Verify `RAZORPAY_WEBHOOK_SECRET` matches between `.env` and Razorpay Dashboard.
2. **Telegram Notifications Not Arriving**:
   - Verify `TELEGRAM_BOT_TOKEN` is valid.
   - Confirm your numeric ID is listed in `TELEGRAM_ALLOWED_ADMIN_IDS`.
3. **Database Busy / Locked**:
   - SQLite is configured with WAL mode and a 10-second busy timeout. Ensure only one application process accesses the database file.
