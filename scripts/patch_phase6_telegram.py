with open('server/telegram.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add notifyLowStockAlert function
low_stock_notify_fn = """
// ==========================================
// 4D. LOW STOCK NOTIFICATIONS (PHASE 6)
// ==========================================
export async function notifyLowStockAlert(
  prod: { id: string; sku: string; nameEn: string; nameTa?: string; stock: number },
  threshold: number
) {
  try {
    const allowedIds = db.telegramRepo.getAllAllowedIds();
    if (!allowedIds || allowedIds.length === 0) return;

    const text =
      `🌿 *TRINAYAA LOW STOCK ALERT*\\n\\n` +
      `• *Product:* ${prod.nameEn}${prod.nameTa ? ` (${prod.nameTa})` : ""}\\n` +
      `• *SKU:* \`${prod.sku}\`\\n` +
      `• *Available Stock:* *${prod.stock} units* (Threshold: ${threshold})\\n` +
      `• *Status:* ⚠️ *Low Stock*\\n` +
      `• *Action Required:* Review inventory and arrange replenishment.\\n\\n` +
      `🔗 [Open Product in Admin Dashboard](http://localhost:3000/admin?tab=products)`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: "📦 Restock (+50)", callback_data: `restock_quick:${prod.id}:50` },
          { text: "🌿 View Products", callback_data: "cmd_products" },
        ],
      ],
    };

    for (const adminId of allowedIds) {
      await sendTelegramMessage(adminId, text, keyboard);
    }
  } catch (err: any) {
    console.error("[Telegram Low Stock Alert Error]:", err?.message || err);
    try {
      db.auditLogsRepo.log("System", "TELEGRAM_ALERT_FAILED", `Failed to dispatch low-stock alert for ${prod.sku}: ${err?.message || err}`);
    } catch {}
  }
}
"""

# Place notifyLowStockAlert before initTelegramNotifications
assert "export function initTelegramNotifications() {" in content, "Could not find initTelegramNotifications"
content = content.replace("export function initTelegramNotifications() {", low_stock_notify_fn + "\nexport function initTelegramNotifications() {", 1)

# In initTelegramNotifications, register listener with db
old_init = """export function initTelegramNotifications() {
  if (isListenerRegistered) return;
  isListenerRegistered = true;"""

new_init = """export function initTelegramNotifications() {
  if (isListenerRegistered) return;
  isListenerRegistered = true;

  // Register low-stock notifier callback with database inventory layer (Phase 6)
  db.registerLowStockNotifier(async (prod, threshold) => {
    await notifyLowStockAlert(prod, threshold);
  });"""

assert old_init in content, "Could not find old_init"
content = content.replace(old_init, new_init, 1)

# Add restock_quick to handleCallbackQuery
old_cb = """  switch (action) {
    case "view_order": {"""

new_cb = """  switch (action) {
    case "restock_quick": {
      const prodId = params[0];
      const amount = parseInt(params[1] || "50", 10);
      try {
        const res = db.inventoryRepo.adjustStock(
          prodId,
          null,
          amount,
          "RESTOCK",
          "Telegram Quick Restock",
          `Restocked +${amount} units via Telegram Bot by @${userName}`,
          `Telegram:@${userName}`
        );
        await sendTelegramMessage(
          chatId,
          `✅ Restocked *+${amount} units* for product.\\nNew available stock: *${res.newStock} units*.`
        );
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ Failed to restock: ${err?.message || err}`);
      }
      return { ok: true };
    }

    case "view_order": {"""

assert old_cb in content, "Could not find old_cb"
content = content.replace(old_cb, new_cb, 1)

# Add natural language /shipping
old_nl = """    if (command === "order") command = "/order";"""
new_nl = """    if (command === "order") command = "/order";
    else if (command === "shipping" || command === "shippingslip" || command === "slip") command = "/shipping";"""
assert old_nl in content, "Could not find old_nl"
content = content.replace(old_nl, new_nl, 1)

# Add /shipping to switch(command)
old_switch = """      case "/order": {"""

new_shipping_cmd = """      case "/shipping":
      case "/shippingslip": {
        if (!args[0]) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/shipping <OrderNumber>` (e.g. `/shipping TRN-10482`)");
          db.telegramRepo.logAudit(userId, "/shipping", "Missing order number argument");
          break;
        }
        const orderNum = args[0].trim();
        const slip = db.ordersRepo.getShippingSlip(orderNum);
        if (!slip) {
          await sendTelegramMessage(chatId, `❌ Order \`${orderNum}\` was not found. Please verify the order number.`);
          db.telegramRepo.logAudit(userId, "/shipping", `Order not found: ${orderNum}`);
          break;
        }

        const itemsList = slip.items
          .map((it: any) => `• *${it.productNameEn}* (${it.packSize}) × ${it.quantity} — ₹${it.subtotal}`)
          .join("\\n");

        const reply =
          `📦 *TRINAYAA DISPATCH & SHIPPING SLIP*\\n\\n` +
          `• *Order Number:* \`${slip.orderNumber}\`\\n` +
          `• *Date:* ${slip.orderDate}\\n` +
          `• *Status:* ${slip.orderStatus}\\n` +
          `• *Payment:* ${slip.paymentStatus} (${slip.paymentMethod})\\n\\n` +
          `👤 *CUSTOMER & CONTACT:*\\n` +
          `• *Name:* ${slip.customerName}\\n` +
          `• *Mobile:* ${slip.customerPhone}\\n` +
          `• *Email:* ${slip.customerEmail}\\n\\n` +
          `📍 *DELIVERY ADDRESS:*\\n` +
          `${slip.formattedAddress}\\n\\n` +
          `🌿 *PACKAGE CONTENTS:*\\n` +
          `${itemsList}\\n\\n` +
          `💰 *PAYMENT BREAKDOWN:*\\n` +
          `• Merchandise Subtotal: ₹${slip.subtotal}\\n` +
          (slip.discountAmount > 0 ? `• Promotional Discount: -₹${slip.discountAmount}\\n` : "") +
          `• Shipping Charges: ${slip.shippingFee === 0 ? "FREE" : `₹${slip.shippingFee}`}\\n` +
          `• *Total Payable / Collectable:* *₹${slip.total}*\\n\\n` +
          `🚚 *LOGISTICS:* ${slip.carrier || "Standard Courier"} | AWB: \`${slip.trackingNumber || "Pending"}\``;

        await sendTelegramMessage(chatId, reply);
        db.telegramRepo.logAudit(userId, "/shipping", `Retrieved shipping slip for ${slip.orderNumber}`);
        break;
      }

      case "/order": {"""

assert old_switch in content, "Could not find old_switch"
content = content.replace(old_switch, new_shipping_cmd, 1)

with open('server/telegram.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ server/telegram.ts patched successfully with Phase 6 features")
