import * as db from "./db";

export async function handleTelegramUpdate(update: any) {
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
    await sendTelegramMessage(chatId, `⛔ *Access Denied*\n\nYour Telegram ID \`${userId}\` is not authorized to manage TRINAYAA store.\nPlease contact the administrator to grant access.`);
    return { ok: true };
  }

  // 2. Parse command
  const [cmd, ...args] = text.split(/\s+/);
  const command = cmd.toLowerCase();

  try {
    switch (command) {
      case "/start":
      case "/help": {
        const helpText = `🌿 *TRINAYAA Enterprise Admin Bot*\n` +
          `Connected to Live Database & Service Layer\n\n` +
          `*Dashboard & Reports:*\n` +
          `• \`/stats\` — Store overview, orders & revenue\n` +
          `• \`/orders\` — View 5 most recent orders\n` +
          `• \`/order <ID>\` — Search order details (e.g. \`/order TRN-10482\`)\n` +
          `• \`/status <ID> <Status>\` — Update order status (Confirmed, Processing, Packed, Shipped, Delivered, Cancelled)\n\n` +
          `*Catalogue & Inventory:*\n` +
          `• \`/product <SKU/Name>\` — Search product details\n` +
          `• \`/stock <SKU> <Qty>\` — Update stock level (e.g. \`/stock TRN-1001 150\`)\n` +
          `• \`/price <SKU> <INR>\` — Update selling price (e.g. \`/price TRN-1001 180\`)\n\n` +
          `*Marketing & Offers:*\n` +
          `• \`/offers\` — View active festival campaigns\n` +
          `• \`/toggle_offer <Code> <on|off>\` — Activate/deactivate coupon\n\n` +
          `*Administration:*\n` +
          `• \`/admins\` — List authorized Telegram admins\n` +
          `• \`/audit\` — View recent admin audit logs`;
        await sendTelegramMessage(chatId, helpText);
        db.telegramRepo.logAudit(userId, "/help");
        break;
      }

      case "/stats":
      case "/dashboard": {
        const stats = db.adminStatsRepo.getOverview();
        const msg = `📊 *TRINAYAA STORE METRICS*\n\n` +
          `📦 *Products:*\n` +
          `• Total: ${stats.totalProducts}\n` +
          `• Active / Published: ${stats.activeProducts}\n` +
          `• Low-Stock Alerts (<10): *${stats.lowStockProducts}*\n\n` +
          `🛍️ *Orders:*\n` +
          `• Total Orders: ${stats.totalOrders}\n` +
          `• Pending / In-progress: ${stats.pendingOrders}\n` +
          `• Completed / Delivered: ${stats.completedOrders}\n\n` +
          `💰 *Verified Revenue:* ₹${stats.totalRevenue.toLocaleString("en-IN")}\n` +
          `🎉 *Active Festival Offers:* ${stats.activeCampaigns}`;
        await sendTelegramMessage(chatId, msg);
        db.telegramRepo.logAudit(userId, "/stats");
        break;
      }

      case "/orders":
      case "/recent": {
        const orders = db.ordersRepo.listAll({ limit: 5 });
        if (orders.length === 0) {
          await sendTelegramMessage(chatId, "No orders found in database.");
          break;
        }
        let reply = `📦 *RECENT ORDERS:*\n\n`;
        for (const o of orders) {
          reply += `• *${o.orderNumber}* — ₹${o.total} (${o.orderStatus})\n` +
                   `  Customer: ${o.customerName} (${o.customerPhone})\n` +
                   `  Payment: ${o.paymentStatus} via ${o.paymentMethod}\n\n`;
        }
        await sendTelegramMessage(chatId, reply);
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
        let detail = `📦 *ORDER ${order.orderNumber}*\n\n` +
          `• Status: *${order.orderStatus}*\n` +
          `• Payment: *${order.paymentStatus}* (${order.paymentMethod})\n` +
          `• Customer: ${order.customerName}\n` +
          `• Phone: ${order.customerPhone}\n` +
          `• Subtotal: ₹${order.subtotal} | Total: ₹${order.total}\n` +
          `• Date: ${new Date(order.createdAt).toLocaleString()}\n\n` +
          `*Items:*\n`;
        for (const it of order.items) {
          detail += `  - ${it.productNameEn} (${it.packSize}) × ${it.quantity} = ₹${it.subtotal}\n`;
        }
        await sendTelegramMessage(chatId, detail);
        db.telegramRepo.logAudit(userId, "/order", `Looked up ${args[0]}`);
        break;
      }

      case "/status": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/status <OrderNumber> <NewStatus>`\nAllowed statuses: Confirmed, Processing, Packed, Shipped, Delivered, Cancelled");
          break;
        }
        const [orderNum, ...statusParts] = args;
        const newStatus = statusParts.join(" ");
        const order = db.ordersRepo.getByOrderNumber(orderNum);
        if (!order) {
          await sendTelegramMessage(chatId, `❌ Order \`${orderNum}\` not found.`);
          break;
        }
        db.ordersRepo.updateStatus(order.id, newStatus, `Updated via Telegram Bot by @${userName}`, `Telegram:@${userName}`);
        await sendTelegramMessage(chatId, `✅ Order *${order.orderNumber}* status updated to *${newStatus}*`);
        db.telegramRepo.logAudit(userId, "/status", `Updated ${order.orderNumber} to ${newStatus}`);
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
        const reply = `🌿 *${product.nameEn}* (${product.nameTa || ""})\n` +
          `• SKU: \`${product.sku}\`\n` +
          `• Category: ${product.category}\n` +
          `• Selling Price: ₹${product.price} (MRP: ₹${product.compareAt || product.price})\n` +
          `• Current Stock: *${product.stock} units* (${product.stockAvailability})\n` +
          `• Status: ${product.status}`;
        await sendTelegramMessage(chatId, reply);
        db.telegramRepo.logAudit(userId, "/product", `Searched ${query}`);
        break;
      }

      case "/stock": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/stock <SKU> <Quantity>` (e.g. `/stock TRN-1001 150`)");
          break;
        }
        const [sku, qtyStr] = args;
        const qty = parseInt(qtyStr, 10);
        if (isNaN(qty) || qty < 0) {
          await sendTelegramMessage(chatId, "❌ Invalid stock quantity. Must be a positive integer.");
          break;
        }
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` not found.`);
          break;
        }
        db.productsRepo.updateStock(product.id, qty);
        await sendTelegramMessage(chatId, `✅ Stock updated for *${product.nameEn}* (\`${sku}\`): *${qty} units*`);
        db.telegramRepo.logAudit(userId, "/stock", `Updated stock for ${sku} to ${qty}`);
        break;
      }

      case "/price": {
        if (args.length < 2) {
          await sendTelegramMessage(chatId, "⚠️ Usage: `/price <SKU> <NewPrice>` (e.g. `/price TRN-1001 175`)");
          break;
        }
        const [sku, priceStr] = args;
        const price = parseFloat(priceStr);
        if (isNaN(price) || price <= 0) {
          await sendTelegramMessage(chatId, "❌ Invalid price. Must be a positive number.");
          break;
        }
        const product = db.productsRepo.getBySku(sku);
        if (!product) {
          await sendTelegramMessage(chatId, `❌ Product with SKU \`${sku}\` not found.`);
          break;
        }
        db.productsRepo.updatePrice(product.id, price);
        await sendTelegramMessage(chatId, `✅ Price updated for *${product.nameEn}* (\`${sku}\`): *₹${price}*`);
        db.telegramRepo.logAudit(userId, "/price", `Updated price for ${sku} to ₹${price}`);
        break;
      }

      case "/offers": {
        const campaigns = db.campaignsRepo.getActive();
        if (campaigns.length === 0) {
          await sendTelegramMessage(chatId, "No active festival campaigns currently running.");
          break;
        }
        let reply = `🎉 *ACTIVE FESTIVAL OFFERS:*\n\n`;
        for (const c of campaigns) {
          reply += `• *${c.name}* (Code: \`${c.code}\`)\n` +
                   `  Discount: ${c.discountType === "PERCENTAGE" ? `${c.discountValue}%` : `₹${c.discountValue}`}\n` +
                   `  Min Order: ₹${c.minOrderValue} | Max Discount: ₹${c.maxDiscount}\n` +
                   `  Valid until: ${new Date(c.endDate).toLocaleDateString()}\n\n`;
        }
        await sendTelegramMessage(chatId, reply);
        db.telegramRepo.logAudit(userId, "/offers");
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

      case "/admins": {
        const admins = db.telegramRepo.getAllAdmins();
        let reply = `👤 *AUTHORIZED TELEGRAM ADMINS:*\n\n`;
        for (const a of admins) {
          reply += `• ID: \`${a.telegramId}\` — ${a.name} (${a.role})\n`;
        }
        await sendTelegramMessage(chatId, reply);
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

export async function sendTelegramMessage(chatId: string | number, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || token.includes("PLACEHOLDER")) {
    console.log(`[Telegram Bot Simulation -> Chat ${chatId}]:\n${text}\n`);
    return;
  }

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: "Markdown",
      }),
    });
  } catch (error) {
    console.error("[Telegram Send Error]:", error);
  }
}

