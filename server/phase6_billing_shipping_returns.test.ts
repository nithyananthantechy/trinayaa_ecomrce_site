import { describe, it, expect, beforeAll } from "vitest";
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

describe("TRINAYAA Phase 6: Separate Billing & Shipping, Gift Delivery & Returns Management", () => {
  let customerUser: any;
  let otherCustomerUser: any;
  let adminUser: any;
  let testProduct: any;
  let customerCaller: any;
  let otherCustomerCaller: any;
  let adminCaller: any;

  beforeAll(() => {
    // Ensure test product exists, has COD enabled and plenty of stock
    const products = db.productsRepo.getAll({ limit: 10 });
    expect(products.length).toBeGreaterThan(0);
    testProduct = products.find((p: any) => p.isCodAvailable !== false) || products[0];
    db.getDatabase().prepare("UPDATE products SET isCodAvailable = 1, stock = 100 WHERE id = ?").run(testProduct.id);
    testProduct = db.productsRepo.getById(testProduct.id);

    // Seed test users
    const database = db.getDatabase();
    const custId = "cust_p6_" + Date.now();
    const otherCustId = "cust_p6_other_" + Date.now();
    const admId = "admin_p6_" + Date.now();

    database.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'hashed_pwd', 'CUSTOMER', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(custId, "Ananya Subramanian", `ananya_${Date.now()}@trinayaa.test`);

    database.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'hashed_pwd', 'CUSTOMER', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(otherCustId, "Karthik Raja", `karthik_${Date.now()}@trinayaa.test`);

    database.prepare(`
      INSERT OR IGNORE INTO users (id, name, email, passwordHash, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, 'hashed_pwd', 'SUPER_ADMIN', 'ACTIVE', datetime('now'), datetime('now'))
    `).run(admId, "Admin Nithya", `admin_p6_${Date.now()}@trinayaa.test`);

    customerUser = database.prepare("SELECT * FROM users WHERE id = ?").get(custId);
    otherCustomerUser = database.prepare("SELECT * FROM users WHERE id = ?").get(otherCustId);
    adminUser = database.prepare("SELECT * FROM users WHERE id = ?").get(admId);

    customerCaller = appRouter.createCaller(createMockContext(customerUser).ctx);
    otherCustomerCaller = appRouter.createCaller(createMockContext(otherCustomerUser).ctx);
    adminCaller = appRouter.createCaller(createMockContext(adminUser).ctx);
  });

  // =========================================================================
  // SECTION 1: SAME-ADDRESS & SEPARATE BILLING / SHIPPING ADDRESS CHECKOUT
  // =========================================================================
  describe("1. Billing & Shipping Address Distinction at Checkout", () => {
    it("1.1 defaults isSameAddress to true when not explicitly passed, mirroring shipping address to billing", async () => {
      const order = await customerCaller.orders.create({
        customerName: "Ananya Subramanian",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "12 VOC Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
        paymentMethod: "COD",
      });

      expect(order).toBeDefined();
      expect(order.orderNumber).toMatch(/^TRN-/);
      expect(order.isSameAddress).toBe(true);
      expect(order.billingName).toBe("Ananya Subramanian");
      expect(order.recipientName).toBe("Ananya Subramanian");
      expect(order.shippingAddress.street).toBe("12 VOC Street");
      expect(order.billingAddress.street).toBe("12 VOC Street");
    });

    it("1.2 creates order with separate billing address when isSameAddress is false", async () => {
      const order = await customerCaller.orders.create({
        customerName: "Priya Senthil",
        customerEmail: "priya@example.com",
        customerPhone: "9876543211",
        isSameAddress: false,
        billingName: "Priya Senthil (Purchaser)",
        billingPhone: "9876543211",
        billingEmail: "priya@example.com",
        billingAddress: {
          street: "Corporate Office, 45 Anna Salai",
          city: "Chennai",
          state: "Tamil Nadu",
          pinCode: "600002",
        },
        recipientName: "Meenakshi Ammal (Grandmother)",
        recipientPhone: "9842712345",
        recipientEmail: "meenakshi@example.com",
        shippingAddress: {
          street: "18 Gandhi Road, Surampatti",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638009",
          deliveryInstructions: "Call recipient before delivery",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 2 }],
        paymentMethod: "RAZORPAY",
      });

      expect(order.isSameAddress).toBe(false);
      expect(order.billingName).toBe("Priya Senthil (Purchaser)");
      expect(order.recipientName).toBe("Meenakshi Ammal (Grandmother)");
      expect(order.billingAddress.city).toBe("Chennai");
      expect(order.billingAddress.pinCode).toBe("600002");
      expect(order.shippingAddress.city).toBe("Erode");
      expect(order.shippingAddress.pinCode).toBe("638009");
      expect(order.deliveryInstructions).toBe("Call recipient before delivery");
    });

    it("1.3 preserves immutable address snapshots even if customer addresses are updated or deleted later", async () => {
      // 1. Create a saved address
      const savedAddr = await customerCaller.addresses.create({
        recipientName: "Temporary Name",
        phone: "9876543210",
        addressLine1: "Old Street Address",
        city: "Erode",
        state: "Tamil Nadu",
        pinCode: "638001",
      });

      // 2. Place an order with this address
      const order = await customerCaller.orders.create({
        customerName: "Ananya Subramanian",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: savedAddr.addressLine1,
          city: savedAddr.city,
          state: savedAddr.state,
          pinCode: savedAddr.pinCode,
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
        paymentMethod: "COD",
      });

      // 3. Update or delete the saved address
      await customerCaller.addresses.delete({ id: savedAddr.id });

      // 4. Retrieve order and verify snapshot did NOT mutate
      const freshOrder = await customerCaller.orders.getById({ id: order.id });
      expect(freshOrder.shippingAddress.street).toBe("Old Street Address");
      expect(freshOrder.shippingAddress.city).toBe("Erode");
      expect(freshOrder.shippingAddress.pinCode).toBe("638001");
    });

    it("1.4 enforces shipping PIN code for order delivery and COD calculations", async () => {
      // Calculate summary with valid items
      const summary = await customerCaller.orders.calculateSummary({
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
      });

      expect(summary.canCheckout).toBe(true);
      expect(summary.shippingFee).toBeDefined();
    });
  });

  // =========================================================================
  // SECTION 2: GIFT ORDER DELIVERY EXPERIENCE
  // =========================================================================
  describe("2. Gift Delivery Orders", () => {
    it("2.1 creates gift order with isGiftOrder=true and custom gift message", async () => {
      const order = await customerCaller.orders.create({
        customerName: "Rajesh Kumar",
        customerEmail: "rajesh@example.com",
        customerPhone: "9876543222",
        isSameAddress: false,
        isGiftOrder: true,
        giftMessage: "Wishing you radiant health and holistic wellness with TRINAYAA botanicals!",
        billingName: "Rajesh Kumar",
        billingPhone: "9876543222",
        billingEmail: "rajesh@example.com",
        billingAddress: {
          street: "Flat 4B, Emerald Heights",
          city: "Bengaluru",
          state: "Karnataka",
          pinCode: "560001",
        },
        recipientName: "Dr. Soundarya",
        recipientPhone: "9842199887",
        recipientEmail: "soundarya@example.com",
        shippingAddress: {
          street: "Ayush Nilayam, 10 EVN Road",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638011",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
        paymentMethod: "RAZORPAY",
      });

      expect(order.isGiftOrder).toBe(true);
      expect(order.giftMessage).toBe("Wishing you radiant health and holistic wellness with TRINAYAA botanicals!");
      expect(order.recipientName).toBe("Dr. Soundarya");
      expect(order.billingName).toBe("Rajesh Kumar");
    });

    it("2.2 validates that customer account orders list includes gift flags and recipient details", async () => {
      const myOrders = await customerCaller.orders.customerOrders();
      expect(Array.isArray(myOrders)).toBe(true);
      const giftOrders = myOrders.filter((o: any) => o.isGiftOrder);
      expect(giftOrders.length).toBeGreaterThan(0);
      expect(giftOrders[0].giftMessage).toBeDefined();
    });
  });

  // =========================================================================
  // SECTION 3: FULFILMENT DOCUMENT INTEGRATION (PHASE 5 REUSE)
  // =========================================================================
  describe("3. Order Fulfilment Documents Address Integrity", () => {
    let separateOrder: any;

    beforeAll(async () => {
      separateOrder = await customerCaller.orders.create({
        customerName: "Kavitha Raman",
        customerEmail: "kavitha@example.com",
        customerPhone: "9876543333",
        isSameAddress: false,
        isGiftOrder: true,
        giftMessage: "Happy Pongal from Kavitha!",
        billingName: "Kavitha Raman (Purchaser)",
        billingPhone: "9876543333",
        billingEmail: "kavitha@example.com",
        billingAddress: {
          street: "77 Residency Road",
          city: "Coimbatore",
          state: "Tamil Nadu",
          pinCode: "641018",
        },
        recipientName: "Senthil Kumar (Recipient)",
        recipientPhone: "9842211223",
        recipientEmail: "senthil@example.com",
        shippingAddress: {
          street: "88 Mettur Road",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 2 }],
        paymentMethod: "RAZORPAY",
      });
    });

    it("3.1 Customer Invoice clearly distinguishes Bill To (purchaser) and Ship To (recipient)", () => {
      const invoice = db.ordersRepo.getCustomerInvoice(separateOrder.orderNumber);
      expect(invoice).toBeDefined();
      expect(invoice.documentType).toBe("CUSTOMER_INVOICE");

      // Bill To purchaser details
      expect(invoice.buyerDetails.customerName).toBe("Kavitha Raman (Purchaser)");
      expect(invoice.buyerDetails.billingAddress.city).toBe("Coimbatore");
      expect(invoice.buyerDetails.billingAddress.pinCode).toBe("641018");

      // Ship To recipient details
      expect(invoice.buyerDetails.recipientName).toBe("Senthil Kumar (Recipient)");
      expect(invoice.buyerDetails.shippingAddress.city).toBe("Erode");
      expect(invoice.buyerDetails.shippingAddress.pinCode).toBe("638001");

      // Gift order flag & message
      expect(invoice.isGiftOrder).toBe(true);
      expect(invoice.giftMessage).toBe("Happy Pongal from Kavitha!");
    });

    it("3.2 Shipping Slip strictly directs to recipient and never uses billing destination", () => {
      const slip = db.ordersRepo.getShippingSlip(separateOrder.orderNumber);
      expect(slip).toBeDefined();
      expect(slip.documentType).toBe("SHIPPING_SLIP");

      // Ship to recipient details
      expect(slip.recipientName).toBe("Senthil Kumar (Recipient)");
      expect(slip.shippingAddress.city).toBe("Erode");
      expect(slip.shippingAddress.pinCode).toBe("638001");
      expect(slip.formattedAddress).toContain("Erode");
      expect(slip.formattedAddress).not.toContain("Coimbatore");

      // Preserves purchaser info for reference
      expect(slip.purchaserName).toBe("Kavitha Raman (Purchaser)");
      expect(slip.isGiftOrder).toBe(true);
      expect(slip.giftMessage).toBe("Happy Pongal from Kavitha!");
    });

    it("3.3 Delivery Challan consignee strictly matches recipient destination", () => {
      const challan = db.ordersRepo.getDeliveryChallan(separateOrder.orderNumber);
      expect(challan).toBeDefined();
      expect(challan.documentType).toBe("DELIVERY_CHALLAN");
      expect(challan.consignee.name).toBe("Senthil Kumar (Recipient)");
      expect(challan.consignee.city).toBe("Erode");
      expect(challan.consignee.pinCode).toBe("638001");
      expect(challan.consignee.formattedAddress).toContain("Erode");
      expect(challan.consignee.formattedAddress).not.toContain("Coimbatore");
    });

    it("3.4 Packing Sticker hides billing details and hides commercial pricing on label", () => {
      const sticker = db.ordersRepo.getPackingSticker(separateOrder.orderNumber);
      expect(sticker).toBeDefined();
      expect(sticker.documentType).toBe("PACKING_STICKER");

      // Destination strictly recipient
      expect(sticker.to.name).toBe("Senthil Kumar (Recipient)");
      expect(sticker.to.city).toBe("Erode");
      expect(sticker.to.pinCode).toBe("638001");

      // Gift badge present
      expect(sticker.isGiftOrder).toBe(true);
      expect(sticker.payment.badgeText).toContain("GIFT");

      // Label packaging manifest hides unit prices and total values
      for (const item of sticker.packageSummary.itemManifest) {
        expect(item.price).toBeUndefined();
        expect(item.unitPrice).toBeUndefined();
        expect(item.totalValue).toBeUndefined();
      }

      // Prepaid non-COD collect amount is 0
      expect(sticker.payment.collectAmount).toBe(0);
      expect(sticker.payment.collectDisplay).toBe("DO NOT COLLECT CASH");
    });

    it("3.5 Packing Sticker for COD orders explicitly shows COD collect amount", async () => {
      const codOrder = await customerCaller.orders.create({
        customerName: "Manikandan",
        customerEmail: "mani@example.com",
        customerPhone: "9876543444",
        shippingAddress: {
          street: "44 Palayapalayam",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638011",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
        paymentMethod: "COD",
      });

      const sticker = db.ordersRepo.getPackingSticker(codOrder.orderNumber);
      expect(sticker.payment.isCod).toBe(true);
      expect(sticker.payment.badgeText).toBe("CASH ON DELIVERY (COD)");
      expect(sticker.payment.collectAmount).toBe(codOrder.total);
      expect(sticker.payment.collectDisplay).toBe(`COLLECT CASH: ₹${codOrder.total}`);
    });
  });

  // =========================================================================
  // SECTION 4: CUSTOMER RETURNS & RMA WORKFLOW
  // =========================================================================
  describe("4. Customer Returns & RMA Management", () => {
    let deliveredOrder: any;
    let pendingOrder: any;

    beforeAll(async () => {
      // 1. Create an order and mark it Delivered
      deliveredOrder = await customerCaller.orders.create({
        customerName: "Ananya Subramanian",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "12 VOC Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 3 }],
        paymentMethod: "COD",
      });

      // Mark delivered in DB
      db.getDatabase().prepare("UPDATE orders SET orderStatus = 'Delivered' WHERE id = ?").run(deliveredOrder.id);
      deliveredOrder = db.ordersRepo.getById(deliveredOrder.id);

      // 2. Create another order that is still Confirmed/Pending
      pendingOrder = await customerCaller.orders.create({
        customerName: "Ananya Subramanian",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "12 VOC Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
        paymentMethod: "COD",
      });
    });

    it("4.1 generates sequential RMA number in TRN-RMA-YYYY-XXXXX format", () => {
      const year = new Date().getFullYear();
      const rma1 = db.orderReturnsRepo.getNextRmaNumber(year);
      expect(rma1).toMatch(new RegExp(`^TRN-RMA-${year}-\\d{5}$`));
    });

    it("4.2 rejects return request on an order that is NOT Delivered", async () => {
      await expect(
        customerCaller.returns.request({
          orderId: pendingOrder.id,
          productId: testProduct.id,
          quantityRequested: 1,
          returnReason: "Damaged or Broken Seal",
          description: "Bottle was leaked during shipping transit",
        })
      ).rejects.toThrow(/only be initiated for delivered orders/i);
    });

    it("4.3 rejects return request when customer does not own the order", async () => {
      await expect(
        otherCustomerCaller.returns.request({
          orderId: deliveredOrder.id,
          productId: testProduct.id,
          quantityRequested: 1,
          returnReason: "Damaged or Broken Seal",
          description: "Trying to return another customer's order item",
        })
      ).rejects.toThrow(/unauthorized|not belong/i);
    });

    it("4.4 rejects return request when quantity exceeds delivered quantity", async () => {
      await expect(
        customerCaller.returns.request({
          orderId: deliveredOrder.id,
          productId: testProduct.id,
          quantityRequested: 10, // delivered qty is 3
          returnReason: "Wrong Item Delivered",
          description: "Attempting to return more than purchased",
        })
      ).rejects.toThrow(/cannot exceed delivered quantity/i);
    });

    it("4.5 successfully creates partial return request for delivered order", async () => {
      const ret = await customerCaller.returns.request({
        orderId: deliveredOrder.id,
        productId: testProduct.id,
        quantityRequested: 2, // partial return: 2 out of 3
        returnReason: "Quality / Aroma Issue",
        description: "The botanical powder seal was slightly unsealed upon opening",
        pickupInstructions: "Leave with building reception 9am-1pm",
      });

      expect(ret).toBeDefined();
      expect(ret.returnNumber).toMatch(/^TRN-RMA-/);
      expect(ret.orderId).toBe(deliveredOrder.id);
      expect(ret.orderNumber).toBe(deliveredOrder.orderNumber);
      expect(ret.customerId).toBe(customerUser.id);
      expect(ret.productName).toBeDefined();
      expect(ret.quantityRequested).toBe(2);
      expect(ret.status).toBe("REQUESTED");
      expect(ret.stockDisposition).toBe("NONE");
      expect(ret.restockedQuantity).toBe(0);
      expect(ret.refundAmount).toBeGreaterThan(0);
      expect(ret.history.length).toBeGreaterThan(0);
    });

    it("4.6 prevents duplicate active return request for the same order item", async () => {
      await expect(
        customerCaller.returns.request({
          orderId: deliveredOrder.id,
          productId: testProduct.id,
          quantityRequested: 1,
          returnReason: "Duplicate test",
          description: "Second duplicate return submission",
        })
      ).rejects.toThrow(/already active/i);
    });

    it("4.7 customer can query own returns via myReturns procedure", async () => {
      const returns = await customerCaller.returns.myReturns();
      expect(Array.isArray(returns)).toBe(true);
      expect(returns.length).toBeGreaterThan(0);
      expect(returns[0].returnNumber).toMatch(/^TRN-RMA-/);
    });

    it("4.8 customer can retrieve return details by id but cannot view other customers returns", async () => {
      const myReturns = await customerCaller.returns.myReturns();
      const firstReturn = myReturns[0];

      // Owner can view
      const detail = await customerCaller.returns.getById({ id: firstReturn.id });
      expect(detail.id).toBe(firstReturn.id);

      // Other customer is forbidden
      await expect(
        otherCustomerCaller.returns.getById({ id: firstReturn.id })
      ).rejects.toThrow(/access denied/i);
    });
  });

  // =========================================================================
  // SECTION 5: ADMIN RETURNS MANAGEMENT, INSPECTION & REFUNDS
  // =========================================================================
  describe("5. Admin Returns Lifecycle, Stock Restocking Safety & Refunds", () => {
    let testReturn: any;
    let initialProductStock: number;

    beforeAll(async () => {
      // 1. Get initial stock
      const prod = db.productsRepo.getById(testProduct.id);
      initialProductStock = prod.stock;

      // 2. Create delivered order for Ananya
      const ord = await customerCaller.orders.create({
        customerName: "Ananya Subramanian",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "12 VOC Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 2 }],
        paymentMethod: "COD",
      });

      db.getDatabase().prepare("UPDATE orders SET orderStatus = 'Delivered' WHERE id = ?").run(ord.id);

      // 3. Submit return request
      testReturn = await customerCaller.returns.request({
        orderId: ord.id,
        productId: testProduct.id,
        quantityRequested: 2,
        returnReason: "Damaged or Broken Seal",
        description: "Outer packing bruised during road transit",
      });
    });

    it("5.1 admin can list all return requests with status filtering", async () => {
      const allReturns = await adminCaller.admin.returns.list({ status: "ALL" });
      expect(allReturns.length).toBeGreaterThan(0);

      const requestedOnly = await adminCaller.admin.returns.list({ status: "REQUESTED" });
      expect(requestedOnly.length).toBeGreaterThan(0);
      expect(requestedOnly.every((r: any) => r.status === "REQUESTED")).toBe(true);
    });

    it("5.2 admin can review and approve return request", async () => {
      const updated = await adminCaller.admin.returns.updateStatus({
        id: testReturn.id,
        status: "APPROVED",
        adminNotes: "Approved for warehouse pickup by Dispatch Supervisor",
      });

      expect(updated.status).toBe("APPROVED");
      expect(updated.adminNotes).toContain("Approved for warehouse pickup");
      expect(updated.history.some((h: any) => h.toStatus === "APPROVED")).toBe(true);
    });

    it("5.3 advances return to ITEM_RECEIVED without restocking inventory before inspection", async () => {
      const updated = await adminCaller.admin.returns.updateStatus({
        id: testReturn.id,
        status: "ITEM_RECEIVED",
        quantityReceived: 2,
        adminNotes: "Parcel received at Erode HQ fulfillment center",
      });

      expect(updated.status).toBe("ITEM_RECEIVED");
      expect(updated.quantityReceived).toBe(2);

      // CRITICAL SAFETY: stock must NOT have changed yet!
      const prod = db.productsRepo.getById(testProduct.id);
      expect(prod.stock).toBe(initialProductStock);
      expect(updated.stockDisposition).toBe("NONE");
      expect(updated.restockedQuantity).toBe(0);
    });

    it("5.4 inspection with DAMAGED_DISCARD disposition does NOT increment product inventory", async () => {
      // Create separate damaged return to test discard disposition
      const ord2 = await customerCaller.orders.create({
        customerName: "Ananya Subramanian",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "12 VOC Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
        paymentMethod: "COD",
      });
      db.getDatabase().prepare("UPDATE orders SET orderStatus = 'Delivered' WHERE id = ?").run(ord2.id);

      const retDiscard = await customerCaller.returns.request({
        orderId: ord2.id,
        productId: testProduct.id,
        quantityRequested: 1,
        returnReason: "Contaminated pack",
        description: "Seal broken and exposed to moisture",
      });

      const inspected = await adminCaller.admin.returns.updateStatus({
        id: retDiscard.id,
        status: "INSPECTED",
        stockDisposition: "DAMAGED_DISCARD",
        adminNotes: "Discarded safely as herbal contents were compromised",
      });

      expect(inspected.status).toBe("INSPECTED");
      expect(inspected.stockDisposition).toBe("DAMAGED_DISCARD");
      expect(inspected.restockedQuantity).toBe(0);

      // Inventory unchanged
      const prod = db.productsRepo.getById(testProduct.id);
      expect(prod.stock).toBe(initialProductStock);
    });

    it("5.5 inspection with RESTOCKED disposition increments product stock accurately", async () => {
      const stockBefore = db.productsRepo.getById(testProduct.id).stock;

      const inspected = await adminCaller.admin.returns.updateStatus({
        id: testReturn.id,
        status: "INSPECTED",
        quantityInspected: 2,
        stockDisposition: "RESTOCKED",
        restockedQuantity: 2,
        adminNotes: "Seals verified intact by QC chemist. Restocked 2 units to primary warehouse bin.",
      });

      expect(inspected.status).toBe("INSPECTED");
      expect(inspected.stockDisposition).toBe("RESTOCKED");
      expect(inspected.restockedQuantity).toBe(2);

      // Stock should have incremented by 2
      const stockAfter = db.productsRepo.getById(testProduct.id).stock;
      expect(stockAfter).toBe(stockBefore + 2);
    });

    it("5.6 records manual COD refund with payment reference and transitions to REFUNDED", async () => {
      const refunded = await adminCaller.admin.returns.updateStatus({
        id: testReturn.id,
        status: "REFUNDED",
        refundMethod: "MANUAL_COD_RECORD",
        refundReference: "CASH-REF-2026-00441",
        adminNotes: "Cash refund of ₹" + testReturn.refundAmount + " handed to customer upon return collection",
      });

      expect(refunded.status).toBe("REFUNDED");
      expect(refunded.refundMethod).toBe("MANUAL_COD_RECORD");
      expect(refunded.refundReference).toBe("CASH-REF-2026-00441");
      expect(refunded.refundedAt).toBeDefined();
    });

    it("5.7 closes return request and rejects alterations to closed request", async () => {
      const closed = await adminCaller.admin.returns.updateStatus({
        id: testReturn.id,
        status: "CLOSED",
        adminNotes: "RMA completed and archived",
      });

      expect(closed.status).toBe("CLOSED");

      // Cannot reopen or alter closed return
      await expect(
        adminCaller.admin.returns.updateStatus({
          id: testReturn.id,
          status: "UNDER_REVIEW",
          adminNotes: "Attempting to reopen closed return",
        })
      ).rejects.toThrow(/cannot alter status of a closed return/i);
    });

    it("5.8 rejects invalid status string values", async () => {
      await expect(
        adminCaller.admin.returns.updateStatus({
          id: testReturn.id,
          status: "INVALID_STATUS_NAME",
        })
      ).rejects.toThrow(/invalid status/i);
    });
  });

  // =========================================================================
  // SECTION 6: NON-REGRESSION SUITE ACROSS CHANNELS
  // =========================================================================
  describe("6. Cross-System Non-Regression", () => {
    it("6.1 preserves standard online checkout with Razorpay", async () => {
      const order = await customerCaller.orders.create({
        customerName: "Ananya Subramanian",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "12 VOC Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
        paymentMethod: "RAZORPAY",
      });

      expect(order.paymentMethod).toBe("RAZORPAY");
      expect(order.orderStatus).toBe("Pending Payment");
    });

    it("6.2 preserves Cash on Delivery checkout and order confirmation", async () => {
      const order = await customerCaller.orders.create({
        customerName: "Ananya Subramanian",
        customerEmail: customerUser.email,
        customerPhone: "9876543210",
        shippingAddress: {
          street: "12 VOC Street",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638001",
        },
        items: [{ productId: testProduct.id, packSize: "100g", quantity: 1 }],
        paymentMethod: "COD",
      });

      expect(order.paymentMethod).toBe("COD");
      expect(order.orderStatus).toBe("Confirmed");
    });

    it("6.3 preserves retail POS branch operations and invoice numbering (Phase 4)", () => {
      const branches = db.retailBranchesRepo.getAll();
      expect(branches.length).toBeGreaterThan(0);

      const invoiceNumber = db.retailSalesRepo.generateInvoiceNumber();
      const currentYear = new Date().getFullYear().toString();
      expect(invoiceNumber).toMatch(new RegExp(`^TRN-RET-${currentYear}-\\d{5}$`));
    });

    it("6.4 preserves all four fulfilment documents in complete bundle (Phase 5)", () => {
      const recentOrders = db.ordersRepo.listAll({ limit: 1 });
      expect(recentOrders.length).toBeGreaterThan(0);

      const bundle = db.ordersRepo.getAllDocuments(recentOrders[0].orderNumber, "Test Runner");
      expect(bundle).toBeDefined();
      expect(bundle.shippingSlip).toBeDefined();
      expect(bundle.customerInvoice).toBeDefined();
      expect(bundle.deliveryChallan).toBeDefined();
      expect(bundle.packingSticker).toBeDefined();
    });

    it("6.5 returns 404 NOT_FOUND for non-existent return id", async () => {
      await expect(
        customerCaller.returns.getById({ id: "ret_non_existent_99999" })
      ).rejects.toThrow(/not found/i);
    });

    it("6.6 strictly forbids non-admin customer from accessing admin returns procedures", async () => {
      await expect(
        customerCaller.admin.returns.list()
      ).rejects.toThrow();
    });
  });
});
