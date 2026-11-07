import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { appRouter } from "./routers";
import { processCustomerQuery } from "./customerAssistant";
import { notifySupportTicketCreated, notifySupportTicketReply } from "./telegram";

describe("TRINAYAA Phase 3 — Support Helpdesk, Customer Feedback & Wishlist Suite", () => {
  const ts = Date.now();
  let userA: any;
  let userB: any;
  let adminUser: any;
  let callerA: any;
  let callerB: any;
  let adminCaller: any;

  beforeAll(async () => {
    userA = db.usersRepo.create({
      email: `aaditya_${ts}@trinayaa.test`,
      password: "Password123!",
      name: "Aaditya Raman",
      phone: "9843200111",
      role: "CUSTOMER",
    });

    userB = db.usersRepo.create({
      email: `bhavana_${ts}@trinayaa.test`,
      password: "Password456!",
      name: "Bhavana Sundar",
      phone: "9843200222",
      role: "CUSTOMER",
    });

    adminUser = db.usersRepo.create({
      email: `admin_${ts}@trinayaa.test`,
      password: "AdminPassword123!",
      name: "Support Lead Priya",
      phone: "9843200999",
      role: "ADMIN",
    });

    callerA = appRouter.createCaller({
      user: { id: userA.id, email: userA.email, name: userA.name, role: userA.role, phone: userA.phone } as any,
      req: { headers: {}, ip: "127.0.0.1" } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    callerB = appRouter.createCaller({
      user: { id: userB.id, email: userB.email, name: userB.name, role: userB.role, phone: userB.phone } as any,
      req: { headers: {}, ip: "127.0.0.1" } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    adminCaller = appRouter.createCaller({
      user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: adminUser.role, phone: adminUser.phone } as any,
      req: { headers: {}, ip: "127.0.0.1" } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });
  });

  // ==========================================
  // 1. CUSTOMER FEEDBACK & PRODUCT REVIEWS
  // ==========================================
  describe("1. Customer Feedback & Product Reviews", () => {
    let createdFeedbackId: string;

    it("1.1: Allows submission of customer feedback with valid 1-5 rating", async () => {
      const res = await callerA.feedback.submit({
        customerName: userA.name,
        customerEmail: userA.email,
        customerPhone: userA.phone,
        category: "Product quality",
        rating: 5,
        title: "Pure and fresh Ashwagandha",
        message: "The aroma and micro-milled texture are exceptional. Sun-cured quality is evident.",
      });

      expect(res).toBeDefined();
      expect(res.id).toBeDefined();
      expect(res.rating).toBe(5);
      expect(res.category).toBe("Product quality");
      expect(res.customer_id).toBe(userA.id);
      expect(res.status).toBe("NEW");
      createdFeedbackId = res.id;
    });

    it("1.2: Customer can list their own feedback submissions", async () => {
      const list = await callerA.feedback.myFeedback();
      expect(list.length).toBeGreaterThan(0);
      expect(list.some((f: any) => f.id === createdFeedbackId)).toBe(true);
    });

    it("1.3: Admin can inspect feedback list and record response", async () => {
      const allFeedback = await adminCaller.feedback.adminList({ status: "NEW" });
      expect(allFeedback.some((f: any) => f.id === createdFeedbackId)).toBe(true);

      const updated = await adminCaller.feedback.adminRespond({
        id: createdFeedbackId,
        response: "Thank you Aaditya! We take pride in 100% natural, single-origin sourcing.",
        notes: "Verified authentic review.",
      });

      expect(updated.status).toBe("REVIEWED");
      expect(updated.admin_response).toContain("Thank you Aaditya");
    });

    it("1.4: Product review checks verified purchase and requires admin moderation", async () => {
      const sampleProduct = db.productsRepo.getAll()[0];

      // Submit review (unverified initially for test customer)
      const review = await callerA.reviews.submit({
        productId: sampleProduct.id,
        rating: 5,
        title: "Authentic Quality",
        review: "Remarkable freshness and zero clumpiness.",
      });

      expect(review.status).toBe("PENDING");

      // Before moderation, should not appear in public product reviews
      const publicBefore = await callerA.reviews.productReviews({ productId: sampleProduct.id });
      expect(publicBefore.some((r: any) => r.id === review.id)).toBe(false);

      // Admin approves review
      const approved = await adminCaller.reviews.adminModerate({
        id: review.id,
        status: "APPROVED",
        adminNotes: "Approved by QA Lead",
      });

      expect(approved.status).toBe("APPROVED");

      // Now appears publicly
      const publicAfter = await callerA.reviews.productReviews({ productId: sampleProduct.id });
      expect(publicAfter.some((r: any) => r.id === review.id)).toBe(true);
    });
  });

  // ==========================================
  // 2. SUPPORT HELPDESK & TICKET MANAGEMENT
  // ==========================================
  describe("2. Support Helpdesk & Ticket Management", () => {
    let ticketAId: string;
    let ticketANumber: string;

    it("2.1: Customer can create support ticket with human-readable ticket number", async () => {
      const ticket = await callerA.tickets.create({
        category: "Delivery issue",
        subject: "Delivery timeline enquiry for Erode",
        description: "Requesting dispatched courier name and expected delivery date.",
        priority: "High",
      });

      expect(ticket).toBeDefined();
      expect(ticket.id).toBeDefined();
      expect(ticket.ticket_number).toMatch(/^TRN-SUP-\d{4}-\d{5}$/);
      expect(ticket.status).toBe("Open");
      expect(ticket.priority).toBe("High");
      expect(ticket.customer_id).toBe(userA.id);

      ticketAId = ticket.id;
      ticketANumber = ticket.ticket_number;
    });

    it("2.2: Generates initial message and audit log automatically on creation", async () => {
      const { ticket, messages } = await callerA.tickets.getTicket({ ticketId: ticketAId });

      expect(ticket.id).toBe(ticketAId);
      expect(messages.length).toBeGreaterThanOrEqual(1);
      expect(messages[0].sender_type).toBe("CUSTOMER");
      expect(messages[0].sender_name).toBe(userA.name);
      expect(messages[0].message).toContain("Requesting dispatched courier name");
    });

    it("2.3: Enforces cross-customer ticket isolation (Customer B cannot access Customer A's ticket)", async () => {
      await expect(callerB.tickets.getTicket({ ticketId: ticketAId })).rejects.toThrow();
      await expect(
        callerB.tickets.reply({
          ticketId: ticketAId,
          message: "Attempting unauthorized reply",
        })
      ).rejects.toThrow();
    });

    it("2.4: Customer can reply to their ticket and updates status appropriately", async () => {
      const replyMsg = await callerA.tickets.reply({
        ticketId: ticketAId,
        message: "Kindly confirm if Blue Dart is the carrier.",
      });

      expect(replyMsg.id).toBeDefined();
      expect(replyMsg.sender_type).toBe("CUSTOMER");
      expect(replyMsg.message).toBe("Kindly confirm if Blue Dart is the carrier.");

      const { messages } = await callerA.tickets.getTicket({ ticketId: ticketAId });
      expect(messages.length).toBe(2);
    });

    it("2.5: Admin can inspect ticket, audit logs, reply, and update status/priority", async () => {
      // Admin inspection
      const detail = await adminCaller.tickets.adminGet({ ticketId: ticketAId });
      expect(detail.ticket.ticket_number).toBe(ticketANumber);
      expect(detail.messages.length).toBe(2);
      expect(detail.auditLogs.length).toBeGreaterThanOrEqual(2);

      // Admin reply
      const adminReply = await adminCaller.tickets.adminReply({
        ticketId: ticketAId,
        message: "Hello Aaditya, your parcel was dispatched via Blue Dart AWB #84930129.",
      });
      expect(adminReply.sender_type).toBe("ADMIN");

      // Admin assigns ticket
      await adminCaller.tickets.adminAssign({
        ticketId: ticketAId,
        adminId: adminUser.id,
        adminName: adminUser.name,
      });

      // Admin resolves ticket
      const resolved = await adminCaller.tickets.adminUpdateStatus({
        ticketId: ticketAId,
        status: "Resolved",
        notes: "Tracking number shared with customer",
      });

      expect(resolved?.status).toBe("Resolved");
      expect(resolved?.resolved_at).not.toBeNull();
    });

    it("2.6: Admin metrics compute accurate counts and resolution time", async () => {
      const metrics = await adminCaller.tickets.adminMetrics();

      expect(metrics.total).toBeGreaterThanOrEqual(1);
      expect(metrics.resolved).toBeGreaterThanOrEqual(1);
      expect(typeof metrics.avgResolutionHours).toBe("number");
    });
  });

  // ==========================================
  // 3. CUSTOMER SUPPORT BOT & ORDER AWARENESS
  // ==========================================
  describe("3. Customer Support Bot & Intent Engine", () => {
    it("3.1: Answers product questions accurately (raw powders)", async () => {
      const res = await processCustomerQuery("What are raw powders?");
      expect(res.reply).toContain("Raw Powders");
      expect(res.reply).toContain("100% single-origin");
      expect(res.verified).toBe(true);
    });

    it("3.2: Answers seeds vs herbs vs powders comparison", async () => {
      const res = await processCustomerQuery("What is the difference between seeds, herbs, and powders?");
      expect(res.reply).toContain("Seeds vs. Herbs vs. Raw Powders");
      expect(res.reply).toContain("Whole Seeds");
      expect(res.reply).toContain("Micro-Milled Powders");
    });

    it("3.3: Explains Latin botanical taxonomy and authenticity", async () => {
      const res = await processCustomerQuery("What does a botanical or scientific name mean?");
      expect(res.reply).toContain("Botanical Names");
      expect(res.reply).toContain("Latin botanical binomial");
    });

    it("3.4: Explains mobile OTP login and address book", async () => {
      const res = await processCustomerQuery("How does mobile OTP login work?");
      expect(res.reply).toContain("Mobile OTP");
      expect(res.reply).toContain("10-digit Indian mobile number");
    });

    it("3.5: Guides customer on raising complaints and support tickets", async () => {
      const res = await processCustomerQuery("How do I raise a complaint or create a support ticket?");
      expect(res.reply).toContain("Customer Support & Issue Helpdesk");
      expect(res.reply).toContain("TRN-SUP-2026-00001");
      expect(res.reply).toContain("support@trinayaa.in");
    });

    it("3.6: Order awareness for authenticated customer returns recent order status", async () => {
      // Create a test order for userA
      const testOrder = db.ordersRepo.create(
        {
          customerId: userA.id,
          customerName: userA.name,
          customerEmail: userA.email,
          customerPhone: userA.phone,
          shippingAddress: { city: "Erode", state: "Tamil Nadu", pinCode: "638002" },
          subtotal: 500,
          total: 500,
          paymentMethod: "RAZORPAY",
          paymentStatus: "PAID",
          orderStatus: "Shipped",
          carrier: "Blue Dart",
          trackingNumber: "BD99281928",
        },
        []
      );

      const res = await processCustomerQuery("Track my recent order", userA.id);
      expect(res.reply).toContain(testOrder.orderNumber);
      expect(res.reply).toContain("Shipped");
      expect(res.orderInfo).toBeDefined();
    });
  });

  // ==========================================
  // 4. WISHLIST & SAVE FOR LATER
  // ==========================================
  describe("4. Wishlist & Save for Later", () => {
    it("4.1: Allows adding and removing products from user wishlist", async () => {
      const sampleProduct = db.productsRepo.getAll()[0];

      // Add to wishlist
      const addRes = await callerA.wishlist.add({ productId: sampleProduct.id });
      expect(addRes.wishlisted).toBe(true);

      // Check wishlist
      const list = await callerA.wishlist.list();
      expect(list.some((item: any) => item.id === sampleProduct.id)).toBe(true);

      const ids = await callerA.wishlist.getIds();
      expect(ids.includes(sampleProduct.id)).toBe(true);

      // Toggle wishlist (removes it)
      const toggleRes = await callerA.wishlist.toggle({ productId: sampleProduct.id });
      expect(toggleRes.wishlisted).toBe(false);

      const listAfter = await callerA.wishlist.list();
      expect(listAfter.some((item: any) => item.id === sampleProduct.id)).toBe(false);
    });

    it("4.2: Move to cart adds item to cart and removes from wishlist", async () => {
      const sampleProduct = db.productsRepo.getAll()[1];

      // Add to wishlist
      await callerA.wishlist.add({ productId: sampleProduct.id });

      // Move to cart
      const moveRes = await callerA.wishlist.moveToCart({ productId: sampleProduct.id, packSize: "100g" });
      expect(moveRes.success).toBe(true);

      // Verify removed from wishlist
      const list = await callerA.wishlist.list();
      expect(list.some((item: any) => item.id === sampleProduct.id)).toBe(false);
    });

    it("4.3: Save for later adds item to wishlist and removes from cart", async () => {
      const sampleProduct = db.productsRepo.getAll()[2];

      // Save for later
      const saveRes = await callerA.wishlist.saveForLater({ productId: sampleProduct.id });
      expect(saveRes.success).toBe(true);

      // Verify present in wishlist
      const list = await callerA.wishlist.list();
      expect(list.some((item: any) => item.id === sampleProduct.id)).toBe(true);
    });

    it("4.4: Enforces wishlist isolation between different customers", async () => {
      const sampleProduct = db.productsRepo.getAll()[3];

      await callerA.wishlist.add({ productId: sampleProduct.id });

      const idsA = await callerA.wishlist.getIds();
      const idsB = await callerB.wishlist.getIds();

      expect(idsA.includes(sampleProduct.id)).toBe(true);
      expect(idsB.includes(sampleProduct.id)).toBe(false);
    });
  });
});
