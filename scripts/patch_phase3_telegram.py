import os

TELEGRAM_PATH = os.path.join(os.path.dirname(__file__), "..", "server", "telegram.ts")

functions_code = """
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

    const text = `${icon} *SUPPORT ALERT: NEW TICKET*\n\n` +
      `• *Ticket:* \`${ticket.ticketNumber}\`\n` +
      `• *Category:* ${ticket.category}\n` +
      `• *Priority:* *${ticket.priority.toUpperCase()}*\n` +
      `• *Subject:* ${ticket.subject}\n` +
      `• *Customer:* ${ticket.customerName}\n` +
      `• *Time:* ${new Date().toLocaleTimeString()}\n\n` +
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

    const text = `${icon} *SUPPORT TICKET UPDATE*\n\n` +
      `• *Ticket:* \`${ticket.ticketNumber}\`\n` +
      `• *Subject:* ${ticket.subject}\n` +
      `• *Reply by:* ${ticket.senderName} (${ticket.senderType})\n` +
      `• *Message:* _"${snippet}"_\n` +
      `• *Time:* ${new Date().toLocaleTimeString()}`;

    for (const adminId of allowedIds) {
      await sendTelegramMessage(adminId, text);
    }
  } catch (err) {
    console.error("[Telegram Ticket Reply Alert Error]:", err);
  }
}
"""

with open(TELEGRAM_PATH, "r", encoding="utf-8") as f:
    content = f.read()

if "notifySupportTicketCreated" not in content:
    target = "export function initTelegramNotifications() {"
    idx = content.find(target)
    # find closing brace of initTelegramNotifications
    closing = content.find("// ==========================================\n// 4B. TELEGRAM LONG POLLING SERVICE", idx)
    if closing != -1:
        new_content = content[:closing] + functions_code + "\n" + content[closing:]
        with open(TELEGRAM_PATH, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("Added support ticket notifications to server/telegram.ts")
    else:
        with open(TELEGRAM_PATH, "a", encoding="utf-8") as f:
            f.write(functions_code)
        print("Appended support ticket notifications to server/telegram.ts")
else:
    print("Support ticket notifications already present in server/telegram.ts")
