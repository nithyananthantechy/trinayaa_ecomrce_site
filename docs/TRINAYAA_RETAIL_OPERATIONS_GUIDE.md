# TRINAYAA ENTERPRISES — RETAIL SHOP OPERATIONS GUIDE
## Standard Operating Procedures for Physical Branch Outlets & POS Counter Operations

**Portal URL:** `https://trinayaa.in/retail` (or `/admin/login` -> redirected)  
**Authorized User Role:** Retail Shop Handler (`RETAIL_SHOP_HANDLER`)  
**Assigned Operational Branches:**
- `brn_erode_hq`: Erode Dispatch & Retail Flagship (Erode, Tamil Nadu)
- `brn_cbe_01`: Coimbatore Branch Outlet (Gandhipuram, Coimbatore, Tamil Nadu)

---

## 1. RETAIL SHOP HANDLER ROLE & SECURITY BOUNDARY

The Retail Shop Handler role is purpose-built for counter employees managing walk-in retail sales and offline billing.

### Permitted Actions:
- View live inventory counts for the employee's assigned physical branch.
- Perform barcode / SKU search and product selection.
- Create walk-in sales transactions with instant POS receipts.
- Accept Cash, UPI QR code, and Debit/Credit Card payments.
- Print standard thermal receipts and retail sales invoices (`TRN-POS-YYYY-XXXXX`).

### Strictly Forbidden & Blocked Actions:
- Accessing administrative dashboard metrics or financial balance sheets.
- Modifying online e-commerce website settings, banners, or CMS policies.
- Viewing or editing customer orders originating from the online storefront.
- Viewing or altering inventory levels of other retail branches.

---

## 2. POINT OF SALE (POS) COUNTER BILLING WORKFLOW

### Step 1: Open Retail POS Interface
1. Log in with your assigned Retail Shop Handler credentials.
2. The system confirms your assigned branch (e.g., *Erode Dispatch & Retail Flagship*).
3. The live product catalogue displays current physical branch stock quantities.

### Step 2: Add Items to the Counter Cart
1. **Search:** Enter product name (e.g., "Moringa", "Licorice", "Ashwagandha") or SKU.
2. **Select Pack Size:** Choose 50g, 100g, or 250g based on the physical package handed to the customer.
3. **Quantity:** Adjust count. The system prevents selling more than available branch stock.

### Step 3: Customer Details & Discount (Optional)
- For regular customers or loyalty tracking, enter their mobile number and name.
- Walk-in anonymous sales can be processed using the default `"Walk-in Customer"` profile.
- If authorized by store management, enter promotional manual discounts with a documented reason.

### Step 4: Collect Payment & Finalize Sale
Select the payment method:
- **CASH:** Collect currency and tender change.
- **UPI:** Customer scans the counter UPI QR code on display.
- **CARD:** Process via physical swipe/chip terminal.
Click **Complete Sale**.

### Step 5: Thermal Receipt Printing
- A sequential receipt (`TRN-POS-2026-XXXXX`) is generated immediately.
- Click **Print Receipt** for standard 80mm thermal receipt printing.
- Physical branch stock is decremented atomically in the database.

---

## 3. BRANCH INVENTORY MONITORING & RE-STOCK REQUESTS

- **Daily Stock Audit:** At the start and end of every shift, check the **Branch Inventory** tab.
- **Low Stock Callouts:** Items with 5 or fewer packs in stock are highlighted with red alerts.
- **Inter-Branch Transfers:** When stock runs low, notify the Central Warehouse Admin via internal WhatsApp or Admin Helpdesk to generate a replenishment stock transfer from Erode HQ.
