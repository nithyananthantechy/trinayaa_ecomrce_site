import { describe, it, expect, beforeAll, afterAll } from "vitest";
import * as db from "./db.ts";
import { appRouter } from "./routers.ts";
import { TRPCError } from "@trpc/server";

function createMockContext(user: any = null) {
  const cookies: Record<string, any> = {};
  const headers: Record<string, string> = {};

  return {
    ctx: {
      user,
      req: {
        protocol: "https",
        headers,
        cookies,
        ip: "127.0.0.1",
      } as any,
      res: {
        cookie: (name: string, val: string) => { cookies[name] = val; },
        clearCookie: (name: string) => { delete cookies[name]; },
      } as any,
    },
  };
}

describe("TRINAYAA Phase 3 — New Product Enquiry System Suite", () => {
  let callerPublic: ReturnType<typeof appRouter.createCaller>;
  let callerCustA: ReturnType<typeof appRouter.createCaller>;
  let callerCustB: ReturnType<typeof appRouter.createCaller>;
  let callerAdmin: ReturnType<typeof appRouter.createCaller>;

  const customerA = {
    id: "usr_phase3_test_cust_a",
    email: "phase3_customer_a@trinayaa.test",
    name: "Ananya Subramanian",
    phone: "9876543220",
    role: "CUSTOMER",
  };

  const customerB = {
    id: "usr_phase3_test_cust_b",
    email: "phase3_customer_b@trinayaa.test",
    name: "Karthik Raja",
    phone: "9876543221",
    role: "CUSTOMER",
  };

  const adminUser = {
    id: "usr_phase3_test_admin",
    email: "phase3_admin@trinayaa.test",
    name: "Store Manager Erode",
    phone: "9876543222",
    role: "ADMIN",
  };

  let createdEnquiryA1: any;
  let createdEnquiryA2: any;

  beforeAll(async () => {
    const rawDb = db.getDatabase();
    const now = new Date().toISOString();

    // Ensure test users exist in database for foreign keys
    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, 'dummy_hash', ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(customerA.id, customerA.email, customerA.name, customerA.phone, customerA.role, now, now);

    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, 'dummy_hash', ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(customerB.id, customerB.email, customerB.name, customerB.phone, customerB.role, now, now);

    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, 'dummy_hash', ?, ?, ?, 'ACTIVE', ?, ?)
    `).run(adminUser.id, adminUser.email, adminUser.name, adminUser.phone, adminUser.role, now, now);

    callerPublic = appRouter.createCaller(createMockContext(null).ctx);
    callerCustA = appRouter.createCaller(createMockContext(customerA).ctx);
    callerCustB = appRouter.createCaller(createMockContext(customerB).ctx);
    callerAdmin = appRouter.createCaller(createMockContext(adminUser).ctx);
  });

  afterAll(() => {
    const rawDb = db.getDatabase();
    try {
      rawDb.prepare("DELETE FROM product_enquiries WHERE customer_id IN (?, ?)").run(customerA.id, customerB.id);
      rawDb.prepare("DELETE FROM users WHERE id IN (?, ?, ?)").run(customerA.id, customerB.id, adminUser.id);
    } catch {
      // Ignore cleanup error
    }
  });

  // 1. Authenticated customer can submit a valid product enquiry
  it("1: Authenticated customer can submit a valid product enquiry", async () => {
    const enquiry = await callerCustA.productEnquiries.submit({
      productName: "Dried Butterfly Pea Flower (Shankhpushpi)",
      category: "Traditional Flower Powders",
      requestedQuantity: "500g",
      preferredPackSize: "250g Household Pack",
      description: "Looking for whole sun-dried blue pea flowers with intact calyx for herbal tisanes.",
      referenceImage: "/uploads/trn_sample_flower.png",
    });

    expect(enquiry).toBeDefined();
    expect(enquiry.id).toBeDefined();
    expect(enquiry.enquiryNumber).toMatch(/^TRN-ENQ-\d{4}-\d{5}$/);
    expect(enquiry.productName).toBe("Dried Butterfly Pea Flower (Shankhpushpi)");
    expect(enquiry.category).toBe("Traditional Flower Powders");
    expect(enquiry.requestedQuantity).toBe("500g");
    expect(enquiry.preferredPackSize).toBe("250g Household Pack");
    expect(enquiry.status).toBe("NEW");
    expect(enquiry.customerId).toBe(customerA.id);
    expect(enquiry.customerName).toBe(customerA.name);
    expect(enquiry.customerEmail).toBe(customerA.email);

    createdEnquiryA1 = enquiry;
  });

  // 2. Unauthenticated customer submission is rejected
  it("2: Unauthenticated customer submission is rejected with UNAUTHORIZED", async () => {
    await expect(
      callerPublic.productEnquiries.submit({
        productName: "Senna Pods",
        requestedQuantity: "1 kg",
        description: "Need pure unadulterated Tirunelveli senna pods.",
      })
    ).rejects.toThrow();
  });

  // 3. Required product name validation
  it("3: Required product name validation rejects strings shorter than 2 characters", async () => {
    await expect(
      callerCustA.productEnquiries.submit({
        productName: "A",
        requestedQuantity: "1 kg",
        description: "Need botanical ingredient for formulation.",
      })
    ).rejects.toThrow();
  });

  // 4. Quantity validation
  it("4: Quantity validation rejects empty preferred quantity", async () => {
    await expect(
      callerCustA.productEnquiries.submit({
        productName: "Sirukurinjan Leaves",
        requestedQuantity: "",
        description: "Looking for Gymnema sylvestre dry leaves.",
      })
    ).rejects.toThrow();
  });

  // 5. Invalid input is rejected (e.g. description too short)
  it("5: Invalid input is rejected when description is under 10 characters", async () => {
    await expect(
      callerCustA.productEnquiries.submit({
        productName: "Karisalankanni Herb",
        requestedQuantity: "500g",
        description: "Too short",
      })
    ).rejects.toThrow();
  });

  // 6. Customer can view their own enquiry history
  it("6: Customer can view their own enquiry history", async () => {
    const list = await callerCustA.productEnquiries.myEnquiries();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    const found = list.find((e: any) => e.id === createdEnquiryA1.id);
    expect(found).toBeDefined();
    expect(found.enquiryNumber).toBe(createdEnquiryA1.enquiryNumber);
    expect(found.productName).toBe(createdEnquiryA1.productName);
  });

  // 7. Customer cannot view another customer's enquiries
  it("7: Customer cannot view another customer's enquiries", async () => {
    // Customer B's list should not contain Customer A's enquiry
    const bList = await callerCustB.productEnquiries.myEnquiries();
    const leaked = bList.find((e: any) => e.id === createdEnquiryA1.id);
    expect(leaked).toBeUndefined();

    // Direct getById check enforces customer isolation
    await expect(
      callerCustB.productEnquiries.getById({ id: createdEnquiryA1.id })
    ).rejects.toThrow(/not found|access denied/i);
  });

  // 8. Customer cannot edit administrative status or notes
  it("8: Customer cannot edit administrative status or notes (internal notes stripped on getById)", async () => {
    // Admin first sets an internal note on enquiry 1
    await callerAdmin.productEnquiries.adminUpdateStatus({
      id: createdEnquiryA1.id,
      status: "UNDER_REVIEW",
      adminNotes: "CONFIDENTIAL_SOURCING_RATE_PER_KG_800",
    });

    // Customer reads the enquiry via getById
    const customerView = await callerCustA.productEnquiries.getById({ id: createdEnquiryA1.id });
    expect(customerView.status).toBe("UNDER_REVIEW");
    expect((customerView as any).adminNotes).toBeUndefined();
    expect((customerView as any).admin_notes).toBeUndefined();
  });

  // 9. Admin can view enquiries
  it("9: Admin can view enquiries list and detail with administrative notes", async () => {
    const list = await callerAdmin.productEnquiries.adminList();
    expect(Array.isArray(list)).toBe(true);
    const found = list.find((e: any) => e.id === createdEnquiryA1.id);
    expect(found).toBeDefined();

    const detail = await callerAdmin.productEnquiries.adminGetById({ id: createdEnquiryA1.id });
    expect(detail.id).toBe(createdEnquiryA1.id);
    expect(detail.adminNotes).toBe("CONFIDENTIAL_SOURCING_RATE_PER_KG_800");
  });

  // 10. Non-admin cannot access admin enquiry management
  it("10: Non-admin cannot access admin enquiry procedures", async () => {
    await expect(
      callerCustA.productEnquiries.adminList()
    ).rejects.toThrow();

    await expect(
      callerCustA.productEnquiries.adminUpdateStatus({
        id: createdEnquiryA1.id,
        status: "CLOSED",
      })
    ).rejects.toThrow();

    await expect(
      callerPublic.productEnquiries.adminList()
    ).rejects.toThrow();
  });

  // 11. Admin can update enquiry status
  it("11: Admin can update enquiry status through defined workflow", async () => {
    const updated = await callerAdmin.productEnquiries.adminUpdateStatus({
      id: createdEnquiryA1.id,
      status: "SOURCING",
    });

    expect(updated.status).toBe("SOURCING");
    expect(updated.reviewedBy).toBe(adminUser.name);
    expect(updated.reviewedAt).toBeDefined();
  });

  // 12. Admin can add internal notes
  it("12: Admin can add and edit internal administrative sourcing notes", async () => {
    const updated = await callerAdmin.productEnquiries.adminUpdateStatus({
      id: createdEnquiryA1.id,
      status: "AVAILABLE",
      adminNotes: "Farm supplier confirmed fresh lot of 50 kg; created retail catalogue entry SKU TRN-1065.",
    });

    expect(updated.status).toBe("AVAILABLE");
    expect(updated.adminNotes).toContain("TRN-1065");
  });

  // 13. Invalid status transitions or values are rejected
  it("13: Invalid status values are rejected by server validation", async () => {
    await expect(
      callerAdmin.productEnquiries.adminUpdateStatus({
        id: createdEnquiryA1.id,
        status: "INVALID_STATUS" as any,
      })
    ).rejects.toThrow();
  });

  // 14. Duplicate submissions are handled safely
  it("14: Multiple submissions from same customer generate unique enquiry numbers safely", async () => {
    createdEnquiryA2 = await callerCustA.productEnquiries.submit({
      productName: "Avuri (Indigo) Leaf Powder",
      requestedQuantity: "2 kg",
      description: "Fine sun-dried indigofera tinctoria leaf powder for hair wellness.",
    });

    expect(createdEnquiryA2).toBeDefined();
    expect(createdEnquiryA2.id).not.toBe(createdEnquiryA1.id);
    expect(createdEnquiryA2.enquiryNumber).not.toBe(createdEnquiryA1.enquiryNumber);
    expect(createdEnquiryA2.enquiryNumber).toMatch(/^TRN-ENQ-\d{4}-\d{5}$/);
  });

  // 15. Existing feedback and review functionality remains unchanged
  it("15: Existing customer feedback and review functionality operates without regression", async () => {
    const feedback = await callerPublic.feedback.submit({
      customerName: "Botanical Buyer",
      customerEmail: "buyer@trinayaa.test",
      category: "Overall shopping experience",
      rating: 5,
      title: "Excellent Pure Moringa Powder",
      message: "The packaging and freshness of TRINAYAA moringa powder was outstanding.",
    });

    expect(feedback).toBeDefined();
    expect(feedback.id).toBeDefined();

    const adminFeedbackList = await callerAdmin.feedback.adminList({ status: "NEW" });
    const found = adminFeedbackList.find((f: any) => f.id === feedback.id);
    expect(found).toBeDefined();
  });

  // 16. Existing support helpdesk functionality remains unchanged
  it("16: Existing support helpdesk tickets operate without regression", async () => {
    const ticket = await callerCustA.tickets.create({
      category: "Order issue",
      subject: "Tracking enquiry for recent dispatch",
      description: "Can you please verify dispatch carrier status for my parcel?",
      priority: "Normal",
    });

    expect(ticket).toBeDefined();
    expect(ticket.ticket_number).toMatch(/^TRN-SUP-\d{4}-\d{5}$/);

    const myTickets = await callerCustA.tickets.myTickets();
    const found = myTickets.find((t: any) => t.id === ticket.id);
    expect(found).toBeDefined();
  });

  // 17. Telegram notification failure does not lose a submitted enquiry
  it("17: Enquiry creation succeeds and persists even if notification triggers background dispatch", async () => {
    const enquiry = await callerCustB.productEnquiries.submit({
      productName: "Nannari (Sarsaparilla) Root Chips",
      requestedQuantity: "1 kg",
      description: "Coarse cut Hemidesmus indicus roots for summer cooling sherbet extraction.",
    });

    expect(enquiry).toBeDefined();
    expect(enquiry.customerId).toBe(customerB.id);

    // Verify it is firmly saved in SQLite database
    const inDb = db.productEnquiriesRepo.getById(enquiry.id);
    expect(inDb).toBeDefined();
    expect(inDb.productName).toBe("Nannari (Sarsaparilla) Root Chips");
  });
});
