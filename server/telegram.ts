/**
 * TRINAYAA ENTERPRISES — TELEGRAM ADMIN BOT & ADVANCED WORKFLOWS (PHASE 6)
 *
 * Full-featured, secure Telegram management bot connecting to TRINAYAA's
 * live database, inventory repository, campaigns repository, orders lifecycle,
 * and multi-channel notifications service.
 */

import * as db from "./db";
import { notificationsService, DispatchedNotification } from "./notifications";

// ==========================================
// 1. DATA MASKING & PRIVACY UTILITIES
// ==========================================

export function maskPhone(phone?: string | null): string {
  if (!phone) return "N/A";
  const cleaned = phone.trim();
  if (cleaned.length <= 5) return cleaned;
  return cleaned.slice(0, 5) + "*".repeat(Math.max(3, cleaned.length - 5));
}

export function maskEmail(email?: string | null): string {
  if (!email || !email.includes("@")) return "N/A";
  const [local, domain] = email.trim().split("@");
  if (local.length <= 1) return `*@${domain}`;
  return `${local[0]}***@${domain}`;
}

export function maskAddress(address?: any): string {
  if (!address) return "Standard Delivery";
  if (typeof address === "string") {
    try {
      address = JSON.parse(address);
    } catch {
      return "Tamil Nadu, India";
    }
  }
  const parts = [address.city, address.state, address.pinCode].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : "Tamil Nadu, India";
}

// ==========================================
// 2. SECURITY, RATE LIMITING & SESSIONS
// ==========================================

const userRateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = userRateLimits.get(userId);
  if (!entry || now > entry.resetAt) {
    userRateLimits.set(userId, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 20) {
    return false;
  }
  entry.count++;
  return true;
}

export function resetRateLimits() {
  userRateLimits.clear();
}

export interface ConversationSession {
  command: string;
  step: number;
  data: any;
  expiresAt: number;
}

const conversationSessions = new Map<string, ConversationSession>();

export function getSession(userId: string): ConversationSession | null {
  const session = conversationSessions.get(userId);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    conversationSessions.delete(userId);
    return null;
  }
  return session;
}

export function setSession(userId: string, session: { command: string; step: number; data: any }) {
  conversationSessions.set(userId, {
    command: session.command,
    step: session.step,
    data: session.data,
    expiresAt: Date.now() + 15 * 60 * 1000, // 15-minute TTL
  });
}

export function clearSession(userId: string) {
  conversationSessions.delete(userId);
}

// Duplicate callback query execution protection (1-hour window)
const processedCallbackQueries = new Map<string, number>();

export function isCallbackProcessed(id: string): boolean {
  const now = Date.now();
  for (const [key, ts] of processedCallbackQueries.entries()) {
    if (now - ts > 3600000) processedCallbackQueries.delete(key);
  }
  if (processedCallbackQueries.has(id)) return true;
  processedCallbackQueries.set(id, now);
  return false;
}

export function clearProcessedCallbacks() {
  processedCallbackQueries.clear();
}

// ==========================================
// 3. TELEGRAM API CLIENT & MESSAGING
// ==========================================

export const ADMIN_MAIN_KEYBOARD = {
  keyboard: [
    [{ text: "📊 Store Dashboard" }, { text: "📦 Recent Orders" }],
    [{ text: "🌿 Products & Stock" }, { text: "🎉 Active Offers" }],
    [{ text: "👥 Customers" }, { text: "❓ Help & Menu" }],
  ],
  resize_keyboard: true,
  is_persistent: true,
};

export function getOverviewMessage() {
  const stats = db.adminStatsRepo.getOverview();
  const text = `📊 *TRINAYAA STORE METRICS*\n\n` +
    `📦 *Products:*\n` +
    `• Total: ${stats.totalProducts}\n` +
    `• Active / Published: ${stats.activeProducts}\n` +
    `• Low-Stock Alerts (<=10): *${stats.lowStockProducts}*\n\n` +
    `🛍️ *Orders:*\n` +
    `• Total Orders: ${stats.totalOrders}\n` +
    `• Pending / In-progress: ${stats.pendingOrders}\n` +
    `• Completed / Delivered: ${stats.completedOrders}\n\n` +
    `💰 *Verified Revenue:* ₹${stats.totalRevenue.toLocaleString("en-IN")}\n` +
    `🎉 *Active Festival Offers:* ${stats.activeCampaigns}\n` +
    `👥 *Registered Customers:* ${stats.totalCustomers}`;

  const keyboard = {
    inline_keyboard: [
      [
        { text: "📦 Recent Orders", callback_data: "cmd_orders" },
        { text: "🌿 Top Products", callback_data: "cmd_products" },
      ],
      [
        { text: "🎉 Active Offers", callback_data: "cmd_offers" },
        { text: "👥 Customers", callback_data: "cmd_customers" },
      ],
    ],
  };

  return { text, keyboard };
}

export function getOrdersListMessage(limit = 5) {
  const orders = db.ordersRepo.listAll({ limit });
  if (orders.length === 0) {
    return {
      text: "No orders found in database.",
      keyboard: {
        inline_keyboard: [
          [{ text: "📊 Store Dashboard", callback_data: "cmd_stats" }],
        ],
      },
    };
  }
  let reply = `📦 *RECENT ORDERS:*\n\n`;
  const buttons: any[] = [];
  for (const o of orders) {
    reply += `• *${o.orderNumber}* — ₹${o.total} (${o.orderStatus})\n` +
             `  Customer: ${o.customerName} (${maskPhone(o.customerPhone)})\n` +
             `  Payment: ${o.paymentStatus} via ${o.paymentMethod}\n\n`;
    buttons.push([{ text: `View ${o.orderNumber}`, callback_data: `view_order:${o.orderNumber}` }]);
  }
  buttons.push([
    { text: "📊 Store Dashboard", callback_data: "cmd_stats" },
    { text: "🌿 Products", callback_data: "cmd_products" },
  ]);
  return { text: reply, keyboard: { inline_keyboard: buttons } };
}

export function getProductsListMessage(limit = 8) {
  const products = db.productsRepo.getAll({ limit });
  if (products.length === 0) {
    return {
      text: "No products found in catalogue.",
      keyboard: {
        inline_keyboard: [
          [{ text: "📊 Store Dashboard", callback_data: "cmd_stats" }],
        ],
      },
    };
  }
  let reply = `🌿 *TOP CATALOGUE PRODUCTS:*\n\n`;
  const buttons: any[] = [];
  for (const p of products) {
    reply += `• *${p.nameEn}* (\`${p.sku}\`)\n` +
             `  Price: ₹${p.price} | Stock: ${p.stock} units (${p.stockAvailability})\n\n`;
    buttons.push([{ text: `${p.sku} — ${p.nameEn.slice(0, 20)}`, callback_data: `view_product:${p.sku}` }]);
  }
  buttons.push([
    { text: "📊 Store Dashboard", callback_data: "cmd_stats" },
    { text: "📦 Recent Orders", callback_data: "cmd_orders" },
  ]);
  return { text: reply, keyboard: { inline_keyboard: buttons.slice(0, 7) } };
}

export function getOffersMessage() {
  const campaigns = db.campaignsRepo.getActive();
  if (campaigns.length === 0) {
    return {
      text: "No active festival campaigns currently running.",
      keyboard: {
        inline_keyboard: [
          [{ text: "📊 Store Dashboard", callback_data: "cmd_stats" }, { text: "📦 Recent Orders", callback_data: "cmd_orders" }],
        ],
      },
    };
  }
  let reply = `🎉 *ACTIVE FESTIVAL OFFERS:*\n\n`;
  for (const c of campaigns) {
    reply += `• *${c.name}* (Code: \`${c.code}\`)\n` +
             `  Discount: ${c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₹${c.discountValue}`}\n` +
             `  Min Order: ₹${c.minOrderValue} | Max Discount: ₹${c.maxDiscount}\n` +
             `  Valid until: ${new Date(c.endDate).toLocaleDateString()}\n\n`;
  }
  const keyboard = {
    inline_keyboard: [
      [{ text: "📊 Store Dashboard", callback_data: "cmd_stats" }, { text: "📦 Recent Orders", callback_data: "cmd_orders" }],
    ],
  };
  return { text: reply, keyboard };
}

export function getCustomersSummaryMessage() {
  const stats = db.adminStatsRepo.getOverview();
  const customers = db.usersRepo.listCustomers(5, 0);
  let reply = `👥 *CUSTOMER SUMMARY*\n\n` +
    `• Total Registered: *${stats.totalCustomers}*\n\n` +
    `*Recent Customers:*\n`;
  for (const c of customers) {
    reply += `• ${c.name || "Customer"} — ${maskPhone(c.phone)} (${maskEmail(c.email)})\n` +
             `  Orders: ${c.totalOrders} | Spent: ₹${c.totalSpent}\n\n`;
  }
  const keyboard = {
    inline_keyboard: [
      [{ text: "📊 Store Dashboard", callback_data: "cmd_stats" }, { text: "📦 Recent Orders", callback_data: "cmd_orders" }],
    ],
  };
  return { text: reply, keyboard };
}

export function getFullHelpText() {
  return `🌿 *TRINAYAA Enterprise Admin Bot*\n` +
    `Connected to Live Database & Service Layer\n\n` +
    `*📊 Dashboard & Reports:*\n` +
    `• \`/dashboard\` or \`/stats\` — Store overview, orders & revenue\n` +
    `• \`/orders\` — View 5 most recent orders with quick actions\n` +
    `• \`/order <ID>\` — Order details with masked info (e.g. \`/order TRN-10482\`)\n` +
    `• \`/updateorder <ID> [Status]\` — Update order status\n` +
    `• \`/customers\` — View customer base summary\n\n` +
    `*🌿 Catalogue & Inventory:*\n` +
    `• \`/products\` — Top catalogue products list\n` +
    `• \`/product <SKU/Name>\` — Search product details & quick stock buttons\n` +
    `• \`/addproduct\` — Guided wizard to create new product\n` +
    `• \`/editproduct <SKU>\` — Edit product details\n` +
    `• \`/updateprice <SKU> <Price> [MRP]\` — Update price in catalogue\n` +
    `• \`/stock <SKU> [Qty]\` — View stock or set directly\n` +
    `• \`/stockadd <SKU> <Qty> [Reason]\` — Add inventory (Restock)\n` +
    `• \`/stocksub <SKU> <Qty> [Reason]\` — Subtract inventory (Adjustment)\n` +
    `• \`/stockset <SKU> <Qty> [Reason]\` — Overwrite stock quantity\n` +
    `• \`/uploadimage <SKU> <URL>\` — Attach image to product\n\n` +
    `*🎉 Marketing & Offers:*\n` +
    `• \`/offers\` — View active festival campaigns\n` +
    `• \`/createoffer\` — Guided wizard to create festival coupon\n` +
    `• \`/disableoffer <Code>\` — Deactivate coupon\n\n` +
    `*👤 Administration:*\n` +
    `• \`/admins\` — List authorized Telegram admins\n` +
    `• \`/audit\` — View recent admin audit logs\n` +
    `• \`/cancel\` — Cancel any active guided conversation`;
}

export async function sendTelegramMessage(chatId: string | number, text: string, replyMarkup?: any) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("PLACEHOLDER") || token.includes("placeholder")) {
    console.log(`[Telegram Bot Simulation -> Chat ${chatId}]:\n${text}\n${replyMarkup ? JSON.stringify(replyMarkup) : ""}`);
    return { ok: true, result: { message_id: Math.floor(Math.random() * 10000) } };
  }

  try {
    const payload: any = {
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
    };
    if (replyMarkup) {
      payload.reply_markup = replyMarkup;
    }
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("[Telegram Send Error]:", error);
    return { ok: false, error };
  }
}

export async function answerCallbackQuery(callbackQueryId: string, text?: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("PLACEHOLDER") || token.includes("placeholder")) {
    return { ok: true };
  }

  try {
    const payload: any = { callback_query_id: callbackQueryId };
    if (text) payload.text = text;
    const response = await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return await response.json();
  } catch (error) {
    console.error("[Telegram answerCallbackQuery Error]:", error);
    return { ok: false, error };
  }
}

// ==========================================
// 4. NOTIFICATION SUBSCRIBER
// ==========================================

let isListenerRegistered = false;

export function initTelegramNotifications() {
  if (isListenerRegistered) return;
  isListenerRegistered = true;

  notificationsService.on("notification", async (notif: DispatchedNotification) => {
    try {
      const allowedIds = db.telegramRepo.getAllAllowedIds();
      if (!allowedIds || allowedIds.length === 0) return;

      const maskedEmail = maskEmail(notif.recipientEmail);
      const maskedPhone = maskPhone(notif.recipientPhone);

      let icon = "🔔";
      switch (notif.event) {
        case "ORDER_CREATED": icon = "🛍️"; break;
        case "PAYMENT_CONFIRMED": icon = "💰"; break;
        case "PAYMENT_FAILED": icon = "⚠️"; break;
        case "ORDER_SHIPPED": icon = "🚚"; break;
        case "OUT_FOR_DELIVERY": icon = "🛵"; break;
        case "ORDER_DELIVERED": icon = "🎉"; break;
        case "ORDER_CANCELLED": icon = "❌"; break;
        case "ORDER_REFUNDED": icon = "💸"; break;
      }

      const text = `${icon} *ADMIN ALERT: ${notif.event}*\n\n` +
        `• *Order:* \`${notif.orderNumber}\`\n` +
        `• *Customer:* ${maskedPhone} (${maskedEmail})\n` +
        `• *Subject:* ${notif.subject}\n` +
        `• *Time:* ${new Date(notif.dispatchedAt).toLocaleTimeString()}`;

      for (const adminId of allowedIds) {
        await sendTelegramMessage(adminId, text);
      }
    } catch (err) {
      console.error("[Telegram Notification Broadcast Error]:", err);
    }
  });
}


// ==========================================
// 4C. SUPPORT TICKET NOTIFICATIONS (PHASE 3)
// ==========================================

const dispatchedTicketAlerts = new Set<string>();

export async function notifySupportTicketCreated(ticket: {
  ticketNumber: string;
  category: string;
  priority: string;
  subject: string;
  customerName: string;
}) {
  try {
    const eventKey = `ticket_created_${ticket.ticketNumber}`;
    if (dispatchedTicketAlerts.has(eventKey)) return;
    dispatchedTicketAlerts.add(eventKey);

    const allowedIds = db.telegramRepo.getAllAllowedIds();
    if (!allowedIds || allowedIds.length === 0) return;

    const isUrgent = ticket.priority.toLowerCase() === "urgent" || ticket.priority.toLowerCase() === "high";
    const icon = isUrgent ? "🚨" : "🎫";

    const text = `${icon} *SUPPORT ALERT: NEW TICKET*

` +
      `• *Ticket:* \`${ticket.ticketNumber}\`
` +
      `• *Category:* ${ticket.category}
` +
      `• *Priority:* *${ticket.priority.toUpperCase()}*
` +
      `• *Subject:* ${ticket.subject}
` +
      `• *Customer:* ${ticket.customerName}
` +
      `• *Time:* ${new Date().toLocaleTimeString()}

` +
      `👉 _Open Admin Helpdesk to respond immediately._`;

    for (const adminId of allowedIds) {
      await sendTelegramMessage(adminId, text, {
        inline_keyboard: [
          [
            { text: "📋 View in Helpdesk", url: "http://localhost:3000/admin?tab=helpdesk" }
          ]
        ]
      });
    }
  } catch (err) {
    console.error("[Telegram Ticket Notification Error]:", err);
  }
}

export async function notifySupportTicketReply(ticket: {
  ticketNumber: string;
  subject: string;
  senderType: string;
  senderName: string;
  message: string;
}) {
  try {
    const allowedIds = db.telegramRepo.getAllAllowedIds();
    if (!allowedIds || allowedIds.length === 0) return;

    const icon = ticket.senderType === "CUSTOMER" ? "💬" : "👨‍💼";
    const snippet = ticket.message.length > 120 ? ticket.message.slice(0, 117) + "..." : ticket.message;

    const text = `${icon} *SUPPORT TICKET UPDATE*

` +
      `• *Ticket:* \`${ticket.ticketNumber}\`
` +
      `• *Subject:* ${ticket.subject}
` +
      `• *Reply by:* ${ticket.senderName} (${ticket.senderType})
` +
      `• *Message:* _"${snippet}"_
` +
      `• *Time:* ${new Date().toLocaleTimeString()}`;

    for (const adminId of allowedIds) {
      await sendTelegramMessage(adminId, text);
    }
  } catch (err) {
    console.error("[Telegram Ticket Reply Alert Error]:", err);
  }
}

// ==========================================
// 4B. TELEGRAM LONG POLLING SERVICE
// ==========================================

let isPollingActive = false;
let pollingOffset = 0;

export async function startTelegramPolling() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("placeholder") || token.includes("PLACEHOLDER")) {
    console.log("[Telegram Bot] No valid TELEGRAM_BOT_TOKEN found in environment, polling not started.");
    return;
  }
  if (isPollingActive) return;
  isPollingActive = true;
  console.log("🤖 [Telegram Bot] Starting long polling for @trinayaa_admin_bot...");

  // Clear any existing webhook so getUpdates polling works cleanly
  try {
    await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=false`);
  } catch (e) {
    // ignore
  }

  const poll = async () => {
    if (!isPollingActive) return;
    try {
      const url = `https://api.telegram.org/bot${token}/getUpdates?offset=${pollingOffset}&timeout=20`;
      const res = await fetch(url);
      const data = (await res.json()) as any;
      if (data && data.ok && Array.isArray(data.result)) {
        for (const update of data.result) {
          pollingOffset = update.update_id + 1;
          try {
            await handleTelegramUpdate(update);
          } catch (updateErr) {
            console.error("[Telegram Poll Update Error]:", updateErr);
          }
        }
      }
    } catch (err: any) {
      await new Promise((r) => setTimeout(r, 2000));
    }
    if (isPollingActive) {
      setImmediate(poll);
    }
  };

  poll();
}

export function stopTelegramPolling() {
  isPollingActive = false;
}

// ==========================================
// 5. CALLBACK QUERY HANDLER
// ==========================================

async function handleCallbackQuery(cb: any) {
  const userId = String(cb.from.id);
  const userName = cb.from.username || cb.from.first_name || "Admin";
  const chatId = cb.message?.chat?.id || cb.from.id;
  const data = cb.data || "";

  // 1. Authorization
  if (!db.telegramRepo.isAllowed(userId)) {
    db.telegramRepo.logAudit(userId, "UNAUTHORIZED_CALLBACK", `User @${userName} tried callback: ${data}`);
    await answerCallbackQuery(cb.id, "Access Denied");
    await sendTelegramMessage(chatId, `⛔ *Access Denied*\nYour Telegram ID \`${userId}\` is not authorized.`);
    return { ok: true };
  }

  // 2. Duplicate callback execution protection
  if (isCallbackProcessed(cb.id)) {
    await answerCallbackQuery(cb.id, "Action already processed");
    return { ok: true };
  }

  await answerCallbackQuery(cb.id);

  // 3. Process actions
  const [action, ...params] = data.split(":");

  switch (action) {
    case "view_order": {
      const orderNumber = params[0];
      const order = db.ordersRepo.getByOrderNumber(orderNumber);
      if (!order) {
        await sendTelegramMessage(chatId, `❌ Order \`${orderNumber}\` not found.`);
        return { ok: true };
      }
      const detail = formatOrderDetails(order);
      const keyboard = {
        inline_keyboard: [
          [{ text: "🔄 Update Status", callback_data: `status_menu:${order.orderNumber}` }],
          [{ text: "📦 View Recent Orders", callback_data: "cmd_orders" }]
        ]
      };
      await sendTelegramMessage(chatId, detail, keyboard);
      db.telegramRepo.logAudit(userId, "CALLBACK_VIEW_ORDER", orderNumber);
      break;
    }

    case "status_menu": {
      const orderNumber = params[0];
      const order = db.ordersRepo.getByOrderNumber(orderNumber);
      if (!order) {
        await sendTelegramMessage(chatId, `❌ Order \`${orderNumber}\` not found.`);
        return { ok: true };
      }
      const keyboard = getOrderStatusKeyboard(order);
      await sendTelegramMessage(chatId, `🔄 *Select New Status for Order ${order.orderNumber}:*\nCurrent Status: *${order.orderStatus}*`, keyboard);
      break;
    }

    case "set_status": {
      const [orderNumber, newStatus] = params;
      const order = db.ordersRepo.getByOrderNumber(orderNumber);
      if (!order) {
        await sendTelegramMessage(chatId, `❌ Order \`${orderNumber}\` not found.`);
        return { ok: true };
      }

      // Payment safety check: Cannot transition to Confirmed unless paymentStatus === 'PAID'
      if (newStatus === "Confirmed" && order.paymentStatus !== "PAID") {
        await sendTelegramMessage(
          chatId,
          `⚠️ *Action Blocked*: Cannot manually confirm an unpaid order. Payment must be verified by the Razorpay gateway or marked paid in the Admin Portal.`
        );
        return { ok: true };
      }

      // Permitted transitions
      const errorMsg = validateStatusTransition(order.orderStatus, newStatus);
      if (errorMsg) {
        await sendTelegramMessage(chatId, `❌ *Transition Error*: ${errorMsg}`);
        return { ok: true };
      }

      try {
        db.ordersRepo.updateStatus(order.id, newStatus, `Status updated via Telegram Bot by @${userName}`, `Telegram:@${userName}`);
        await sendTelegramMessage(chatId, `✅ Order *${order.orderNumber}* status updated from *${order.orderStatus}* to *${newStatus}*!`);
        db.telegramRepo.logAudit(userId, "/updateorder", `Updated ${order.orderNumber} from ${order.orderStatus} to ${newStatus}`);
      } catch (err: any) {
        await sendTelegramMessage(chatId, `❌ Failed to update status: ${err.message}`);
      }
      break;
    }

    case "view_product": {
      const sku = params[0];
      const prod = db.productsRepo.getBySku(sku);
      if (!prod) {
        await sendTelegramMessage(chatId, `❌ Product \`${sku}\` not found.`);
        return { ok: true };
      }
      const detail = formatProductDetails(prod);
      const keyboard = {
        inline_keyboard: [
          [
            { text: "📊 Quick Stock (+10)", callback_data: `stock_adjust:${sku}:10` },
            { text: "📊 Quick Stock (-10)", callback_data: `stock_adjust:${sku}:-10` }
          ],
          [
            { text: "📦 Adjust Stock Menu", callback_data: `stock_menu:${sku}` }
          ]
        ]
      };
      await sendTelegramMessage(chatId, detail, keyboard);
      db.telegramRepo.logAudit(userId, "CALLBACK_VIEW_PRODUCT", sku);
      break;
    }

    case "stock_menu": {
      const sku = params[0];
      const prod = db.productsRepo.getBySku(sku);
      if (!prod) {
        await sendTelegramMessage(chatId, `❌ Product \`${sku}\` not found.`);
        return { ok: true };
      }
      const keyboard = {
        inline_keyboard: [
          [
            { text: "➕ 10", callback_data: `stock_adjust:${sku}:10` },
            { text: "➕ 50", callback_data: `stock_adjust:${sku}:50` },
            { text: "➖ 10", callback_data: `stock_adjust:${sku}:-10` },
            { text: "➖ 50", callback_data: `stock_adjust:${sku}:-50` }
          ],
          [{ text: "❌ Cancel", callback_data: "cancel_action" }]
        ]
      };
      await sendTelegramMessage(chatId, `📦 *Adjust Stock for ${prod.nameEn}* (\`${sku}\`)\nCurrent Stock: *${prod.stock} units*`, keyboard);
      break;
    }

    case "stock_adjust": {
      const sku = params[0];
      const delta = parseInt(params[1], 10);
      const prod = db.productsRepo.getBySku(sku);
      if (!prod) {
        await sendTelegramMessage(chatId, `❌ Product \`${sku}\` not found.`);
        return { ok: true };
      }
      const changeType = delta > 0 ? "RESTOCK" : "ADJUSTMENT";
      const result = db.inventoryRepo.adjustStock(
        prod.id,
        null,
        delta,
        changeType,
        "Telegram",
        `Quick adjustment (${delta > 0 ? `+${delta}` : delta}) via Telegram Bot`,
        `Telegram:@${userName}`
      );
      await sendTelegramMessage(
        chatId,
        `✅ Stock updated for *${prod.nameEn}* (\`${sku}\`):\n` +
        `• Previous: ${result.oldStock} units\n` +
        `• Change: ${delta > 0 ? `+${delta}` : delta} units\n` +
        `• New Stock: *${result.newStock} units* (${result.availability})`
      );
      db.telegramRepo.logAudit(userId, "STOCK_ADJUST", `Adjusted ${sku} by ${delta}`);
      break;
    }

    case "cmd_stats":
    case "cmd_dashboard": {
      const { text, keyboard } = getOverviewMessage();
      await sendTelegramMessage(chatId, text, keyboard);
      db.telegramRepo.logAudit(userId, "CALLBACK_DASHBOARD");
      break;
    }

    case "cmd_orders": {
      const { text, keyboard } = getOrdersListMessage(5);
      await sendTelegramMessage(chatId, text, keyboard);
      db.telegramRepo.logAudit(userId, "CALLBACK_ORDERS");
      break;
    }

    case "cmd_products": {
      const { text, keyboard } = getProductsListMessage(8);
      await sendTelegramMessage(chatId, text, keyboard);
      db.telegramRepo.logAudit(userId, "CALLBACK_PRODUCTS");
      break;
    }

    case "cmd_offers": {
      const { text, keyboard } = getOffersMessage();
      await sendTelegramMessage(chatId, text, keyboard);
      db.telegramRepo.logAudit(userId, "CALLBACK_OFFERS");
      break;
    }

    case "cmd_customers": {
      const { text, keyboard } = getCustomersSummaryMessage();
      await sendTelegramMessage(chatId, text, keyboard);
      db.telegramRepo.logAudit(userId, "CALLBACK_CUSTOMERS");
      break;
    }

    case "cmd_full_help": {
      await sendTelegramMessage(chatId, getFullHelpText(), ADMIN_MAIN_KEYBOARD);
      db.telegramRepo.logAudit(userId, "CALLBACK_HELP");
      break;
    }

    case "cancel_action": {
      await sendTelegramMessage(chatId, "🚫 Action cancelled.");
      break;
    }

    default:
      await sendTelegramMessage(chatId, `Unknown action \`${action}\`.`);
  }

  return { ok: true };
}

// ==========================================
// 6. MAIN UPDATE DISPATCHER
// ==========================================

export async function handleTelegramUpdate(update: any) {
  if (!update) return { ok: true };

  // Handle inline keyboard callback queries
  if (update.callback_query) {
    return await handleCallbackQuery(update.callback_query);
  }

  const message = update.message || update.edited_message;
  if (!message || !message.text) return { ok: true };

  const chatId = message.chat.id;
  const userId = String(message.from.id);
  const userName = message.from.username || message.from.first_name || "Admin";
  const text = message.text.trim();

  // 1. Authorization check
  const isAllowed = db.telegramRepo.isAllowed(userId);
  if (!isAllowed) {
    db.telegramRepo.logAudit(userId, "UNAUTHORIZED_ATTEMPT", `User @${userName} tried to execute: ${text}`);
    await sendTelegramMessage(
      chatId,
      `⛔ *Access Denied*\n\n` +
      `Your Telegram User ID is: \`${userId}\`\n\n` +
      `To authorize this account:\n` +
      `1. Open Admin Panel: http://localhost:3000/admin\n` +
      `2. Go to **Telegram Bot** tab\n` +
      `3. Enter ID: \`${userId}\` and click **Authorize Admin**\n\n` +
      `_Once authorized, send /start or /help!_`
    );
    return { ok: true };
  }

  // 2. Rate limiting check (20 commands/minute)
  if (!checkRateLimit(userId)) {
    await sendTelegramMessage(chatId, "⚠️ Rate limit exceeded. Please wait a moment before sending more commands.");
    return { ok: true };
  }

  // 3. Check for cancellation command
  if (text.toLowerCase() === "/cancel") {
    clearSession(userId);
    await sendTelegramMessage(chatId, "🚫 Active interactive session has been cancelled.");
    db.telegramRepo.logAudit(userId, "/cancel");
    return { ok: true };
  }

  // 4. Check active interactive conversation sessions
  const activeSession = getSession(userId);
  if (activeSession) {
    return await handleActiveSession(chatId, userId, userName, text, activeSession);
  }

  // 5. Parse command and arguments with friendly natural language & keyboard intent matching
  const parts = text.split(/\s+/);
  let cmd = parts[0] || "";
  let args = parts.slice(1);
  let command = cmd.toLowerCase();
  const lowerText = text.toLowerCase();

  // Natural language & reply keyboard matching for zero-typing client UX
  if (text.includes("Dashboard") || lowerText === "dashboard" || lowerText === "stats" || lowerText === "overview" || lowerText === "metrics") {
    command = "/dashboard";
    args = [];
  } else if (text.includes("Recent Orders") || lowerText === "orders" || lowerText === "recent orders" || lowerText === "recent") {
    command = "/orders";
    args = [];
  } else if (text.includes("Products") || lowerText === "products" || lowerText === "catalogue" || lowerText === "catalog") {
    command = "/products";
    args = [];
  } else if (text.includes("Active Offers") || lowerText === "offers" || lowerText === "promotions" || lowerText === "coupons" || lowerText === "discount" || lowerText === "discounts") {
    command = "/offers";
    args = [];
  } else if (text.includes("Customers") || lowerText === "customers" || lowerText === "users") {
    command = "/customers";
    args = [];
  } else if (text.includes("Help & Menu") || lowerText === "help" || lowerText === "menu" || lowerText === "start" || lowerText === "hi" || lowerText === "hello" || text === "வணக்கம்") {
    command = "/help";
    args = [];
  } else if (!command.startsWith("/")) {
    if (command === "order") command = "/order";
    else if (command === "product") command = "/product";
    else if (command === "stock") command = "/stock";
    else if (command === "stockadd") command = "/stockadd";
    else if (command === "stocksub") command = "/stocksub";
    else if (command === "stockset") command = "/stockset";
  }

  try {
    switch (command) {
      case "/start":
      case "/help":
      case "/menu": {
        const welcomeText = `🌿 *Welcome to TRINAYAA Enterprise Admin Bot*\n` +
          `Connected to Live Store Database & Operations\n\n` +
          `✨ *Quick 1-Tap Store Controls:*\n` +
          `Tap any button on the persistent menu below, or use the interactive action buttons on this card.\n\n` +
          `💡 *Zero Typing Required:*\n` +
          `• Tap *📊 Store Dashboard* or *📦 Recent Orders* below for instant live numbers.\n` +
          `• Tap *🌿 Products & Stock* to inspect items and restock instantly.\n` +
          `• Type simple words like \`orders\`, \`stock\`, \`offers\` or \`வணக்கம்\` anytime!`;

        const welcomeInlineKeyboard = {
          inline_keyboard: [
            [
              { text: "📊 Store Dashboard", callback_data: "cmd_stats" },
              { text: "📦 Recent Orders", callback_data: "cmd_orders" },
            ],
            [
              { text: "🌿 Products & Stock", callback_data: "cmd_products" },
              { text: "🎉 Active Offers", callback_data: "cmd_offers" },
            ],
            [
              { text: "👥 Customers Base", callback_data: "cmd_customers" },
              { text: "📋 Full Command Guide", callback_data: "cmd_full_help" },
            ],
          ],
        };

        // Send interactive card
        await sendTelegramMessage(chatId, welcomeText, welcomeInlineKeyboard);
        // Bind persistent touch keyboard to client device
        await sendTelegramMessage(chatId, `👇 *Quick Touch Menu Active* — Tap any button below to manage your store:`, ADMIN_MAIN_KEYBOARD);
        db.telegramRepo.logAudit(userId, "/help");
        break;
      }

      case "/dashboard":
      case "/stats": {
        const { text: msg, keyboard } = getOverviewMessage();
        await sendTelegramMessage(chatId, msg, keyboard);
        db.telegramRepo.logAudit(userId, "/dashboard");
        break;
      }

      case "/orders":
      case "/recent": {
        const { text: reply, keyboard } = getOrdersListMessage(5);
        await sendTelegramMessage(chatId, reply, keyboard);
        db.telegramRepo.logAudit(userId, "/orders");
        break;
      }

      case "/order": {
        if (!args[0]) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/order <OrderNumber>` (e.g. `/order TRN-10482`)");
          break;
        }
        const order = db.ordersRepo.getByOrderNumber(args[0]);
        if (!order) {
          await sendTelegramMessage(chatId, `❌ Order \`${args[0]}\` not found.`);
          break;
        }
        const detail = formatOrderDetails(order);
        const keyboard = {
          inline_keyboard: [
            [{ text: "🔄 Update Status", callback_data: `status_menu:${order.orderNumber}` }]
          ]
        };
        await sendTelegramMessage(chatId, detail, keyboard);
        db.telegramRepo.logAudit(userId, "/order", `Looked up ${args[0]}`);
        break;
      }

      case "/status":
      case "/updateorder": {
        if (!args[0]) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/updateorder <OrderNumber> [NewStatus]`\nExample: `/updateorder TRN-10482 Shipped`");
          break;
        }
        const orderNum = args[0];
        const order = db.ordersRepo.getByOrderNumber(orderNum);
        if (!order) {
          await sendTelegramMessage(chatId, `❌ Order \`${orderNum}\` not found.`);
          break;
        }

        if (args.length === 1) {
          // Show status buttons
          const keyboard = getOrderStatusKeyboard(order);
          await sendTelegramMessage(chatId, `🔄 *Select New Status for Order ${order.orderNumber}:*\nCurrent Status: *${order.orderStatus}*`, keyboard);
          break;
        }

        const newStatus = args.slice(1).join(" ");

        // Payment safety check
        if (newStatus === "Confirmed" && order.paymentStatus !== "PAID") {
          await sendTelegramMessage(
            chatId,
            `⚠️ *Action Blocked*: Cannot manually confirm an unpaid order. Payment must be verified by the Razorpay gateway or marked paid in the Admin Portal.`
          );
          break;
        }

        const transitionError = validateStatusTransition(order.orderStatus, newStatus);
        if (transitionError) {
          await sendTelegramMessage(chatId, `❌ *Transition Error*: ${transitionError}`);
          break;
        }

        db.ordersRepo.updateStatus(order.id, newStatus, `Updated via Telegram Bot by @${userName}`, `Telegram:@${userName}`);
        await sendTelegramMessage(chatId, `✅ Order *${order.orderNumber}* status updated to *${newStatus}*`);
        db.telegramRepo.logAudit(userId, "/updateorder", `Updated ${order.orderNumber} to ${newStatus}`);
        break;
      }

      case "/products": {
        const { text: reply, keyboard } = getProductsListMessage(8);
        await sendTelegramMessage(chatId, reply, keyboard);
        db.telegramRepo.logAudit(userId, "/products");
        break;
      }

      case "/product": {
        if (!args[0]) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/product <SKU or Name>` (e.g. `/product TRN-1001`)");
          break;
        }
        const query = args.join(" ");
        let product = db.productsRepo.getBySku(query);
        if (!product) {
          const list = db.productsRepo.getAll({ search: query, limit: 1 });
          product = list[0] || null;
        }
        if (!product) {
          await sendTelegramMessage(chatId, `❌ No product found matching "${query}"`);
          break;
        }
        const reply = formatProductDetails(product);
        const keyboard = {
          inline_keyboard: [
            [
              { text: "➕ 10", callback_data: `stock_adjust:${product.sku}:10` },
              { text: "➖ 10", callback_data: `stock_adjust:${product.sku}:-10` }
            ],
            [{ text: "📦 Adjust Stock Menu", callback_data: `stock_menu:${product.sku}` }]
          ]
        };
        await sendTelegramMessage(chatId, reply, keyboard);
        db.telegramRepo.logAudit(userId, "/product", `Searched ${query}`);
        break;
      }

      case "/addproduct": {
        // Support one-shot syntax: /addproduct <SKU> <Price> <NameEn>
        if (args.length >= 3 && !isNaN(Number(args[1]))) {
          const sku = args[0].toUpperCase();
          const price = parseFloat(args[1]);
          const nameEn = args.slice(2).join(" ");
          const existing = db.productsRepo.getBySku(sku);
          if (existing) {
            await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` already exists.`);
            break;
          }
          const defaultCat = db.categoriesRepo.getAll()[0];
          const newProd = db.productsRepo.create({
            sku,
            nameEn,
            nameTa: nameEn,
            categoryId: defaultCat?.id || null,
            sellingPrice: price,
            mrp: Math.round(price * 1.2),
            stock: 100,
            status: "Published",
          });
          await sendTelegramMessage(chatId, `✅ Product created successfully!\n\n• Name: *${newProd.nameEn}*\n• SKU: \`${newProd.sku}\`\n• Price: ₹${newProd.price}\n• Stock: ${newProd.stock} units`);
          db.telegramRepo.logAudit(userId, "/addproduct", `Created product ${sku}`);
          break;
        }

        // Start guided session
        setSession(userId, { command: "addproduct", step: 1, data: {} });
        await sendTelegramMessage(
          chatId,
          `🌿 *Add New Product (Step 1/7)*\n\nPlease enter the *English Name* of the botanical product (e.g. Pure Neem Leaf Powder):`
        );
        break;
      }

      case "/editproduct": {
        if (!args[0]) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/editproduct <SKU>`\nExample: `/editproduct TRN-1001`");
          break;
        }
        const sku = args[0];
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product \`${sku}\` not found.`);
          break;
        }
        const msg = `🌿 *EDIT PRODUCT ${product.sku}*\n\n` +
          `• Name: *${product.nameEn}* (${product.nameTa || ""})\n` +
          `• Selling Price: ₹${product.price} (MRP: ₹${product.compareAt || product.price})\n` +
          `• Stock: *${product.stock} units*\n\n` +
          `Quick Commands:\n` +
          `• Price: \`/updateprice ${sku} <NewPrice> [NewMRP]\`\n` +
          `• Restock: \`/stockadd ${sku} <Qty>\`\n` +
          `• Overwrite Stock: \`/stockset ${sku} <Qty>\`\n` +
          `• Image: \`/uploadimage ${sku} <URL>\``;
        const keyboard = {
          inline_keyboard: [
            [
              { text: "➕ Add 10", callback_data: `stock_adjust:${sku}:10` },
              { text: "➕ Add 50", callback_data: `stock_adjust:${sku}:50` }
            ],
            [{ text: "📦 Adjust Stock Menu", callback_data: `stock_menu:${sku}` }]
          ]
        };
        await sendTelegramMessage(chatId, msg, keyboard);
        db.telegramRepo.logAudit(userId, "/editproduct", sku);
        break;
      }

      case "/price":
      case "/updateprice": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/updateprice <SKU> <NewPrice> [NewMRP]`\nExample: `/updateprice TRN-1001 175 200`");
          break;
        }
        const [sku, priceStr, mrpStr] = args;
        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) {
          await sendTelegramMessage(chatId, "❌ Invalid price. Must be a positive number.");
          break;
        }
        const mrp = mrpStr ? parseFloat(mrpStr) : undefined;
        if (mrpStr && (isNaN(mrp!) || mrp! <= 0)) {
          await sendTelegramMessage(chatId, "❌ Invalid MRP. Must be a positive number.");
          break;
        }
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` not found.`);
          break;
        }
        db.productsRepo.updatePrice(product.id, price, mrp);
        await sendTelegramMessage(
          chatId,
          `✅ Price updated for *${product.nameEn}* (\`${sku}\`):\n• Selling Price: *₹${price}*${mrp ? `\n• MRP: *₹${mrp}*` : ""}`
        );
        db.telegramRepo.logAudit(userId, "/updateprice", `Updated price for ${sku} to ₹${price}${mrp ? ` (MRP ₹${mrp})` : ""}`);
        break;
      }

      case "/uploadimage": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/uploadimage <SKU> <ImageURL>`\nExample: `/uploadimage TRN-1001 https://example.com/image.jpg`");
          break;
        }
        const [sku, imageUrl] = args;
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` not found.`);
          break;
        }
        db.productsRepo.update(product.id, { primaryImage: imageUrl });
        db.imagesRepo.add(product.id, imageUrl, product.nameEn, true);
        await sendTelegramMessage(chatId, `✅ Primary image updated for *${product.nameEn}* (\`${sku}\`).`);
        db.telegramRepo.logAudit(userId, "/uploadimage", `Updated image for ${sku}`);
        break;
      }

      case "/stock": {
        if (!args[0]) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/stock <SKU> [Quantity]` (e.g. `/stock TRN-1001` or `/stock TRN-1001 150`)");
          break;
        }
        const sku = args[0];
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` not found.`);
          break;
        }

        if (args.length === 1) {
          // View stock with adjustment buttons
          const keyboard = {
            inline_keyboard: [
              [
                { text: "➕ 10", callback_data: `stock_adjust:${sku}:10` },
                { text: "➕ 50", callback_data: `stock_adjust:${sku}:50` },
                { text: "➖ 10", callback_data: `stock_adjust:${sku}:-10` },
                { text: "➖ 50", callback_data: `stock_adjust:${sku}:-50` }
              ]
            ]
          };
          await sendTelegramMessage(
            chatId,
            `📦 *INVENTORY FOR ${product.nameEn}* (\`${sku}\`)\n\n` +
            `• Current Stock: *${product.stock} units*\n` +
            `• Status: *${product.stockAvailability}*\n` +
            `• Price: ₹${product.price}\n\n` +
            `Use buttons below to adjust or type: \`/stockadd ${sku} <Qty>\``,
            keyboard
          );
          break;
        }

        const qty = parseInt(args[1], 10);
        if (isNaN(qty) || qty < 0) {
          await sendTelegramMessage(chatId, "❌ Invalid stock quantity. Must be a non-negative integer.");
          break;
        }
        db.inventoryRepo.updateStock(product.id, qty, "Direct stock update via Telegram", `Telegram:@${userName}`);
        await sendTelegramMessage(chatId, `✅ Stock set for *${product.nameEn}* (\`${sku}\`): *${qty} units*`);
        db.telegramRepo.logAudit(userId, "/stock", `Set stock for ${sku} to ${qty}`);
        break;
      }

      case "/stockadd": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/stockadd <SKU> <Quantity> [Reason]`\nExample: `/stockadd TRN-1001 50 Batch #204 restock`");
          break;
        }
        const [sku, qtyStr, ...reasonParts] = args;
        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0) {
          await sendTelegramMessage(chatId, "❌ Quantity to add must be a positive integer.");
          break;
        }
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` not found.`);
          break;
        }
        const reason = reasonParts.join(" ") || "Batch restock via Telegram";
        const result = db.inventoryRepo.adjustStock(product.id, null, qty, "RESTOCK", "Telegram", reason, `Telegram:@${userName}`);
        await sendTelegramMessage(
          chatId,
          `✅ Stock added for *${product.nameEn}* (\`${sku}\`):\n` +
          `• Added: +${qty} units\n` +
          `• New Stock: *${result.newStock} units* (${result.availability})\n` +
          `• Reason: ${reason}`
        );
        db.telegramRepo.logAudit(userId, "/stockadd", `Added ${qty} to ${sku}`);
        break;
      }

      case "/stocksub": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/stocksub <SKU> <Quantity> [Reason]`\nExample: `/stocksub TRN-1001 10 Damaged batch`");
          break;
        }
        const [sku, qtyStr, ...reasonParts] = args;
        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty <= 0) {
          await sendTelegramMessage(chatId, "❌ Quantity to subtract must be a positive integer.");
          break;
        }
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` not found.`);
          break;
        }
        const reason = reasonParts.join(" ") || "Inventory adjustment via Telegram";
        const result = db.inventoryRepo.adjustStock(product.id, null, -qty, "ADJUSTMENT", "Telegram", reason, `Telegram:@${userName}`);
        await sendTelegramMessage(
          chatId,
          `✅ Stock subtracted for *${product.nameEn}* (\`${sku}\`):\n` +
          `• Subtracted: -${qty} units\n` +
          `• New Stock: *${result.newStock} units* (${result.availability})\n` +
          `• Reason: ${reason}`
        );
        db.telegramRepo.logAudit(userId, "/stocksub", `Subtracted ${qty} from ${sku}`);
        break;
      }

      case "/stockset": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/stockset <SKU> <Quantity> [Reason]`\nExample: `/stockset TRN-1001 120 Physical inventory recount`");
          break;
        }
        const [sku, qtyStr, ...reasonParts] = args;
        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty < 0) {
          await sendTelegramMessage(chatId, "❌ Quantity must be a non-negative integer.");
          break;
        }
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` not found.`);
          break;
        }
        const reason = reasonParts.join(" ") || "Direct inventory count via Telegram";
        db.inventoryRepo.updateStock(product.id, qty, reason, `Telegram:@${userName}`);
        await sendTelegramMessage(chatId, `✅ Stock overwritten for *${product.nameEn}* (\`${sku}\`): *${qty} units*`);
        db.telegramRepo.logAudit(userId, "/stockset", `Overwrote stock for ${sku} to ${qty}`);
        break;
      }

      case "/offers": {
        const { text: reply, keyboard } = getOffersMessage();
        await sendTelegramMessage(chatId, reply, keyboard);
        db.telegramRepo.logAudit(userId, "/offers");
        break;
      }

      case "/createoffer": {
        // One-shot: /createoffer <CODE> <DISCOUNT> [MIN_ORDER] [DAYS]
        if (args.length >= 2 && !isNaN(Number(args[1]))) {
          const code = args[0].toUpperCase();
          const discountVal = parseFloat(args[1]);
          const minOrder = args[2] ? parseFloat(args[2]) : 499;
          const days = args[3] ? parseInt(args[3], 10) : 30;

          const now = new Date();
          const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

          const newCamp = db.campaignsRepo.create({
            name: `${code} Promotion`,
            code,
            discountType: "PERCENTAGE",
            discountValue: discountVal,
            minOrderValue: minOrder,
            maxDiscount: 1000,
            startDate: now.toISOString(),
            endDate: endDate.toISOString(),
            isActive: 1,
            bannerText: `Get ${discountVal}% off on orders above ₹${minOrder}!`,
          });
          await sendTelegramMessage(
            chatId,
            `✅ Offer created successfully!\n\n• Code: \`${newCamp.code}\`\n• Discount: *${discountVal}%*\n• Min Order: ₹${minOrder}\n• Valid for: ${days} days`
          );
          db.telegramRepo.logAudit(userId, "/createoffer", `Created offer ${code}`);
          break;
        }

        // Start guided wizard
        setSession(userId, { command: "createoffer", step: 1, data: {} });
        await sendTelegramMessage(
          chatId,
          `🎉 *Create Festival Offer (Step 1/4)*\n\nPlease enter the coupon code (e.g. DIWALI25, PONGAL20):`
        );
        break;
      }

      case "/disableoffer": {
        if (!args[0]) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/disableoffer <CouponCode>` (e.g. `/disableoffer PONGAL15`)");
          break;
        }
        const code = args[0];
        const campaign = db.campaignsRepo.getByCode(code);
        if (!campaign) {
          await sendTelegramMessage(chatId, `❌ Coupon \`${code}\` not found.`);
          break;
        }
        db.campaignsRepo.toggle(campaign.id, false);
        await sendTelegramMessage(chatId, `✅ Offer *${campaign.name}* (\`${campaign.code}\`) has been *DEACTIVATED*.`);
        db.telegramRepo.logAudit(userId, "/disableoffer", `Disabled ${code}`);
        break;
      }

      case "/toggle_offer": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/toggle_offer <CouponCode> <on|off>`");
          break;
        }
        const [code, state] = args;
        const campaign = db.campaignsRepo.getByCode(code);
        if (!campaign) {
          await sendTelegramMessage(chatId, `❌ Coupon \`${code}\` not found.`);
          break;
        }
        const activate = state.toLowerCase() === "on";
        db.campaignsRepo.toggle(campaign.id, activate);
        await sendTelegramMessage(chatId, `✅ Offer *${campaign.name}* (\`${campaign.code}\`) is now *${activate ? "ACTIVE" : "DEACTIVATED"}*`);
        db.telegramRepo.logAudit(userId, "/toggle_offer", `Toggled ${code} to ${activate}`);
        break;
      }

      case "/customers": {
        const { text: reply, keyboard } = getCustomersSummaryMessage();
        await sendTelegramMessage(chatId, reply, keyboard);
        db.telegramRepo.logAudit(userId, "/customers");
        break;
      }

      case "/admins": {
        const admins = db.telegramRepo.getAllAdmins();
        const envAdmins = [
          ...(process.env.TELEGRAM_ALLOWED_ADMIN_IDS || "").split(","),
          ...(process.env.TELEGRAM_ADMIN_IDS || "").split(",")
        ].map(s => s.trim()).filter(Boolean);

        let reply = `👤 *AUTHORIZED TELEGRAM ADMINS:*\n\n`;
        if (admins.length > 0) {
          reply += `*Database Allowlist:*\n`;
          for (const a of admins) {
            reply += `• ID: \`${a.telegramId}\` — ${a.name} (${a.role})\n`;
          }
        }
        if (envAdmins.length > 0) {
          reply += `\n*Environment Allowlist (TELEGRAM_ALLOWED_ADMIN_IDS):*\n`;
          for (const id of envAdmins) {
            reply += `• ID: \`${id}\` (System Admin)\n`;
          }
        }
        await sendTelegramMessage(chatId, reply);
        db.telegramRepo.logAudit(userId, "/admins");
        break;
      }

      case "/audit": {
        const logs = db.telegramRepo.getAuditLogs(10);
        let reply = `📋 *RECENT TELEGRAM AUDIT LOGS:*\n\n`;
        for (const l of logs) {
          reply += `• [${new Date(l.createdAt).toLocaleTimeString()}] User \`${l.telegramUserId}\`: *${l.command}* ${l.details || ""}\n`;
        }
        await sendTelegramMessage(chatId, reply);
        break;
      }

      default:
        await sendTelegramMessage(chatId, `❓ Unknown command \`${command}\`. Type \`/help\` to see the full list of available commands.`);
    }
  } catch (err: any) {
    console.error("[Telegram Bot Error]", err);
    await sendTelegramMessage(chatId, `⚠️ Error executing command: ${err.message}`);
  }

  return { ok: true };
}

// ==========================================
// 7. INTERACTIVE SESSION HANDLERS
// ==========================================

async function handleActiveSession(chatId: string | number, userId: string, userName: string, text: string, session: ConversationSession) {
  if (session.command === "addproduct") {
    switch (session.step) {
      case 1: {
        session.data.nameEn = text;
        session.step = 2;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🌿 *Add New Product (Step 2/7)*\nEnter Tamil Name (தமிழ் பெயர், e.g. வேப்பிலை பொடி):`);
        return { ok: true };
      }
      case 2: {
        session.data.nameTa = text;
        session.step = 3;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🌿 *Add New Product (Step 3/7)*\nEnter Unique SKU (e.g. TRN-1205):`);
        return { ok: true };
      }
      case 3: {
        const sku = text.toUpperCase().trim();
        const existing = db.productsRepo.getBySku(sku);
        if (existing) {
          await sendTelegramMessage(chatId, `❌ SKU \`${sku}\` already exists! Please enter a unique SKU:`);
          return { ok: true };
        }
        session.data.sku = sku;
        session.step = 4;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🌿 *Add New Product (Step 4/7)*\nEnter Category Name (e.g. Health Care, Herbal Powders):`);
        return { ok: true };
      }
      case 4: {
        const catName = text.trim();
        const cats = db.categoriesRepo.getAll();
        const matched = cats.find(c => c.name.toLowerCase().includes(catName.toLowerCase()));
        session.data.categoryId = matched?.id || cats[0]?.id || null;
        session.step = 5;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🌿 *Add New Product (Step 5/7)*\nEnter Selling Price in ₹ (e.g. 150):`);
        return { ok: true };
      }
      case 5: {
        const price = parseFloat(text);
        if (isNaN(price) || price <= 0) {
          await sendTelegramMessage(chatId, `❌ Invalid price! Enter a valid positive number in ₹:`);
          return { ok: true };
        }
        session.data.sellingPrice = price;
        session.step = 6;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🌿 *Add New Product (Step 6/7)*\nEnter MRP in ₹ (e.g. 180):`);
        return { ok: true };
      }
      case 6: {
        const mrp = parseFloat(text);
        if (isNaN(mrp) || mrp <= 0) {
          await sendTelegramMessage(chatId, `❌ Invalid MRP! Enter a valid positive number in ₹:`);
          return { ok: true };
        }
        session.data.mrp = mrp;
        session.step = 7;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🌿 *Add New Product (Step 7/7)*\nEnter Initial Stock quantity in units (e.g. 100):`);
        return { ok: true };
      }
      case 7: {
        const stock = parseInt(text, 10);
        if (isNaN(stock) || stock < 0) {
          await sendTelegramMessage(chatId, `❌ Invalid stock quantity! Enter a non-negative integer:`);
          return { ok: true };
        }
        session.data.stock = stock;

        // Create product
        const newProd = db.productsRepo.create({
          sku: session.data.sku,
          nameEn: session.data.nameEn,
          nameTa: session.data.nameTa,
          categoryId: session.data.categoryId,
          sellingPrice: session.data.sellingPrice,
          mrp: session.data.mrp,
          stock: session.data.stock,
          status: "Published",
        });

        clearSession(userId);
        await sendTelegramMessage(
          chatId,
          `🎉 *Product Created Successfully!*\n\n` +
          `• *Name:* ${newProd.nameEn} (${newProd.nameTa})\n` +
          `• *SKU:* \`${newProd.sku}\`\n` +
          `• *Price:* ₹${newProd.price} (MRP: ₹${newProd.compareAt || newProd.price})\n` +
          `• *Initial Stock:* ${newProd.stock} units\n` +
          `• *Status:* Published in live store`
        );
        db.telegramRepo.logAudit(userId, "/addproduct", `Guided creation of ${newProd.sku}`);
        return { ok: true };
      }
    }
  } else if (session.command === "createoffer") {
    switch (session.step) {
      case 1: {
        session.data.code = text.toUpperCase().trim();
        session.step = 2;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🎉 *Create Festival Offer (Step 2/4)*\nEnter Discount percentage (e.g. 15 for 15%):`);
        return { ok: true };
      }
      case 2: {
        const discountVal = parseFloat(text);
        if (isNaN(discountVal) || discountVal <= 0 || discountVal > 90) {
          await sendTelegramMessage(chatId, `❌ Enter a valid discount percentage (between 1 and 90):`);
          return { ok: true };
        }
        session.data.discountValue = discountVal;
        session.step = 3;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🎉 *Create Festival Offer (Step 3/4)*\nEnter Minimum Cart Value in ₹ (e.g. 499):`);
        return { ok: true };
      }
      case 3: {
        const minOrder = parseFloat(text);
        if (isNaN(minOrder) || minOrder < 0) {
          await sendTelegramMessage(chatId, `❌ Enter a valid minimum cart value:`);
          return { ok: true };
        }
        session.data.minOrderValue = minOrder;
        session.step = 4;
        setSession(userId, session);
        await sendTelegramMessage(chatId, `🎉 *Create Festival Offer (Step 4/4)*\nEnter validity in Days (e.g. 30):`);
        return { ok: true };
      }
      case 4: {
        const days = parseInt(text, 10);
        if (isNaN(days) || days <= 0) {
          await sendTelegramMessage(chatId, `❌ Enter a valid number of days:`);
          return { ok: true };
        }
        const now = new Date();
        const endDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

        const newCamp = db.campaignsRepo.create({
          name: `${session.data.code} Special`,
          code: session.data.code,
          discountType: "PERCENTAGE",
          discountValue: session.data.discountValue,
          minOrderValue: session.data.minOrderValue,
          maxDiscount: 1000,
          startDate: now.toISOString(),
          endDate: endDate.toISOString(),
          isActive: 1,
          bannerText: `Enjoy ${session.data.discountValue}% off on botanical wellness!`,
        });

        clearSession(userId);
        await sendTelegramMessage(
          chatId,
          `🎉 *Festival Offer Created Successfully!*\n\n` +
          `• *Code:* \`${newCamp.code}\`\n` +
          `• *Discount:* ${session.data.discountValue}%\n` +
          `• *Min Order:* ₹${session.data.minOrderValue}\n` +
          `• *Valid until:* ${endDate.toLocaleDateString()}`
        );
        db.telegramRepo.logAudit(userId, "/createoffer", `Guided creation of ${newCamp.code}`);
        return { ok: true };
      }
    }
  }

  return { ok: true };
}

// ==========================================
// 8. HELPERS & FORMATTERS
// ==========================================

function formatOrderDetails(order: any): string {
  const maskedPhone = maskPhone(order.customerPhone);
  const maskedEmail = maskEmail(order.customerEmail);
  const addressPreview = maskAddress(order.shippingAddress);

  let detail = `📦 *ORDER ${order.orderNumber}*\n\n` +
    `• Status: *${order.orderStatus}*\n` +
    `• Payment: *${order.paymentStatus}* (${order.paymentMethod})\n` +
    `• Customer: ${order.customerName}\n` +
    `• Phone: ${maskedPhone}\n` +
    `• Email: ${maskedEmail}\n` +
    `• Destination: ${addressPreview}\n` +
    `• Subtotal: ₹${order.subtotal} | Shipping: ₹${order.shippingFee} | Total: ₹${order.total}\n` +
    `• Date: ${new Date(order.createdAt).toLocaleString()}\n\n` +
    `*Items:*\n`;

  for (const it of order.items || []) {
    detail += `  - ${it.productNameEn} (${it.packSize}) × ${it.quantity} = ₹${it.subtotal}\n`;
  }

  return detail;
}

function formatProductDetails(product: any): string {
  return `🌿 *${product.nameEn}* (${product.nameTa || ""})\n` +
    `• SKU: \`${product.sku}\`\n` +
    `• Category: ${product.category || "Herbs"}\n` +
    `• Selling Price: ₹${product.price} (MRP: ₹${product.compareAt || product.price})\n` +
    `• Current Stock: *${product.stock} units* (${product.stockAvailability})\n` +
    `• Status: ${product.status}`;
}

function getOrderStatusKeyboard(order: any) {
  const status = order.orderStatus;
  const num = order.orderNumber;
  const buttons: any[] = [];

  if (status === "Pending Payment") {
    buttons.push([{ text: "❌ Cancel Order", callback_data: `set_status:${num}:Cancelled` }]);
  } else if (status === "Confirmed") {
    buttons.push([{ text: "⚙️ Processing", callback_data: `set_status:${num}:Processing` }]);
    buttons.push([{ text: "❌ Cancel Order", callback_data: `set_status:${num}:Cancelled` }]);
  } else if (status === "Processing") {
    buttons.push([{ text: "📦 Packed", callback_data: `set_status:${num}:Packed` }]);
    buttons.push([{ text: "❌ Cancel Order", callback_data: `set_status:${num}:Cancelled` }]);
  } else if (status === "Packed") {
    buttons.push([{ text: "🚚 Shipped", callback_data: `set_status:${num}:Shipped` }]);
    buttons.push([{ text: "❌ Cancel Order", callback_data: `set_status:${num}:Cancelled` }]);
  } else if (status === "Shipped") {
    buttons.push([{ text: "🛵 Out for Delivery", callback_data: `set_status:${num}:Out for Delivery` }]);
    buttons.push([{ text: "🎉 Delivered", callback_data: `set_status:${num}:Delivered` }]);
    buttons.push([{ text: "❌ Cancel Order", callback_data: `set_status:${num}:Cancelled` }]);
  } else if (status === "Out for Delivery") {
    buttons.push([{ text: "🎉 Delivered", callback_data: `set_status:${num}:Delivered` }]);
    buttons.push([{ text: "❌ Cancel Order", callback_data: `set_status:${num}:Cancelled` }]);
  } else {
    buttons.push([{ text: "ℹ️ Order is terminal (no updates)", callback_data: "cancel_action" }]);
  }

  buttons.push([{ text: "🚫 Cancel", callback_data: "cancel_action" }]);
  return { inline_keyboard: buttons };
}

function validateStatusTransition(currentStatus: string, targetStatus: string): string | null {
  if (currentStatus === targetStatus) {
    return `Order is already in ${currentStatus} status.`;
  }
  if (currentStatus === "Delivered" || currentStatus === "Cancelled" || currentStatus === "Refunded") {
    return `Order is ${currentStatus} and cannot be modified.`;
  }
  const allowedMap: Record<string, string[]> = {
    "Pending Payment": ["Cancelled"],
    "Confirmed": ["Processing", "Packed", "Shipped", "Cancelled"],
    "Processing": ["Packed", "Shipped", "Cancelled"],
    "Packed": ["Shipped", "Cancelled"],
    "Shipped": ["Out for Delivery", "Delivered", "Cancelled"],
    "Out for Delivery": ["Delivered", "Cancelled"],
  };
  const allowed = allowedMap[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    return `Cannot transition from "${currentStatus}" to "${targetStatus}". Allowed: ${allowed.join(", ")}`;
  }
  return null;
}
