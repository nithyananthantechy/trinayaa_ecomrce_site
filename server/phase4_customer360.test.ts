import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import * as db from "./db";

describe("TRINAYAA Phase 4 — Admin Customer 360, Profiles, Search, Filters & Order History Suite", () => {
  const ts = Date.now();
  let adminUser: any;
  let adminCaller: any;
  let customerA: any;
  let customerB: any;
  let customerC: any;
  let regularCustomerCaller: any;

  const publicCaller = appRouter.createCaller({
    user: null as any,
    session: null as any,
    req: { socket: { remoteAddress: `127.0.0.${ts % 200}` } } as any,
    res: { cookie: () => {}, clearCookie: () => {} } as any,
  });

  beforeAll(async () => {
    // 1. Admin account
    adminUser = db.usersRepo.create({
      email: `admin_p4_${ts}@trinayaa.test`,
      password: "AdminPassword123!",
      name: "Super Admin P4",
      phone: "9876543210",
      role: "ADMIN",
    });

    adminCaller = appRouter.createCaller({
      user: { id: adminUser.id, email: adminUser.email, name: adminUser.name, role: "ADMIN" } as any,
      session: { openId: adminUser.id } as any,
      req: { socket: { remoteAddress: "127.0.0.1" } } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    // 2. Customer A (With verified paid orders & saved address)
    customerA = db.usersRepo.create({
      email: `cust_a_${ts}@trinayaa.test`,
      password: "CustomerPassword123!",
      name: "Ananya Subramanian",
      phone: "9840111222",
      role: "CUSTOMER",
    });

    regularCustomerCaller = appRouter.createCaller({
      user: { id: customerA.id, email: customerA.email, name: customerA.name, role: "CUSTOMER" } as any,
      session: { openId: customerA.id } as any,
      req: { socket: { remoteAddress: "127.0.0.2" } } as any,
      res: { cookie: () => {}, clearCookie: () => {} } as any,
    });

    // Saved address for Customer A
    db.addressesRepo.create(customerA.id, {
      recipientName: "Ananya Subramanian",
      phone: "9840111222",
      street: "Flat 4A, Green Garden Apartments, Anna Nagar",
      city: "Chennai",
      state: "Tamil Nadu",
      pinCode: "600040",
      isDefault: true,
    });

    // Order 1 for Customer A: PAID & Delivered (Net revenue)
    const order1Id = `ord_test_p4_1_${ts}`;
    const rawDb = db.getDatabase();
    rawDb.prepare(`
      INSERT INTO orders (
        id, orderNumber, customerId, customerName, customerEmail, customerPhone,
        shippingAddress, subtotal, discountAmount, shippingFee, total,
        paymentMethod, paymentStatus, orderStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order1Id,
      `TRN-P4-${ts}-1`,
      customerA.id,
      customerA.name,
      customerA.email,
      customerA.phone,
      "Anna Nagar, Chennai",
      1200,
      100,
      50,
      1150,
      "RAZORPAY",
      "PAID",
      "Delivered",
      new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );

    // Order 1 line item
    rawDb.prepare(`
      INSERT INTO order_items (
        id, orderId, productId, productNameEn, productNameTa, packSize, price, quantity, subtotal, image
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      `oi_${ts}_1`,
      order1Id,
      "TRN-1001",
      "Amla Powder",
      "நெல்லிக்காய் பொடி",
      "100g",
      250,
      2,
      500,
      "/images/products/generated/TRN-1001.webp"
    );

    // Order 2 for Customer A: Cancelled (Should NOT count toward verified net revenue)
    const order2Id = `ord_test_p4_2_${ts}`;
    rawDb.prepare(`
      INSERT INTO orders (
        id, orderNumber, customerId, customerName, customerEmail, customerPhone,
        shippingAddress, subtotal, discountAmount, shippingFee, total,
        paymentMethod, paymentStatus, orderStatus, createdAt, updatedAt
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order2Id,
      `TRN-P4-${ts}-2`,
      customerA.id,
      customerA.name,
      customerA.email,
      customerA.phone,
      "Anna Nagar, Chennai",
      800,
      0,
      50,
      850,
      "COD",
      "PENDING",
      "Cancelled",
      new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      new Date().toISOString()
    );

    // Feedback for Customer A
    db.feedbackRepo.create({
      customerId: customerA.id,
      customerName: customerA.name,
      customerEmail: customerA.email,
      customerPhone: customerA.phone,
      category: "PRODUCT_QUALITY",
      rating: 5,
      title: "Excellent botanical quality",
      message: "The Amla powder freshness is outstanding. Highly recommended!",
    });

    // Review for Customer A
    db.reviewsRepo.create({
      productId: "TRN-1001",
      customerId: customerA.id,
      customerName: customerA.name,
      rating: 5,
      title: "Pure & Organic",
      review: "Very pure amla powder, completely organic aroma.",
    });

    // Support Ticket for Customer A
    db.ticketsRepo.create({
      customerId: customerA.id,
      customerName: customerA.name,
      customerEmail: customerA.email,
      customerPhone: customerA.phone,
      category: "DELIVERY",
      subject: "Courier delivery tracking",
      description: "Can you provide the courier tracking link for my order?",
      priority: "MEDIUM",
    });

    // Wishlist item for Customer A
    db.wishlistRepo.add(customerA.id, "TRN-1002");

    // 3. Customer B (Without orders - Formula injection test name)
    customerB = db.usersRepo.create({
      email: `cust_b_${ts}@trinayaa.test`,
      password: "CustomerPassword456!",
      name: "=SUM(1+2) Security Test",
      phone: "9440222333",
      role: "CUSTOMER",
    });

    // 4. Customer C (Deactivated account test)
    customerC = db.usersRepo.create({
      email: `cust_c_${ts}@trinayaa.test`,
      password: "CustomerPassword789!",
      name: "Karthik Deactivation Target",
      phone: "9123456789",
      role: "CUSTOMER",
    });
  });

  // ==========================================
  // 1. CUSTOMER SEARCH, FILTERS & PAGINATION
  // ==========================================
  describe("1. Customer Listing, Search, Filters & Sorting", () => {
    it("1.1: Server-side search finds customer by partial name", async () => {
      const result = await adminCaller.admin.customers.list({
        search: "Ananya",
      });
      expect(result.customers).toBeDefined();
      expect(result.customers.length).toBeGreaterThanOrEqual(1);
      const found = result.customers.find((c: any) => c.id === customerA.id);
      expect(found).toBeDefined();
      expect(found.name).toBe("Ananya Subramanian");
    });

    it("1.2: Server-side search finds customer by email", async () => {
      const result = await adminCaller.admin.customers.list({
        search: customerA.email,
      });
      expect(result.customers.length).toBeGreaterThanOrEqual(1);
      expect(result.customers[0].email).toBe(customerA.email);
    });

    it("1.3: Server-side search finds customer by phone number", async () => {
      const result = await adminCaller.admin.customers.list({
        search: "9840111222",
      });
      expect(result.customers.length).toBeGreaterThanOrEqual(1);
      expect(result.customers[0].id).toBe(customerA.id);
    });

    it("1.4: Filters customers by purchase activity (WITH_ORDERS)", async () => {
      const result = await adminCaller.admin.customers.list({
        purchaseActivity: "WITH_ORDERS",
      });
      expect(result.customers.length).toBeGreaterThanOrEqual(1);
      const custA = result.customers.find((c: any) => c.id === customerA.id);
      expect(custA).toBeDefined();
      expect(custA.totalOrders).toBeGreaterThan(0);

      // Customer B has no orders and should not be present
      const custB = result.customers.find((c: any) => c.id === customerB.id);
      expect(custB).toBeUndefined();
    });

    it("1.5: Filters customers by purchase activity (NO_ORDERS)", async () => {
      const result = await adminCaller.admin.customers.list({
        purchaseActivity: "NO_ORDERS",
      });
      const custB = result.customers.find((c: any) => c.id === customerB.id);
      expect(custB).toBeDefined();
      expect(custB.totalOrders).toBe(0);

      // Customer A has orders and should not be present
      const custA = result.customers.find((c: any) => c.id === customerA.id);
      expect(custA).toBeUndefined();
    });

    it("1.6: Filters customers by account status", async () => {
      const resultActive = await adminCaller.admin.customers.list({
        status: "ACTIVE",
      });
      const allActive = resultActive.customers.every((c: any) => c.status === "ACTIVE");
      expect(allActive).toBe(true);
    });

    it("1.7: Correctly paginates customer results with total matching count", async () => {
      const page1 = await adminCaller.admin.customers.list({ limit: 2, offset: 0 });
      expect(page1.customers.length).toBeLessThanOrEqual(2);
      expect(page1.total).toBeGreaterThanOrEqual(3);

      const page2 = await adminCaller.admin.customers.list({ limit: 2, offset: 2 });
      expect(page2.customers.length).toBeGreaterThanOrEqual(1);
      // Pages should have distinct customers
      if (page1.customers.length > 0 && page2.customers.length > 0) {
        expect(page1.customers[0].id).not.toBe(page2.customers[0].id);
      }
    });
  });

  // ==========================================
  // 2. LIVE METRICS CALCULATION
  // ==========================================
  describe("2. Live Customer Metrics", () => {
    it("2.1: Calculates accurate live metrics across customer base", async () => {
      const metrics = await adminCaller.admin.customers.metrics();
      expect(metrics).toBeDefined();
      expect(metrics.totalCustomers).toBeGreaterThanOrEqual(3);
      expect(metrics.activeCustomers).toBeGreaterThanOrEqual(2);
      expect(metrics.newCustomers30d).toBeGreaterThanOrEqual(3);
      expect(metrics.customersWithOrders).toBeGreaterThanOrEqual(1);
      expect(metrics.customersWithoutOrders).toBeGreaterThanOrEqual(1);
      expect(metrics.totalCustomerOrders).toBeGreaterThanOrEqual(2);
      expect(metrics.totalVerifiedRevenue).toBeGreaterThanOrEqual(1150);
    });
  });

  // ==========================================
  // 3. CUSTOMER 360 COMPREHENSIVE PROFILE
  // ==========================================
  describe("3. Customer 360 Full Profile Aggregation", () => {
    it("3.1: Aggregates complete 360 profile with all required domains", async () => {
      const p360 = await adminCaller.admin.customers.get360({ customerId: customerA.id });
      expect(p360).toBeDefined();

      // Basic customer info (no password hash exposed)
      expect(p360.customer).toBeDefined();
      expect(p360.customer.id).toBe(customerA.id);
      expect(p360.customer.email).toBe(customerA.email);
      expect((p360.customer as any).passwordHash).toBeUndefined();

      // Saved delivery addresses
      expect(p360.addresses).toBeDefined();
      expect(p360.addresses.length).toBeGreaterThanOrEqual(1);
      expect(p360.addresses[0].city).toBe("Chennai");
      expect(p360.addresses[0].isDefault).toBe(1);

      // Purchase summary & verified revenue calculation
      expect(p360.purchaseSummary).toBeDefined();
      expect(p360.purchaseSummary.totalOrders).toBe(2);
      expect(p360.purchaseSummary.completedOrders).toBe(1);
      expect(p360.purchaseSummary.cancelledOrders).toBe(1);
      expect(p360.purchaseSummary.paidOrdersCount).toBe(1);
      // Net revenue should only count order 1 (1150), excluding cancelled order 2
      expect(p360.purchaseSummary.netRevenue).toBe(1150);
      expect(p360.purchaseSummary.aov).toBe(1150);

      // Order history with line items
      expect(p360.orders).toBeDefined();
      expect(p360.orders.length).toBe(2);
      const paidOrder = p360.orders.find((o: any) => o.paymentStatus === "PAID");
      expect(paidOrder).toBeDefined();
      expect(paidOrder.items).toBeDefined();
      expect(paidOrder.items.length).toBeGreaterThanOrEqual(1);
      expect(paidOrder.items[0].productNameEn).toBe("Amla Powder");

      // Customer feedback
      expect(p360.feedback).toBeDefined();
      expect(p360.feedback.length).toBeGreaterThanOrEqual(1);
      expect(p360.feedback[0].title).toBe("Excellent botanical quality");

      // Product reviews
      expect(p360.reviews).toBeDefined();
      expect(p360.reviews.length).toBeGreaterThanOrEqual(1);
      expect(p360.reviews[0].title).toBe("Pure & Organic");

      // Support tickets
      expect(p360.supportTickets).toBeDefined();
      expect(p360.supportTickets.length).toBeGreaterThanOrEqual(1);
      expect(p360.supportTickets[0].subject).toBe("Courier delivery tracking");

      // Wishlist items
      expect(p360.wishlist).toBeDefined();
      expect(p360.wishlist.length).toBeGreaterThanOrEqual(1);
      expect(p360.wishlist[0].product_id).toBe("TRN-1002");
    });
  });

  // ==========================================
  // 4. ACCOUNT ACTIONS & AUDIT LOGGING
  // ==========================================
  describe("4. Account Actions, Deactivation & Audit Trail", () => {
    it("4.1: Admin can update internal administrative notes with audit log", async () => {
      const updated = await adminCaller.admin.customers.updateNotes({
        customerId: customerA.id,
        adminNotes: "VIP customer - Botanical practitioner with recurring monthly bulk orders.",
      });
      expect(updated.adminNotes).toContain("VIP customer");

      const p360 = await adminCaller.admin.customers.get360({ customerId: customerA.id });
      expect(p360.customer.adminNotes).toContain("VIP customer");

      // Verify audit log
      const audit = p360.auditLogs.find((l: any) => l.action === "ADMIN_NOTES_UPDATED");
      expect(audit).toBeDefined();
      expect(audit.performed_by).toBe("Super Admin P4");
    });

    it("4.2: Admin can deactivate a customer account and write audit log", async () => {
      const updated = await adminCaller.admin.customers.updateStatus({
        customerId: customerC.id,
        status: "INACTIVE",
        reason: "Suspicious login pattern detected from foreign IP address",
      });
      expect(updated.status).toBe("INACTIVE");

      const p360 = await adminCaller.admin.customers.get360({ customerId: customerC.id });
      expect(p360.customer.status).toBe("INACTIVE");

      // Verify audit log
      const audit = p360.auditLogs.find((l: any) => l.action === "ACCOUNT_DEACTIVATED");
      expect(audit).toBeDefined();
      expect(audit.performed_by).toBe("Super Admin P4");
      expect(audit.details).toContain("Suspicious login pattern");
    });

    it("4.3: Deactivated customer cannot log in with password (FORBIDDEN)", async () => {
      await expect(
        publicCaller.auth.login({
          email: customerC.email,
          password: "CustomerPassword789!",
        })
      ).rejects.toThrow(/deactivated/i);
    });

    it("4.4: Admin can reactivate customer account and allow login again", async () => {
      const updated = await adminCaller.admin.customers.updateStatus({
        customerId: customerC.id,
        status: "ACTIVE",
        reason: "Customer verified their identity via telephone support call",
      });
      expect(updated.status).toBe("ACTIVE");

      // Now customer C can log in again
      const loginRes = await publicCaller.auth.login({
        email: customerC.email,
        password: "CustomerPassword789!",
      });
      expect(loginRes.user.email).toBe(customerC.email);
    });
  });

  // ==========================================
  // 5. CSV EXPORT & FORMULA INJECTION DEFENSE
  // ==========================================
  describe("5. CSV Data Export & Formula Injection Defense", () => {
    it("5.1: Exports sanitized CSV with formula injection defense for spreadsheet security", async () => {
      const csv = await adminCaller.admin.customers.exportCsv();
      expect(typeof csv).toBe("string");
      expect(csv).toContain("Customer ID");
      expect(csv).toContain("Verified Total Spent (INR)");

      // Sensitive fields must NOT be present
      expect(csv).not.toContain("passwordHash");
      expect(csv).not.toContain("password");

      // Check Customer B whose name started with '=SUM(1+2)'
      // It must be prefixed with single quote "'" to prevent formula injection
      expect(csv).toContain("'=SUM(1+2) Security Test");
    });
  });

  // ==========================================
  // 6. AUTHORIZATION & SECURITY
  // ==========================================
  describe("6. Authorization & Access Control", () => {
    it("6.1: Rejects unauthenticated caller from customer 360 endpoints", async () => {
      await expect(publicCaller.admin.customers.list()).rejects.toThrow();
      await expect(publicCaller.admin.customers.metrics()).rejects.toThrow();
      await expect(publicCaller.admin.customers.get360({ customerId: customerA.id })).rejects.toThrow();
    });

    it("6.2: Rejects non-admin regular customer from customer 360 endpoints", async () => {
      await expect(regularCustomerCaller.admin.customers.list()).rejects.toThrow(/required permission|access denied|admin/i);
      await expect(regularCustomerCaller.admin.customers.metrics()).rejects.toThrow(/required permission|access denied|admin/i);
      await expect(
        regularCustomerCaller.admin.customers.get360({ customerId: customerB.id })
      ).rejects.toThrow(/required permission|access denied|admin/i);
    });
  });
});
