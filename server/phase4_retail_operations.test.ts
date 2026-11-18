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

describe("TRINAYAA Phase 4 — Retail Shop Handler Role & Retail Operations Portal Suite", () => {
  let callerPublic: ReturnType<typeof appRouter.createCaller>;
  let callerSuperAdmin: ReturnType<typeof appRouter.createCaller>;
  let callerStoreAdmin: ReturnType<typeof appRouter.createCaller>;
  let callerRetailErode: ReturnType<typeof appRouter.createCaller>;
  let callerRetailCbe: ReturnType<typeof appRouter.createCaller>;
  let callerCustomer: ReturnType<typeof appRouter.createCaller>;

  const superAdminUser = {
    id: "usr_phase4_super_admin",
    email: "founder_phase4@trinayaa.test",
    name: "Founder Nithya",
    phone: "9876543200",
    role: "SUPER_ADMIN",
    branchId: "brn_erode_hq",
  };

  const storeAdminUser = {
    id: "usr_phase4_store_admin",
    email: "store_admin_phase4@trinayaa.test",
    name: "Store Admin Erode",
    phone: "9876543201",
    role: "ADMIN",
    branchId: "brn_erode_hq",
  };

  const retailHandlerErode = {
    id: "usr_phase4_retail_erode",
    email: "retail_erode@trinayaa.test",
    name: "Mani Warehouse Handler",
    phone: "9876543202",
    role: "RETAIL_SHOP_HANDLER",
    branchId: "brn_erode_hq",
  };

  const retailHandlerCbe = {
    id: "usr_phase4_retail_cbe",
    email: "retail_cbe@trinayaa.test",
    name: "Coimbatore Counter Staff",
    phone: "9876543203",
    role: "RETAIL_SHOP_HANDLER",
    branchId: "brn_cbe_town",
  };

  const inactiveRetailUser = {
    id: "usr_phase4_retail_inactive",
    email: "inactive_retail@trinayaa.test",
    name: "Suspended Staff",
    phone: "9876543204",
    role: "RETAIL_SHOP_HANDLER",
    branchId: "brn_erode_hq",
  };

  const customerUser = {
    id: "usr_phase4_customer",
    email: "customer_phase4@trinayaa.test",
    name: "Kavitha Ramesh",
    phone: "9876543205",
    role: "CUSTOMER",
    branchId: null,
  };

  const testPassword = "RetailPass123!";
  let testProduct1: any;
  let testProduct2: any;
  let completedSaleInvoice: string = "";
  let completedSaleId: string = "";

  beforeAll(async () => {
    const rawDb = db.getDatabase();
    const now = new Date().toISOString();
    const passwordHash = db.hashPassword(testPassword);

    // Clean up any residual test data from previous runs
    rawDb.prepare("DELETE FROM users WHERE email = 'salem_lead@trinayaa.test' OR id LIKE 'usr_phase4_%'").run();
    rawDb.prepare("DELETE FROM retail_sales WHERE branch_id IN ('brn_erode_hq', 'brn_cbe_town') AND customer_name = 'Walk-in Customer'").run();
    rawDb.prepare("DELETE FROM retail_stock_movements WHERE reference_id LIKE 'TRN-RET-%' OR reference_id LIKE 'TRN-ADJ-%'").run();
    rawDb.prepare("DELETE FROM retail_stock_adjustments WHERE branch_id IN ('brn_erode_hq', 'brn_cbe_town')").run();
    rawDb.prepare("DELETE FROM retail_branches WHERE code LIKE 'SALEM_%'").run();

    // 1. Ensure test users exist with hashed passwords
    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(superAdminUser.id, superAdminUser.email, passwordHash, superAdminUser.name, superAdminUser.phone, superAdminUser.role, superAdminUser.branchId, now, now);

    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(storeAdminUser.id, storeAdminUser.email, passwordHash, storeAdminUser.name, storeAdminUser.phone, storeAdminUser.role, storeAdminUser.branchId, now, now);

    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(retailHandlerErode.id, retailHandlerErode.email, passwordHash, retailHandlerErode.name, retailHandlerErode.phone, retailHandlerErode.role, retailHandlerErode.branchId, now, now);

    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?)
    `).run(retailHandlerCbe.id, retailHandlerCbe.email, passwordHash, retailHandlerCbe.name, retailHandlerCbe.phone, retailHandlerCbe.role, retailHandlerCbe.branchId, now, now);

    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'INACTIVE', ?, ?, ?)
    `).run(inactiveRetailUser.id, inactiveRetailUser.email, passwordHash, inactiveRetailUser.name, inactiveRetailUser.phone, inactiveRetailUser.role, inactiveRetailUser.branchId, now, now);

    rawDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', NULL, ?, ?)
    `).run(customerUser.id, customerUser.email, passwordHash, customerUser.name, customerUser.phone, customerUser.role, now, now);

    // 2. Fetch two existing published products from database
    const products = rawDb.prepare("SELECT id, sku, nameEn, sellingPrice FROM products WHERE status = 'Published' LIMIT 2").all() as any[];
    expect(products.length).toBeGreaterThanOrEqual(2);
    testProduct1 = products[0];
    testProduct2 = products[1];

    // Ensure branch stock exists for both products in Erode HQ with known quantities
    rawDb.prepare(`
      INSERT OR REPLACE INTO retail_branch_stock (id, branch_id, product_id, sku, stock_quantity, low_stock_threshold, updated_at)
      VALUES (?, ?, ?, ?, ?, 5, ?)
    `).run(`stk_test_er_${testProduct1.id}`, "brn_erode_hq", testProduct1.id, testProduct1.sku, 50, now);

    rawDb.prepare(`
      INSERT OR REPLACE INTO retail_branch_stock (id, branch_id, product_id, sku, stock_quantity, low_stock_threshold, updated_at)
      VALUES (?, ?, ?, ?, ?, 5, ?)
    `).run(`stk_test_er_${testProduct2.id}`, "brn_erode_hq", testProduct2.id, testProduct2.sku, 10, now);

    // Stock for CBE branch
    rawDb.prepare(`
      INSERT OR REPLACE INTO retail_branch_stock (id, branch_id, product_id, sku, stock_quantity, low_stock_threshold, updated_at)
      VALUES (?, ?, ?, ?, ?, 5, ?)
    `).run(`stk_test_cbe_${testProduct1.id}`, "brn_cbe_town", testProduct1.id, testProduct1.sku, 25, now);

    // 3. Create callers
    callerPublic = appRouter.createCaller(createMockContext(null).ctx);
    callerSuperAdmin = appRouter.createCaller(createMockContext(superAdminUser).ctx);
    callerStoreAdmin = appRouter.createCaller(createMockContext(storeAdminUser).ctx);
    callerRetailErode = appRouter.createCaller(createMockContext(retailHandlerErode).ctx);
    callerRetailCbe = appRouter.createCaller(createMockContext(retailHandlerCbe).ctx);
    callerCustomer = appRouter.createCaller(createMockContext(customerUser).ctx);
  });

  afterAll(async () => {
    const rawDb = db.getDatabase();
    try {
      rawDb.prepare("DELETE FROM retail_sale_items WHERE sale_id IN (SELECT id FROM retail_sales WHERE branch_id = 'brn_erode_hq' AND handler_id = ?)").run(retailHandlerErode.id);
      rawDb.prepare("DELETE FROM retail_sales WHERE handler_id = ?").run(retailHandlerErode.id);
      rawDb.prepare("DELETE FROM retail_stock_adjustments WHERE branch_id = 'brn_erode_hq' AND requested_by = ?").run(retailHandlerErode.id);
      rawDb.prepare("DELETE FROM retail_stock_movements WHERE performed_by = ?").run(retailHandlerErode.id);
      rawDb.prepare("DELETE FROM users WHERE id LIKE 'usr_phase4_%'").run();
      rawDb.prepare("DELETE FROM retail_branches WHERE code LIKE 'SALEM_%'").run();
    } catch (e) {
      console.warn("Cleanup warning:", e);
    }
  });

  // =========================================================================
  // 1. Retail Authentication & Access Restrictions
  // =========================================================================
  describe("1. Retail Staff Authentication & Access Restrictions", () => {
    it("1. authenticates retail shop handler at auth.retailLogin with valid credentials", async () => {
      const res = await callerPublic.auth.retailLogin({
        email: retailHandlerErode.email,
        password: testPassword,
      });

      expect(res.token).toBeDefined();
      expect(res.user.role).toBe("RETAIL_SHOP_HANDLER");
      expect(res.user.branchId).toBe("brn_erode_hq");
    });

    it("2. rejects invalid credentials with UNAUTHORIZED at auth.retailLogin", async () => {
      await expect(
        callerPublic.auth.retailLogin({
          email: retailHandlerErode.email,
          password: "WrongPassword999!",
        })
      ).rejects.toThrowError(TRPCError);
    });

    it("3. rejects customer accounts attempting retail login with FORBIDDEN", async () => {
      try {
        await callerPublic.auth.retailLogin({
          email: customerUser.email,
          password: testPassword,
        });
        expect.unreachable("Customer should be rejected");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
        expect(err.message).toContain("Retail Shop Handler");
      }
    });

    it("4. rejects inactive or suspended retail accounts with FORBIDDEN", async () => {
      try {
        await callerPublic.auth.retailLogin({
          email: inactiveRetailUser.email,
          password: testPassword,
        });
        expect.unreachable("Inactive account should be rejected");
      } catch (err: any) {
        expect(err.code).toBe("FORBIDDEN");
        expect(err.message).toContain("deactivated");
      }
    });

    it("5. permits Super Admin login at auth.retailLogin for supervisor access", async () => {
      const res = await callerPublic.auth.retailLogin({
        email: superAdminUser.email,
        password: testPassword,
      });

      expect(res.token).toBeDefined();
      expect(res.user.role).toBe("SUPER_ADMIN");
    });
  });

  // =========================================================================
  // 2. Server-Side Role Enforcement & Access Isolation
  // =========================================================================
  describe("2. Server-Side Role Enforcement & Access Isolation", () => {
    it("6. rejects Retail Shop Handler from accessing adminProcedure (adminUsers.list)", async () => {
      await expect(callerRetailErode.admin.adminUsers.list()).rejects.toThrowError(/permission/i);
    });

    it("7. rejects Retail Shop Handler from accessing store admin categories list", async () => {
      await expect(callerRetailErode.admin.categories.list()).rejects.toThrowError(/permission/i);
    });

    it("8. rejects Retail Shop Handler from accessing store admin audit logs", async () => {
      await expect(callerRetailErode.admin.auditLogs.list({})).rejects.toThrowError(/permission/i);
    });

    it("9. rejects Store Admin (ADMIN) from calling superAdminProcedure (branch creation)", async () => {
      await expect(
        callerStoreAdmin.admin.retail.branches.create({
          code: "SALEM_TOWN",
          name: "Salem Outlet",
          address: "Salem Bus Stand",
          city: "Salem",
          pinCode: "636001",
          phone: "9876543299",
        })
      ).rejects.toThrowError(/Super Administrator/i);
    });

    it("10. permits Super Admin to create a physical retail branch", async () => {
      const newBranch = await callerSuperAdmin.admin.retail.branches.create({
        code: "SALEM_HUB",
        name: "Salem Central Branch",
        address: "123 Cherry Road",
        city: "Salem",
        pinCode: "636001",
        phone: "9876543290",
      });

      expect(newBranch).toBeDefined();
      expect(newBranch.code).toBe("SALEM_HUB");
      expect(newBranch.city).toBe("Salem");
    });

    it("11. permits Super Admin to provision a new Retail Shop Handler with branch assignment", async () => {
      const res = await callerSuperAdmin.admin.adminUsers.create({
        name: "Salem Branch Lead",
        email: "salem_lead@trinayaa.test",
        password: "LeadPassword2026!",
        phone: "9876543291",
        role: "RETAIL_SHOP_HANDLER",
        branchId: "brn_erode_hq",
      });

      expect(res.success).toBe(true);
      expect(res.user).toBeDefined();
      expect(res.user.role).toBe("RETAIL_SHOP_HANDLER");
      expect(res.user.branchId).toBe("brn_erode_hq");
    });
  });

  // =========================================================================
  // 3. Branch Profile & Inventory Visibility
  // =========================================================================
  describe("3. Branch Stock & Inventory Visibility", () => {
    it("12. resolves assigned branch information via retail.myBranch", async () => {
      const branch = await callerRetailErode.retail.myBranch();
      expect(branch.id).toBe("brn_erode_hq");
      expect(branch.code).toBe("ERODE-HQ");
      expect(branch.city).toBe("Erode");
    });

    it("13. retrieves branch stock with calculated status (In Stock, Low Stock)", async () => {
      const stockItems = await callerRetailErode.retail.branchStock({});
      expect(stockItems.length).toBeGreaterThan(0);

      const item1 = stockItems.find((s: any) => s.productId === testProduct1.id);
      expect(item1).toBeDefined();
      expect(item1.stockQuantity).toBe(50);
      expect(item1.stockStatus).toBe("In Stock");

      const item2 = stockItems.find((s: any) => s.productId === testProduct2.id);
      expect(item2).toBeDefined();
      expect(item2.stockQuantity).toBe(10);
    });

    it("14. enforces branch isolation on stock querying", async () => {
      const erodeStock = await callerRetailErode.retail.branchStock({});
      const erodeItem = erodeStock.find((s: any) => s.productId === testProduct1.id);
      expect(erodeItem?.stockQuantity).toBe(50);

      const cbeStock = await callerRetailCbe.retail.branchStock({});
      const cbeItem = cbeStock.find((s: any) => s.productId === testProduct1.id);
      expect(cbeItem?.stockQuantity).toBe(25);
    });

    it("15. searches products for POS billing with live branch stock levels", async () => {
      const searchResults = await callerRetailErode.retail.searchProducts({ query: testProduct1.nameEn.substring(0, 4) });
      expect(searchResults.length).toBeGreaterThan(0);
      const found = searchResults.find((p: any) => p.productId === testProduct1.id);
      expect(found).toBeDefined();
      expect(found.stockQuantity).toBe(50);
    });
  });

  // =========================================================================
  // 4. POS Sale Processing, Atomic Stock & Invoice Numbering
  // =========================================================================
  describe("4. POS Billing, Atomic Stock Deduction & Movement Tracking", () => {
    it("16. generates sequential retail invoice in TRN-RET-YYYY-XXXXX format", async () => {
      const invoiceNumber = db.retailSalesRepo.generateInvoiceNumber();
      const currentYear = new Date().getFullYear().toString();
      expect(invoiceNumber).toMatch(new RegExp(`^TRN-RET-${currentYear}-\\d{5}$`));
    });

    it("17. completes POS retail sale with atomic stock deduction and cash payment", async () => {
      const sale = await callerRetailErode.retail.createSale({
        items: [
          {
            productId: testProduct1.id,
            sku: testProduct1.sku,
            quantity: 3,
            unitPrice: testProduct1.sellingPrice,
          },
          {
            productId: testProduct2.id,
            sku: testProduct2.sku,
            quantity: 2,
            unitPrice: testProduct2.sellingPrice,
          },
        ],
        paymentMethod: "CASH",
        discountAmount: 20,
        customerName: "Walk-in Customer",
        customerPhone: "9876543255",
        notes: "Over-the-counter wellness purchase",
      });

      expect(sale).toBeDefined();
      expect(sale.invoice_number).toMatch(/^TRN-RET-\d{4}-\d{5}$/);
      expect(sale.payment_method).toBe("CASH");
      expect(sale.discount_amount).toBe(20);

      completedSaleInvoice = sale.invoice_number;
      completedSaleId = sale.id;

      // Check stock deduction: Product 1 was 50 -> now 47. Product 2 was 10 -> now 8.
      const stock1 = db.retailStockRepo.getItemStock("brn_erode_hq", testProduct1.id);
      const stock2 = db.retailStockRepo.getItemStock("brn_erode_hq", testProduct2.id);
      expect(stock1?.stock_quantity).toBe(47);
      expect(stock2?.stock_quantity).toBe(8);
    });

    it("18. creates auditable stock movement entries with change_type 'SALE'", async () => {
      const rawDb = db.getDatabase();
      const movements = rawDb.prepare(`
        SELECT * FROM retail_stock_movements 
        WHERE branch_id = 'brn_erode_hq' AND reference_id = ? AND change_type = 'SALE'
      `).all(completedSaleInvoice) as any[];

      expect(movements.length).toBe(2);
      expect(movements.every((m: any) => m.performed_by === retailHandlerErode.name || m.performed_by === retailHandlerErode.id)).toBe(true);
      expect(movements.some((m: any) => m.product_id === testProduct1.id && m.delta === -3)).toBe(true);
      expect(movements.some((m: any) => m.product_id === testProduct2.id && m.delta === -2)).toBe(true);
    });

    it("19. rejects POS sale when requested quantity exceeds branch stock", async () => {
      // Product 2 currently has 8 in stock at Erode HQ; attempting to buy 20 must fail
      await expect(
        callerRetailErode.retail.createSale({
          items: [
            {
              productId: testProduct2.id,
              sku: testProduct2.sku,
              quantity: 20,
              unitPrice: testProduct2.sellingPrice,
            },
          ],
          paymentMethod: "UPI",
        })
      ).rejects.toThrowError(/Insufficient branch stock/i);

      // Verify stock was not changed
      const stock2 = db.retailStockRepo.getItemStock("brn_erode_hq", testProduct2.id);
      expect(stock2?.stock_quantity).toBe(8);
    });

    it("20. maintains atomicity: failed multi-item sale does not partially deduct any item", async () => {
      // Product 1 has 47 (sufficient), Product 2 has 8 (insufficient for 50)
      await expect(
        callerRetailErode.retail.createSale({
          items: [
            { productId: testProduct1.id, sku: testProduct1.sku, quantity: 5, unitPrice: testProduct1.sellingPrice },
            { productId: testProduct2.id, sku: testProduct2.sku, quantity: 50, unitPrice: testProduct2.sellingPrice },
          ],
          paymentMethod: "CARD",
        })
      ).rejects.toThrowError(/Insufficient branch stock/i);

      // Verify Product 1 was NOT deducted (still 47)
      const stock1 = db.retailStockRepo.getItemStock("brn_erode_hq", testProduct1.id);
      expect(stock1?.stock_quantity).toBe(47);
    });
  });

  // =========================================================================
  // 5. Invoicing, Branch Sales History & Isolation
  // =========================================================================
  describe("5. Invoicing & Branch Isolation", () => {
    it("21. retrieves complete invoice details for branch staff", async () => {
      const invoice = await callerRetailErode.retail.getInvoice({ invoiceNumber: completedSaleInvoice });
      expect(invoice.invoice_number).toBe(completedSaleInvoice);
      expect(invoice.customer_name).toBe("Walk-in Customer");
      expect(invoice.items.length).toBe(2);
      expect(invoice.branchCode).toBe("ERODE-HQ");
    });

    it("22. enforces branch isolation on invoice retrieval (cross-branch access blocked)", async () => {
      // Coimbatore staff attempting to view Erode HQ's invoice must be rejected
      await expect(
        callerRetailCbe.retail.getInvoice({ invoiceNumber: completedSaleInvoice })
      ).rejects.toThrowError(/Access denied: invoice belongs to another branch/i);
    });

    it("23. returns isolated branch sales history", async () => {
      const erodeHistory = await callerRetailErode.retail.salesHistory({ limit: 10 });
      expect(erodeHistory.some((s: any) => s.invoice_number === completedSaleInvoice)).toBe(true);

      const cbeHistory = await callerRetailCbe.retail.salesHistory({ limit: 10 });
      expect(cbeHistory.some((s: any) => s.invoice_number === completedSaleInvoice)).toBe(false);
    });
  });

  // =========================================================================
  // 6. Stock Adjustment Requests & Super Admin Approval
  // =========================================================================
  describe("6. Stock Adjustment Requests & Review Lifecycle", () => {
    let adjustmentId: string = "";

    it("24. allows Retail Shop Handler to request a stock adjustment", async () => {
      const req = await callerRetailErode.retail.requestStockAdjustment({
        productId: testProduct1.id,
        sku: testProduct1.sku,
        requestedDelta: 5,
        reason: "RESTOCK - Received +5 pouches from farm packing unit",
      });

      expect(req.id).toBeDefined();
      adjustmentId = req.id;

      const myAdjustments = await callerRetailErode.retail.myAdjustments();
      const submitted = myAdjustments.find((a: any) => a.id === adjustmentId);
      expect(submitted).toBeDefined();
      expect(submitted.status).toBe("PENDING");
      expect(submitted.requested_delta).toBe(5);
    });

    it("25. permits Super Admin to review and approve stock adjustment, updating inventory", async () => {
      const reviewResult = await callerSuperAdmin.admin.retail.reviewAdjustment({
        id: adjustmentId,
        status: "APPROVED",
        adminNotes: "Stock verified by warehouse manager",
      });

      expect(reviewResult).toBeDefined();
      expect(reviewResult.status).toBe("APPROVED");

      // Verify stock was atomically updated: 47 + 5 = 52
      const stock1 = db.retailStockRepo.getItemStock("brn_erode_hq", testProduct1.id);
      expect(stock1?.stock_quantity).toBe(52);

      // Verify movement entry created
      const rawDb = db.getDatabase();
      const movement = rawDb.prepare(`
        SELECT * FROM retail_stock_movements 
        WHERE branch_id = 'brn_erode_hq' AND reference_id = ? AND change_type = 'ADJUSTMENT'
      `).get(reviewResult.adjustment_number) as any;
      expect(movement).toBeDefined();
      expect(movement.delta).toBe(5);
    });

    it("26. permits Super Admin to cancel/refund sale and reverse branch stock atomically", async () => {
      const cancelResult = await callerSuperAdmin.admin.retail.cancelSale({
        saleId: completedSaleId,
        reason: "Customer returned sealed merchandise",
      });

      expect(cancelResult).toBeDefined();
      expect(cancelResult.sale_status).toBe("CANCELLED");

      // Stock should be restored: Product 1 was 52, sale had 3 -> now 55. Product 2 was 8, sale had 2 -> now 10.
      const stock1 = db.retailStockRepo.getItemStock("brn_erode_hq", testProduct1.id);
      const stock2 = db.retailStockRepo.getItemStock("brn_erode_hq", testProduct2.id);
      expect(stock1?.stock_quantity).toBe(55);
      expect(stock2?.stock_quantity).toBe(10);
    });
  });

  // =========================================================================
  // 7. Non-Regression: Online E-Commerce & Customer Capabilities
  // =========================================================================
  describe("7. Non-Regression: Online Storefront & Customer Operations", () => {
    it("27. online catalogue and product queries continue to function", async () => {
      const activeProducts = await callerPublic.products.list({ limit: 10 });
      expect(activeProducts.length).toBeGreaterThan(0);
      expect(activeProducts.some((p: any) => p.id === testProduct1.id)).toBe(true);
    });

    it("28. customer auth.me returns customer profile without branchId restrictions", async () => {
      const me = await callerCustomer.auth.me();
      expect(me?.id).toBe(customerUser.id);
      expect(me?.role).toBe("CUSTOMER");
      expect(me?.branchId).toBeNull();
    });
  });
});
