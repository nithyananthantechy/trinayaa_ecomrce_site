# TRINAYAA Enterprises — Telegram Admin Bot Setup & Operations Guide (Phase 6)

## 1. Overview

The TRINAYAA Telegram Admin Bot provides store owners, store managers, and inventory administrators with a secure, real-time command-and-control interface directly from mobile devices and desktops.

It communicates with TRINAYAA's live database, inventory repository, orders lifecycle, campaigns engine, and multi-channel notifications service.

---

## 2. Bot Creation via @BotFather

To create a new Telegram Bot for TRINAYAA:

1. Open Telegram and search for the official **[@BotFather](https://t.me/BotFather)** bot (verified with a blue tick).
2. Start the chat and send `/newbot`.
3. Provide a friendly display name (e.g. `TRINAYAA Admin Assistant`).
4. Provide a unique username ending in `bot` (e.g. `TrinayaaStoreAdminBot`).
5. BotFather will return a unique authorization token:
   ```
   123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
   ```
6. **(Optional)** Configure bot description, profile image, and commands list in BotFather via `/setcommands`.

---

## 3. Environment Configuration

Add the following environment variables to your `.env` file (see `.env.example`):

```env
# ==========================================
# Telegram Admin Bot (Phase 6)
# ==========================================
TELEGRAM_BOT_TOKEN=123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ
TELEGRAM_WEBHOOK_SECRET=your_super_secret_webhook_token_2026
TELEGRAM_ALLOWED_ADMIN_IDS=987654321,123456789
TELEGRAM_ADMIN_IDS=987654321,123456789
```

### Explanation of Variables:
- `TELEGRAM_BOT_TOKEN`: The bot token issued by @BotFather. If left empty or containing `placeholder`, the system runs in **Simulation Mode** (logs messages to server console without sending external HTTP requests).
- `TELEGRAM_WEBHOOK_SECRET`: A secret string used by Telegram to sign incoming webhook updates via the `X-Telegram-Bot-Api-Secret-Token` header.
- `TELEGRAM_ALLOWED_ADMIN_IDS`: Comma-separated list of authorized numeric Telegram User IDs.

---

## 4. Webhook Setup vs. Simulation Mode

### A. Setting the Production Webhook
To link Telegram's servers to your deployed application:

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://your-domain.com/api/webhooks/telegram",
    "secret_token": "<YOUR_TELEGRAM_WEBHOOK_SECRET>",
    "allowed_updates": ["message", "edited_message", "callback_query"]
  }'
```

### B. Verifying Webhook Health
Inspect the webhook status anytime:
```bash
curl "https://api.telegram.org/bot<YOUR_TELEGRAM_BOT_TOKEN>/getWebhookInfo"
```

### C. Local Development & Simulation Mode
In development environments without a public domain, leaving `TELEGRAM_BOT_TOKEN` unset or set to `placeholder_telegram_bot_token` automatically routes bot output to the application console. Updates can be simulated by sending `POST /api/webhooks/telegram` with mock update payloads.

---

## 5. Admin Authorization & Security

1. **Numeric ID Authentication**: Authorization is enforced using the sender's permanent numeric Telegram user ID (`msg.from.id`), not their changeable username.
   - To find your Telegram ID: message **[@userinfobot](https://t.me/userinfobot)** on Telegram.
2. **Multi-Tier Allowlisting**:
   - **Environment Allowlist**: Configured in `TELEGRAM_ALLOWED_ADMIN_IDS`.
   - **Database Allowlist**: Stored in `telegram_allowed_admins` SQLite table.
3. **Adding Admins via SQL**:
   ```sql
   INSERT INTO telegram_allowed_admins (id, telegramId, name, role, addedBy, createdAt)
   VALUES ('tga_1', '987654321', 'Store Manager', 'SUPER_ADMIN', 'Owner', datetime('now'));
   ```
4. **Rate Limiting**: Users are limited to 20 commands per minute. Excessive commands are throttled.
5. **Customer Privacy Protection**: Customer phone numbers (`98765*****`), email addresses (`k***@example.com`), and exact residential addresses are automatically masked.
6. **Payment Safety**: Unpaid orders cannot be moved to `Confirmed` from Telegram. Only Razorpay gateway callbacks or the Admin Portal can confirm paid orders.
7. **Audit Logging**: Every command, callback, and unauthorized attempt is permanently logged into `telegram_audit_logs`.

---

## 6. Complete Command Reference

| Command | Arguments | Description | Example |
| :--- | :--- | :--- | :--- |
| `/start`, `/help` | — | Display bot overview and command list | `/help` |
| `/dashboard`, `/stats` | — | Store metrics: revenue, order statuses, low-stock alerts | `/dashboard` |
| `/orders`, `/recent` | — | View 5 most recent orders with inline action buttons | `/orders` |
| `/order` | `<OrderNumber>` | Look up order details with masked customer info | `/order TRN-10482` |
| `/updateorder` | `<OrderNumber> [Status]` | Transition order status through lifecycle | `/updateorder TRN-10482 Shipped` |
| `/customers` | — | Customer base overview and recent signups | `/customers` |
| `/products` | — | Browse top catalogue products | `/products` |
| `/product` | `<SKU or Name>` | Inspect product details with quick stock buttons | `/product TRN-1001` |
| `/addproduct` | `[SKU Price Name]` | Guided interactive 7-step wizard or 1-shot command | `/addproduct` |
| `/editproduct` | `<SKU>` | Inspect product and quick edit actions | `/editproduct TRN-1001` |
| `/updateprice`, `/price` | `<SKU> <Price> [MRP]` | Update product selling price and MRP | `/updateprice TRN-1001 175 200` |
| `/uploadimage` | `<SKU> <URL>` | Attach or update product primary image | `/uploadimage TRN-1001 https://...` |
| `/stock` | `<SKU> [Quantity]` | View stock with quick adjust buttons or set stock | `/stock TRN-1001 150` |
| `/stockadd` | `<SKU> <Qty> [Reason]` | Add stock (Restock) with audit logging | `/stockadd TRN-1001 50 Batch #204` |
| `/stocksub` | `<SKU> <Qty> [Reason]` | Deduct stock (Adjustment/Damaged) | `/stocksub TRN-1001 5 Quality discard` |
| `/stockset` | `<SKU> <Qty> [Reason]` | Overwrite stock quantity | `/stockset TRN-1001 120 Recount` |
| `/offers` | — | List all active festival campaigns and coupons | `/offers` |
| `/createoffer` | `[Code Disc MinOrder]` | Guided 4-step wizard or 1-shot coupon creation | `/createoffer` |
| `/disableoffer` | `<CouponCode>` | Deactivate an active coupon | `/disableoffer PONGAL15` |
| `/admins` | — | List authorized Telegram administrators | `/admins` |
| `/audit` | — | View recent audit log records | `/audit` |
| `/cancel` | — | Cancel any active guided conversation session | `/cancel` |

---

## 7. Interactive Workflows & Inline Keyboards

### A. Quick Stock Adjustment Buttons
When `/product <SKU>` or `/stock <SKU>` is called, inline buttons are presented:
- `[+10]` `[+50]` `[-10]` `[-50]`
Tapping any button immediately adjusts inventory via `inventoryRepo.adjustStock`, logs the audit, and replies with updated inventory levels.

### B. Order Status Progression Menu
When viewing an order, tapping `[🔄 Update Status]` displays valid next-stage buttons:
- `Confirmed` ➔ `[⚙️ Processing]` or `[❌ Cancel]`
- `Processing` ➔ `[📦 Packed]` or `[❌ Cancel]`
- `Packed` ➔ `[🚚 Shipped]` or `[❌ Cancel]`
- `Shipped` ➔ `[🛵 Out for Delivery]` or `[🎉 Delivered]` or `[❌ Cancel]`

Invalid transitions and backward movements are rejected. Unpaid orders cannot be manually confirmed via Telegram.

### C. Guided Wizards (Interactive Multi-Step Sessions)
- `/addproduct`: Guides the admin step-by-step through English Name ➔ Tamil Name ➔ SKU Uniqueness ➔ Category ➔ Price ➔ MRP ➔ Stock ➔ Published status.
- `/createoffer`: Guides the admin through Coupon Code ➔ Discount Value ➔ Minimum Cart Value ➔ Validity Duration.
- Send `/cancel` at any point to terminate the active wizard.

---

## 8. Real-Time Admin Alerts & Notifications

The bot automatically subscribes to TRINAYAA's internal `notificationsService`. When an event occurs, all authorized admins receive immediate alerts:

- 🛍️ `ORDER_CREATED`: New order placed (Pending Payment).
- 💰 `PAYMENT_CONFIRMED`: Razorpay verified payment; triggers fulfillment queue.
- ⚠️ `PAYMENT_FAILED`: Payment transaction failed.
- 🚚 `ORDER_SHIPPED`: Package handed over to courier with tracking code.
- 🛵 `OUT_FOR_DELIVERY`: Parcel out for delivery.
- 🎉 `ORDER_DELIVERED`: Customer received package.
- ❌ `ORDER_CANCELLED`: Order cancelled.
- 💸 `ORDER_REFUNDED`: Refund processed.

All alerts automatically mask customer phone numbers and email addresses to adhere to data privacy standards.

---

## 9. Troubleshooting & FAQ

### Issue: "Access Denied" error message
- **Cause**: The sender's numeric Telegram ID is not present in `telegram_allowed_admins` or `TELEGRAM_ALLOWED_ADMIN_IDS`.
- **Solution**: Obtain the sender's Telegram ID via `@userinfobot` and add it to `TELEGRAM_ALLOWED_ADMIN_IDS` in `.env`.

### Issue: Webhook returns HTTP 401 Unauthorized
- **Cause**: The `X-Telegram-Bot-Api-Secret-Token` header sent by Telegram does not match `TELEGRAM_WEBHOOK_SECRET`.
- **Solution**: Re-run the `setWebhook` curl command with the matching secret token configured in `.env`.

### Issue: Bot does not reply to commands
- **Cause 1**: The server is not running or the webhook URL is not publicly accessible.
- **Cause 2**: `TELEGRAM_BOT_TOKEN` is unset or set to placeholder (check console for simulated responses).
- **Cause 3**: Webhook is disabled or set to an old URL. Check `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo`.
