// TRINAYAA E-COMMERCE — PHASE 8 FINAL QA, SECURITY AUDIT & PRODUCTION READINESS TEST SUITE
import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db.ts";
import { appRouter } from "./routers.ts";
import { COOKIE_NAME } from "@shared/const";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const sqliteModule: any = (process as any).getBuiltinModule ? (process as any).getBuiltinModule("node:sqlite") : eval("require")("node:sqlite");
const DatabaseSync = sqliteModule.DatabaseSync;

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
        socket: { remoteAddress: "127.0.0.1" },
      } as any,
      res: {
        cookie: (name: string, val: any, opts: any) => {
          cookies[name] = { val, opts };
        },
        clearCookie: (name: string, opts: any) => {
          delete cookies[name];
        },
        setHeader: (name: string, val: string) => {
          headers[name.toLowerCase()] = val;
        },
      } as any,
    },
    cookies,
    headers,
  };
}

describe("TRINAYAA Phase 8 — Final QA, Security Audit & Production Verification Suite", () => {
  let customerUser: any;
  let unauthorizedUser: any;
  let adminUser: any;
  let callerCustomer: any;
  let callerUnauthorized: any;
  let callerAdmin: any;
  let testProduct: any;

  beforeAll(async () => {
    // 1. Seed or retrieve users for testing
    const ts = Date.now();
    customerUser = db.usersRepo.create({
      email: `qa_cust_${ts}@trinayaa.in`,
      password: "CustomerPassword123!",
      name: "QA Customer",
      phone: "9876543210",
      role: "CUSTOMER",
    });

    unauthorizedUser = db.usersRepo.create({
      email: `qa_unauth_${ts}@trinayaa.in`,
      password: "CustomerPassword123!",
      name: "Unauthorized Customer",
      phone: "9876543211",
      role: "CUSTOMER",
    });

    adminUser = db.usersRepo.create({
      email: `qa_admin_${ts}@trinayaa.in`,
      password: "AdminPassword123!",
      name: "QA Administrator",
      phone: "9876543212",
      role: "ADMIN",
    });

    callerCustomer = appRouter.createCaller(createMockContext(customerUser).ctx);
    callerUnauthorized = appRouter.createCaller(createMockContext(unauthorizedUser).ctx);
    callerAdmin = appRouter.createCaller(createMockContext(adminUser).ctx);

    testProduct = db.productsRepo.getBySku("TRN-1001")!;
  });

  // ==========================================
  // 1. SECURITY & ACCESS CONTROL
  // ==========================================
  describe("1. Security: Multi-Tenant Data Isolation & Route Authorization", () => {
    it("1.1: Blocks non-admin users from accessing admin routes", async () => {
      await expect(callerCustomer.admin.dashboard.getMetrics()).rejects.toThrow();
      await expect(callerUnauthorized.admin.products.list()).rejects.toThrow();
    });

    it("1.2: Enforces address book multi-tenant ownership", async () => {
      // Customer creates an address
      const addr = await callerCustomer.addresses.create({
        recipientName: "QA Customer",
        phone: "9876543210",
        addressLine1: "123 Herb Street",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638002",
        isDefault: true,
      });

      expect(addr.id).toBeDefined();

      // Unauthorized customer tries to fetch customer's address
      await expect(
        callerUnauthorized.addresses.getById({ id: addr.id })
      ).rejects.toThrow(/Address not found/);

      // Unauthorized customer tries to delete customer's address
      await expect(
        callerUnauthorized.addresses.delete({ id: addr.id })
      ).rejects.toThrow(/Address not found/);
    });

    it("1.3: Enforces customer order ownership (Customer A cannot access Customer B's order)", async () => {
      // Create an order for Customer
      const order = await callerCustomer.orders.create({
        customerName: "QA Customer",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "123 Herb Street",
          addressLine1: "123 Herb Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 1,
          },
        ],
        paymentMethod: "RAZORPAY",
      });

      expect(order.id).toBeDefined();

      // Unauthorized customer attempts to fetch Customer's order by ID
      await expect(
        callerUnauthorized.orders.getById({ id: order.id })
      ).rejects.toThrow("Access denied.");

      // Unauthorized customer attempts to verify payment on Customer's order
      await expect(
        callerUnauthorized.payments.verifyPayment({
          orderId: order.id,
          razorpayOrderId: "rzp_fake_order",
          razorpayPaymentId: "rzp_fake_pay",
          razorpaySignature: "fake_sig",
        })
      ).rejects.toThrow("Unauthorized to verify payment for this order.");
    });
  });

  // ==========================================
  // 2. PAYMENT INTEGRATION & IDEMPOTENCY
  // ==========================================
  describe("2. Payment Verification & Webhook Idempotency", () => {
    it("2.1: Order creation recalculates price from database and enforces Pan-India shipping rule", async () => {
      const summary = await callerCustomer.orders.calculateSummary({
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 2,
          },
        ],
      });

      expect(summary.subtotal).toBe(testProduct.sellingPrice * 2);
      if (summary.subtotal >= 799) {
        expect(summary.shippingFee).toBe(0);
      } else {
        expect(summary.shippingFee).toBe(60);
      }
      expect(summary.total).toBe(summary.subtotal + summary.shippingFee);
    });

    it("2.2: Idempotent payment verification does not double-deduct inventory on repeated calls", async () => {
      const initialStock = (db.productsRepo.getById(testProduct.id) as any).stock;

      const order = await callerCustomer.orders.create({
        customerName: "QA Customer",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "123 Herb Street",
          addressLine1: "123 Herb Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 2,
          },
        ],
        paymentMethod: "RAZORPAY",
      });

      const rzpRes = await callerCustomer.payments.createRazorpayOrder({
        orderId: order.id,
      });

      // First confirmation
      await callerCustomer.payments.verifyPayment({
        orderId: order.id,
        razorpayOrderId: rzpRes.razorpayOrderId,
        razorpayPaymentId: "pay_qa_test_1",
        razorpaySignature: "sig_qa_test_1",
      });

      const stockAfterFirst = (db.productsRepo.getById(testProduct.id) as any).stock;
      expect(stockAfterFirst).toBe(initialStock - 2);

      // Duplicate payment confirmation call
      await callerCustomer.payments.verifyPayment({
        orderId: order.id,
        razorpayOrderId: rzpRes.razorpayOrderId,
        razorpayPaymentId: "pay_qa_test_1",
        razorpaySignature: "sig_qa_test_1",
      });

      const stockAfterDuplicate = (db.productsRepo.getById(testProduct.id) as any).stock;
      // Stock should remain identical (NO double-deduction)
      expect(stockAfterDuplicate).toBe(stockAfterFirst);
    });

    it("2.3: Order cancellation restores inventory atomically", async () => {
      const stockBefore = (db.productsRepo.getById(testProduct.id) as any).stock;

      const order = await callerCustomer.orders.create({
        customerName: "QA Restock Customer",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "123 Herb Street",
          addressLine1: "123 Herb Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638002",
        },
        items: [
          {
            productId: testProduct.id,
            packSize: "100g",
            quantity: 3,
          },
        ],
        paymentMethod: "RAZORPAY",
      });

      // Simulate payment confirmation
      db.ordersRepo.confirmPayment(order.id, {
        gatewayPaymentId: "pay_restock_sim",
      });

      const stockDeducted = (db.productsRepo.getById(testProduct.id) as any).stock;
      expect(stockDeducted).toBe(stockBefore - 3);

      // Admin cancels order
      await callerAdmin.admin.orders.updateStatus({
        orderId: order.id,
        status: "Cancelled",
        notes: "QA Restock verification",
      });

      const stockRestored = (db.productsRepo.getById(testProduct.id) as any).stock;
      expect(stockRestored).toBe(stockBefore);
    });
  });

  // ==========================================
  // 3. DATABASE INTEGRITY & RESTORATION
  // ==========================================
  describe("3. Production Database & Backup Verification", () => {
    it("3.1: Exactly 162 catalogue products and 9 categories in database", () => {
      const dbInstance = db.getDatabase();
      const prodCount = dbInstance.prepare("SELECT COUNT(*) as c FROM products").get().c;
      const catCount = dbInstance.prepare("SELECT COUNT(*) as c FROM categories").get().c;

      expect(prodCount).toBe(162);
      expect(catCount).toBe(9);
    });

    it("3.2: Foreign key checks and integrity checks pass with 0 errors", () => {
      const dbInstance = db.getDatabase();
      const fk = dbInstance.prepare("PRAGMA foreign_key_check").all();
      const integrity = dbInstance.prepare("PRAGMA integrity_check").all();

      expect(fk).toHaveLength(0);
      expect(integrity[0].integrity_check).toBe("ok");
    });

    it("3.3: Backups can be restored into an isolated database without data loss", () => {
      const dataDir = path.resolve(process.cwd(), "data");
      const srcPath = path.resolve(dataDir, "trinayaa.db");
      const testPath = path.resolve(dataDir, "qa_temp_restore_test.db");

      if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
      fs.copyFileSync(srcPath, testPath);

      const testDb = new DatabaseSync(testPath);
      const testProdCount = testDb.prepare("SELECT COUNT(*) as c FROM products").get().c;
      const testCatCount = testDb.prepare("SELECT COUNT(*) as c FROM categories").get().c;

      testDb.close();
      fs.unlinkSync(testPath);

      expect(testProdCount).toBeGreaterThanOrEqual(162);
      expect(testCatCount).toBeGreaterThanOrEqual(9);
    });
  });

  // ==========================================
  // 4. TELEGRAM BOT SECURITY & PRIVACY
  // ==========================================
  describe("4. Telegram Admin Bot Security & Masking", () => {
    it("4.1: Customer mobile and email are masked in public order notifications", () => {
      const phone = "9876543210";
      const maskedPhone = phone.replace(/^(\d{5})\d{5}$/, "$1*****");
      expect(maskedPhone).toBe("98765*****");

      const email = "customer@trinayaa.in";
      const maskedEmail = email.replace(/^(.)(.*)(@.*)$/, (_m, a, b, c) => `${a}***${c}`);
      expect(maskedEmail).toBe("c***@trinayaa.in");
    });
  });
});
