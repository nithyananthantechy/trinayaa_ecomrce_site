/**
 * TRINAYAA E-COMMERCE NOTIFICATIONS SERVICE
 * 
 * Multi-channel customer notification architecture handling order lifecycle milestones:
 * - Order Placed / Created
 * - Payment Confirmed
 * - Payment Failed
 * - Order Shipped (with Carrier & Tracking URL)
 * - Out for Delivery
 * - Order Delivered
 * - Order Cancelled
 * - Order Refunded
 * 
 * Ready for immediate extension to Telegram Admin Bot (Phase 6), Email (Resend/SendGrid),
 * SMS (Twilio/Gupshup), and WhatsApp Business API.
 */

import { EventEmitter } from "node:events";

export type OrderNotificationEvent =
  | "ORDER_CREATED"
  | "PAYMENT_CONFIRMED"
  | "PAYMENT_FAILED"
  | "ORDER_SHIPPED"
  | "OUT_FOR_DELIVERY"
  | "ORDER_DELIVERED"
  | "ORDER_CANCELLED"
  | "ORDER_REFUNDED";

export interface NotificationPayload {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  total: number;
  items: Array<{
    productNameEn: string;
    productNameTa?: string;
    packSize: string;
    quantity: number;
    price: number;
  }>;
  trackingNumber?: string;
  carrier?: string;
  shippingAddress?: any;
  reason?: string;
  timestamp: string;
}

export interface DispatchedNotification {
  id: string;
  event: OrderNotificationEvent;
  orderNumber: string;
  recipientEmail: string;
  recipientPhone: string;
  subject: string;
  messageText: string;
  dispatchedAt: string;
  channel: "INTERNAL_LOG" | "EMAIL" | "SMS" | "WHATSAPP" | "TELEGRAM";
  status: "SENT" | "QUEUED" | "FAILED";
}

class NotificationService extends EventEmitter {
  private history: DispatchedNotification[] = [];

  constructor() {
    super();
    // Default logger subscriber
    this.on("notification", (notif: DispatchedNotification) => {
      console.log(`[TRINAYAA Notification][${notif.event}] Sent to ${notif.recipientEmail} (${notif.orderNumber}): ${notif.subject}`);
    });
  }

  public dispatch(event: OrderNotificationEvent, payload: NotificationPayload): DispatchedNotification {
    const { subject, messageText } = this.formatMessage(event, payload);

    const notification: DispatchedNotification = {
      id: "notif_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      event,
      orderNumber: payload.orderNumber,
      recipientEmail: payload.customerEmail,
      recipientPhone: payload.customerPhone,
      subject,
      messageText,
      dispatchedAt: new Date().toISOString(),
      channel: "INTERNAL_LOG",
      status: "SENT",
    };

    this.history.unshift(notification);
    // Keep last 100 notifications in memory
    if (this.history.length > 100) {
      this.history.pop();
    }

    this.emit("notification", notification);
    this.emit(event, payload);

    return notification;
  }

  public getRecent(limit = 20): DispatchedNotification[] {
    return this.history.slice(0, limit);
  }

  public getByOrderNumber(orderNumber: string): DispatchedNotification[] {
    return this.history.filter((n) => n.orderNumber.toUpperCase() === orderNumber.toUpperCase());
  }

  public clearHistory(): void {
    this.history = [];
  }

  private formatMessage(event: OrderNotificationEvent, p: NotificationPayload): { subject: string; messageText: string } {
    const itemCount = p.items?.reduce((acc, it) => acc + (it.quantity || 1), 0) || 0;
    const itemListStr = p.items?.map((it) => `- ${it.productNameEn} (${it.packSize}) × ${it.quantity}`).join("\n") || "";

    switch (event) {
      case "ORDER_CREATED":
        return {
          subject: `Order Received: ${p.orderNumber} - TRINAYAA Botanical Wellness`,
          messageText: `Vanakkam ${p.customerName},\n\nThank you for placing your order with TRINAYAA.\nOrder: ${p.orderNumber}\nItems (${itemCount}):\n${itemListStr}\nTotal Due: ₹${p.total}\nStatus: Pending Payment\n\nWe will confirm your order as soon as payment is verified.`,
        };

      case "PAYMENT_CONFIRMED":
        return {
          subject: `Order Confirmed: ${p.orderNumber} - Payment Verified`,
          messageText: `Vanakkam ${p.customerName},\n\nYour payment of ₹${p.total} for order ${p.orderNumber} has been verified successfully!\nOur team in Erode is carefully preparing your botanical wellness items.\n\nYou can track your shipment anytime at: /track-order`,
        };

      case "PAYMENT_FAILED":
        return {
          subject: `Payment Incomplete for Order ${p.orderNumber}`,
          messageText: `Vanakkam ${p.customerName},\n\nWe were unable to complete the payment for your order ${p.orderNumber}.\nReason: ${p.reason || "Transaction not authorized by gateway"}.\n\nYour selected items have been kept in your cart. You may retry payment at your convenience.`,
        };

      case "ORDER_SHIPPED":
        return {
          subject: `Shipped! Your TRINAYAA Order ${p.orderNumber} is on its way`,
          messageText: `Vanakkam ${p.customerName},\n\nYour package has been dispatched via ${p.carrier || "Standard Courier"}.\nTracking Number: ${p.trackingNumber || "Pending updates"}\n\nTrack your delivery in real-time: /track-order`,
        };

      case "OUT_FOR_DELIVERY":
        return {
          subject: `Out for Delivery: Order ${p.orderNumber}`,
          messageText: `Vanakkam ${p.customerName},\n\nYour TRINAYAA botanical parcel is out for delivery today to your address in ${p.shippingAddress?.city || "your city"}. Please keep your phone available.`,
        };

      case "ORDER_DELIVERED":
        return {
          subject: `Delivered: TRINAYAA Order ${p.orderNumber}`,
          messageText: `Vanakkam ${p.customerName},\n\nYour order ${p.orderNumber} has been delivered. May our authentic botanicals bring pure wellness into your home. Thank you for supporting true heritage!`,
        };

      case "ORDER_CANCELLED":
        return {
          subject: `Order Cancelled: ${p.orderNumber}`,
          messageText: `Vanakkam ${p.customerName},\n\nYour order ${p.orderNumber} has been cancelled.${p.reason ? ` Reason: ${p.reason}` : ""}\nIf payment was deducted, your refund will be processed within 5-7 business days.`,
        };

      case "ORDER_REFUNDED":
        return {
          subject: `Refund Processed for Order ${p.orderNumber}`,
          messageText: `Vanakkam ${p.customerName},\n\nA refund of ₹${p.total} has been issued for order ${p.orderNumber}. The funds will reflect in your original payment method in 3-5 business days.`,
        };

      default:
        return {
          subject: `Update on your TRINAYAA Order ${p.orderNumber}`,
          messageText: `Vanakkam ${p.customerName},\n\nThere is an update on order ${p.orderNumber}. Status: ${event}`,
        };
    }
  }
}

export const notificationsService = new NotificationService();
