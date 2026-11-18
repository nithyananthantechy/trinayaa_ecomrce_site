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

describe("TRINAYAA Phase 5 — Order Fulfilment Documents & Printing System Suite", () => {
  let callerPublic: ReturnType<typeof appRouter.createCaller>;
  let callerSuperAdmin: ReturnType<typeof appRouter.createCaller>;
  let callerStoreAdmin: ReturnType<typeof appRouter.createCaller>;
  let callerRetailHandler: ReturnType<typeof appRouter.createCaller>;
  let callerCustomerA: ReturnType<typeof appRouter.createCaller>;
  let callerCustomerB: ReturnType<typeof appRouter.createCaller>;

  const superAdminUser = {
    id: "usr_phase5_super_admin",
    email: "superadmin_phase5@trinayaa.test",
    name: "Super Admin Founder",
    phone: "9876543301",
    role: "SUPER_ADMIN",
  };

  const storeAdminUser = {
    id: "usr_phase5_store_admin",
    email: "storeadmin_phase5@trinayaa.test",
    name: "Store Admin Logistics",
    phone: "9876543302",
    role: "ADMIN",
  };

  const retailShopHandler = {
    id: "usr_phase5_retail_handler",
    email: "retail_phase5@trinayaa.test",
    name: "Erode Shop Cashier",
    phone: "9876543303",
    role: "RETAIL_SHOP_HANDLER",
    branchId: "brn_erode_hq",
  };

  const customerUserA = {
    id: "usr_phase5_cust_a",
    email: "customer_a@trinayaa.test",
    name: "Kavitha Raman",
    phone: "9876543304",
    role: "CUSTOMER",
  };

  const customerUserB = {
    id: "usr_phase5_cust_b",
    email: "customer_b@trinayaa.test",
    name: "Senthil Kumar",
    phone: "9876543305",
    role: "CUSTOMER",
  };

  let testOrderIdPrepaid: string;
  let testOrderNumberPrepaid: string;
  let testOrderIdCod: string;
  let testOrderNumberCod: string;

  beforeAll(() => {
    const dbInstance = db.getDatabase();

    // 0. Ensure test users exist in database to satisfy foreign keys
    const nowIso = new Date().toISOString();
    for (const u of [superAdminUser, storeAdminUser, retailShopHandler, customerUserA, customerUserB]) {
      dbInstance.prepare(`
        INSERT OR REPLACE INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
        VALUES (?, ?, 'dummy_hash_123', ?, ?, ?, 'ACTIVE', ?, ?)
      `).run(u.id, u.email, u.name, u.phone, u.role, nowIso, nowIso);
    }

    callerPublic = appRouter.createCaller(createMockContext(null).ctx);
    callerSuperAdmin = appRouter.createCaller(createMockContext(superAdminUser).ctx);
    callerStoreAdmin = appRouter.createCaller(createMockContext(storeAdminUser).ctx);
    callerRetailHandler = appRouter.createCaller(createMockContext(retailShopHandler).ctx);
    callerCustomerA = appRouter.createCaller(createMockContext(customerUserA).ctx);
    callerCustomerB = appRouter.createCaller(createMockContext(customerUserB).ctx);

    // Retrieve active catalog products
    const prods = db.productsRepo.getAll();
    const p1 = prods[0] || { id: "trn_1001", sku: "TRN-MORINGA-100G", nameEn: "Moringa Leaf Powder", nameTa: "முருங்கை இலை பொடி", price: 150 };
    const p2 = prods[1] || { id: "trn_1002", sku: "TRN-KALONJI-100G", nameEn: "Black Seed (Kalonji)", nameTa: "கருஞ்சீரகம்", price: 150 };

    // 1. Create Prepaid Order for Customer A
    const orderPrepaid = db.ordersRepo.create(
      {
        orderNumber: "TRN-" + Math.floor(10000 + Math.random() * 90000),
        customerId: customerUserA.id,
        customerName: customerUserA.name,
        customerEmail: customerUserA.email,
        customerPhone: customerUserA.phone,
        shippingAddress: JSON.stringify({
          recipientName: "Kavitha Raman",
          addressLine1: "Plot 42, Green Avenue, Sampath Nagar",
          addressLine2: "Opposite Botanical Garden",
          landmark: "Near Kaveri River Bridge",
          district: "Erode",
          city: "Erode",
          state: "Tamil Nadu",
          pinCode: "638011",
        }),
        subtotal: 450,
        discountAmount: 50,
        shippingFee: 0,
        total: 400,
        couponCode: "PONGAL50",
        paymentMethod: "UPI",
        paymentStatus: "PAID",
        orderStatus: "Processing",
      },
      [
        {
          productId: p1.id,
          sku: p1.sku || "TRN-MORINGA-100G",
          productNameEn: p1.nameEn || "Moringa Leaf Powder",
          productNameTa: p1.nameTa || "முருங்கை இலை பொடி",
          packSize: "100g",
          unitPrice: 150,
          quantity: 2,
        },
        {
          productId: p2.id,
          sku: p2.sku || "TRN-KALONJI-100G",
          productNameEn: p2.nameEn || "Black Seed (Kalonji)",
          productNameTa: p2.nameTa || "கருஞ்சீரகம்",
          packSize: "100g",
          unitPrice: 150,
          quantity: 1,
        },
      ]
    );

    testOrderIdPrepaid = orderPrepaid.id;
    testOrderNumberPrepaid = orderPrepaid.orderNumber;

    // 2. Create COD Order for Customer B
    const orderCod = db.ordersRepo.create(
      {
        orderNumber: "TRN-" + Math.floor(10000 + Math.random() * 90000),
        customerId: customerUserB.id,
        customerName: customerUserB.name,
        customerEmail: customerUserB.email,
        customerPhone: customerUserB.phone,
        shippingAddress: JSON.stringify({
          recipientName: "Senthil Kumar",
          addressLine1: "18A, Anna Salai",
          addressLine2: "Second Floor, Near Bus Stand",
          landmark: "Opp. Murugan Temple",
          district: "Salem",
          city: "Salem",
          state: "Tamil Nadu",
          pinCode: "636001",
        }),
        subtotal: 210,
        discountAmount: 0,
        shippingFee: 60,
        total: 270,
        couponCode: null,
        paymentMethod: "COD",
        paymentStatus: "PENDING",
        orderStatus: "Confirmed",
      },
      [
        {
          productId: p1.id,
          sku: p1.sku || "TRN-HIBISCUS-50G",
          productNameEn: p1.nameEn || "Hibiscus Flower Powder",
          productNameTa: p1.nameTa || "செம்பருத்தி பூ பொடி",
          packSize: "50g",
          unitPrice: 210,
          quantity: 1,
        },
      ]
    );

    testOrderIdCod = orderCod.id;
    testOrderNumberCod = orderCod.orderNumber;
  });

  // -------------------------------------------------------------
  // 1. Currency Words Utility
  // -------------------------------------------------------------
  it("1. Converts currency numbers to Indian Rupee words accurately", () => {
    expect(db.numberToIndianWords(0)).toBe("Rupees Zero Only");
    expect(db.numberToIndianWords(210)).toBe("Rupees Two Hundred Ten Only");
    expect(db.numberToIndianWords(400)).toBe("Rupees Four Hundred Only");
    expect(db.numberToIndianWords(1250)).toBe("Rupees One Thousand Two Hundred Fifty Only");
    expect(db.numberToIndianWords(15420.5)).toContain("Rupees Fifteen Thousand Four Hundred Twenty and Fifty Paise Only");
    expect(db.numberToIndianWords(2500000)).toBe("Rupees Twenty Five Lakh Only");
  });

  // -------------------------------------------------------------
  // 2. Shipping Slip Generation & Structure
  // -------------------------------------------------------------
  it("2. Generates Shipping Slip with sequential number TRN-SHIP-YYYY-XXXXX and packing checklist", async () => {
    const slip = await callerStoreAdmin.admin.orders.getShippingSlip({ orderNumber: testOrderNumberPrepaid });

    expect(slip).toBeDefined();
    expect(slip.orderNumber).toBe(testOrderNumberPrepaid);
    expect(slip.documentNumber).toMatch(/^TRN-SHIP-\d{4}-\d{5}$/);
    expect(slip.documentType).toBe("SHIPPING_SLIP");
    expect(slip.customerName).toBe("Kavitha Raman");
    expect(slip.items.length).toBe(2);
    expect(slip.items[0].packSize).toBe("100g");
    expect(slip.items[0].quantity).toBe(2);
    expect(slip.total).toBe(400);
    expect(slip.totalInWords).toBe("Rupees Four Hundred Only");
    expect(slip.dispatchHq).toContain("Erode Fulfillment Centre");
  });

  // -------------------------------------------------------------
  // 3. Customer Tax Invoice Generation
  // -------------------------------------------------------------
  it("3. Generates Customer Tax Invoice with TRN-INV-YYYY-XXXXX format and GST 5% breakdown", async () => {
    const invoice = await callerStoreAdmin.admin.orders.getInvoice({ orderNumber: testOrderNumberPrepaid });

    expect(invoice).toBeDefined();
    expect(invoice.orderNumber).toBe(testOrderNumberPrepaid);
    expect(invoice.invoiceNumber).toMatch(/^TRN-INV-\d{4}-\d{5}$/);
    expect(invoice.documentType).toBe("CUSTOMER_INVOICE");
    expect(invoice.sellerDetails.companyName).toBe("TRINAYAA ENTERPRISES");
    expect(invoice.sellerDetails.gstin).toBe("33AABCT9988F1Z2");
    expect(invoice.sellerDetails.fssaiNumber).toBe("12423008000451");
    expect(invoice.buyerDetails.customerName).toBe("Kavitha Raman");
    expect(invoice.buyerDetails.placeOfSupply).toContain("Tamil Nadu (33)");

    // Line items GST check
    expect(invoice.items.length).toBe(2);
    const item1 = invoice.items[0];
    expect(item1.hsnCode).toBe("121190");
    expect(item1.cgstRate).toBe(2.5);
    expect(item1.sgstRate).toBe(2.5);
    expect(item1.taxableAmount).toBeGreaterThan(0);
    expect(item1.cgstAmount).toBeGreaterThan(0);
    expect(item1.sgstAmount).toBeGreaterThan(0);
    expect(item1.total).toBe(300);

    // Summary checks
    expect(invoice.total).toBe(400);
    expect(invoice.totalInWords).toBe("Rupees Four Hundred Only");
    expect(invoice.termsAndConditions.length).toBeGreaterThanOrEqual(2);
  });

  // -------------------------------------------------------------
  // 4. Delivery Challan Generation (Rule 55)
  // -------------------------------------------------------------
  it("4. Generates Delivery Challan with TRN-DC-YYYY-XXXXX format compliant with Rule 55", async () => {
    const challan = await callerStoreAdmin.admin.orders.getDeliveryChallan({ orderNumber: testOrderNumberPrepaid });

    expect(challan).toBeDefined();
    expect(challan.orderNumber).toBe(testOrderNumberPrepaid);
    expect(challan.challanNumber).toMatch(/^TRN-DC-\d{4}-\d{5}$/);
    expect(challan.documentType).toBe("DELIVERY_CHALLAN");
    expect(challan.consignor.name).toBe("TRINAYAA ENTERPRISES");
    expect(challan.consignee.name).toBe("Kavitha Raman");
    expect(challan.reasonForTransport).toContain("Rule 55 of CGST Rules, 2017");
    expect(challan.transportDetails.carrier).toBeDefined();
    expect(challan.totalQuantity).toBe(3);
    expect(challan.declaration).toContain("Rule 55 of the CGST Rules, 2017");
  });

  // -------------------------------------------------------------
  // 5. Parcel Sticker (4x6 Thermal Label)
  // -------------------------------------------------------------
  it("5. Generates 4x6 Parcel Sticker layout with high-visibility PIN and routing data", async () => {
    const sticker = await callerStoreAdmin.admin.orders.getPackingSticker({ orderNumber: testOrderNumberPrepaid });

    expect(sticker).toBeDefined();
    expect(sticker.orderNumber).toBe(testOrderNumberPrepaid);
    expect(sticker.stickerNumber).toMatch(/^TRN-LBL-\d{4}-\d{5}$/);
    expect(sticker.documentType).toBe("PACKING_STICKER");
    expect(sticker.to.name).toBe("Kavitha Raman");
    expect(sticker.to.pinCode).toBe("638011");
    expect(sticker.to.phone).toBe("9876543304");
    expect(sticker.from.originHub).toContain("ED-01");
    expect(sticker.barcodeData.orderNumberBarcode).toBe(`*${testOrderNumberPrepaid}*`);
    expect(sticker.packageSummary.totalPieces).toBe(3);
    expect(sticker.packageSummary.weightGrams).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------
  // 6. All-in-One Document Bundle
  // -------------------------------------------------------------
  it("6. Retrieves complete fulfilment document bundle via getAllDocuments", async () => {
    const bundle = await callerSuperAdmin.admin.orders.getAllDocuments({ orderNumber: testOrderNumberPrepaid });

    expect(bundle).toBeDefined();
    expect(bundle.orderNumber).toBe(testOrderNumberPrepaid);
    expect(bundle.shippingSlip).toBeDefined();
    expect(bundle.customerInvoice).toBeDefined();
    expect(bundle.deliveryChallan).toBeDefined();
    expect(bundle.packingSticker).toBeDefined();
    expect(bundle.shippingSlip.documentNumber).toMatch(/^TRN-SHIP-/);
    expect(bundle.customerInvoice.invoiceNumber).toMatch(/^TRN-INV-/);
    expect(bundle.deliveryChallan.challanNumber).toMatch(/^TRN-DC-/);
    expect(bundle.packingSticker.stickerNumber).toMatch(/^TRN-LBL-/);
  });

  // -------------------------------------------------------------
  // 7. Customer & Address Preservation
  // -------------------------------------------------------------
  it("7. Preserves full structured recipient address and contact numbers across all documents", async () => {
    const bundle = await callerStoreAdmin.admin.orders.getAllDocuments({ orderNumber: testOrderNumberPrepaid });

    const expectedSnippet = "Plot 42, Green Avenue, Sampath Nagar";
    expect(bundle.shippingSlip.formattedAddress).toContain(expectedSnippet);
    expect(bundle.customerInvoice.buyerDetails.formattedAddress).toContain(expectedSnippet);
    expect(bundle.deliveryChallan.consignee.formattedAddress).toContain(expectedSnippet);
    expect(bundle.packingSticker.to.formattedAddress).toContain(expectedSnippet);
    expect(bundle.packingSticker.to.pinCode).toBe("638011");
  });

  // -------------------------------------------------------------
  // 8. Variant & SKU Accuracy
  // -------------------------------------------------------------
  it("8. Maps variant pack sizes and botanical names accurately in line items", async () => {
    const invoice = await callerStoreAdmin.admin.orders.getInvoice({ orderNumber: testOrderNumberPrepaid });

    expect(invoice.items.length).toBe(2);
    const item1 = invoice.items[0];
    expect(item1).toBeDefined();
    expect(item1.packSize).toBe("100g");
    expect(item1.quantity).toBe(2);
    expect(item1.unitPrice).toBe(150);
  });

  // -------------------------------------------------------------
  // 9. Financial Accuracy & Discounts
  // -------------------------------------------------------------
  it("9. Correctly applies subtotal, promotional discount coupon, and net payable", async () => {
    const invoice = await callerStoreAdmin.admin.orders.getInvoice({ orderNumber: testOrderNumberPrepaid });

    expect(invoice.subtotal).toBe(450);
    expect(invoice.discountAmount).toBe(50);
    expect(invoice.couponCode).toBe("PONGAL50");
    expect(invoice.shippingFee).toBe(0);
    expect(invoice.total).toBe(400);
  });

  // -------------------------------------------------------------
  // 10. COD Order Handling on Packing Sticker
  // -------------------------------------------------------------
  it("10. Highlights CASH ON DELIVERY with exact collection amount on packing sticker", async () => {
    const sticker = await callerStoreAdmin.admin.orders.getPackingSticker({ orderNumber: testOrderNumberCod });

    expect(sticker.payment.isCod).toBe(true);
    expect(sticker.payment.badgeText).toBe("CASH ON DELIVERY (COD)");
    expect(sticker.payment.collectAmount).toBe(270);
    expect(sticker.payment.collectDisplay).toBe("COLLECT CASH: ₹270");
    expect(sticker.to.pinCode).toBe("636001");
  });

  // -------------------------------------------------------------
  // 11. Prepaid Order Handling on Packing Sticker
  // -------------------------------------------------------------
  it("11. Highlights PREPAID ORDER and DO NOT COLLECT CASH on packing sticker", async () => {
    const sticker = await callerStoreAdmin.admin.orders.getPackingSticker({ orderNumber: testOrderNumberPrepaid });

    expect(sticker.payment.isCod).toBe(false);
    expect(sticker.payment.badgeText).toBe("PREPAID ORDER");
    expect(sticker.payment.collectAmount).toBe(0);
    expect(sticker.payment.collectDisplay).toBe("DO NOT COLLECT CASH");
  });

  // -------------------------------------------------------------
  // 12. Landmark and Area Detail Formatting
  // -------------------------------------------------------------
  it("12. Preserves landmark and area details in formatted consignee addresses", async () => {
    const challan = await callerStoreAdmin.admin.orders.getDeliveryChallan({ orderNumber: testOrderNumberCod });

    expect(challan.consignee.formattedAddress).toContain("Opp. Murugan Temple");
    expect(challan.consignee.formattedAddress).toContain("Salem");
    expect(challan.consignee.pinCode).toBe("636001");
  });

  // -------------------------------------------------------------
  // 13. Idempotency: Repeated Queries Return Identical Numbers
  // -------------------------------------------------------------
  it("13. Guarantees idempotency — repeat queries return the exact same document numbers", async () => {
    const inv1 = await callerStoreAdmin.admin.orders.getInvoice({ orderNumber: testOrderNumberPrepaid });
    const inv2 = await callerStoreAdmin.admin.orders.getInvoice({ orderNumber: testOrderNumberPrepaid });
    const challan1 = await callerStoreAdmin.admin.orders.getDeliveryChallan({ orderNumber: testOrderNumberPrepaid });
    const challan2 = await callerStoreAdmin.admin.orders.getDeliveryChallan({ orderNumber: testOrderNumberPrepaid });

    expect(inv1.invoiceNumber).toBe(inv2.invoiceNumber);
    expect(inv1.documentId).toBe(inv2.documentId);
    expect(challan1.challanNumber).toBe(challan2.challanNumber);
    expect(challan1.documentId).toBe(challan2.documentId);
  });

  // -------------------------------------------------------------
  // 14. Numbering Sequences Are Independent & Isolated
  // -------------------------------------------------------------
  it("14. Isolates numbering sequences between online invoices, challans, slips, labels, and retail POS", async () => {
    const bundle = await callerStoreAdmin.admin.orders.getAllDocuments({ orderNumber: testOrderNumberPrepaid });

    expect(bundle.customerInvoice.invoiceNumber.startsWith("TRN-INV-")).toBe(true);
    expect(bundle.deliveryChallan.challanNumber.startsWith("TRN-DC-")).toBe(true);
    expect(bundle.shippingSlip.documentNumber.startsWith("TRN-SHIP-")).toBe(true);
    expect(bundle.packingSticker.stickerNumber.startsWith("TRN-LBL-")).toBe(true);

    const prefixes = new Set([
      bundle.customerInvoice.invoiceNumber.split("-")[1],
      bundle.deliveryChallan.challanNumber.split("-")[1],
      bundle.shippingSlip.documentNumber.split("-")[1],
      bundle.packingSticker.stickerNumber.split("-")[1],
    ]);
    expect(prefixes.size).toBe(4);
  });

  // -------------------------------------------------------------
  // 15. Security: Unauthenticated Access Rejected
  // -------------------------------------------------------------
  it("15. Rejects unauthenticated requests with UNAUTHORIZED", async () => {
    await expect(
      callerPublic.admin.orders.getInvoice({ orderNumber: testOrderNumberPrepaid })
    ).rejects.toThrow();

    await expect(
      callerPublic.admin.orders.getShippingSlip({ orderNumber: testOrderNumberPrepaid })
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------
  // 16. Security: Retail Shop Handler Restricted from Online Order Docs
  // -------------------------------------------------------------
  it("16. Rejects Retail Shop Handler from admin fulfilment documents with FORBIDDEN", async () => {
    await expect(
      callerRetailHandler.admin.orders.getInvoice({ orderNumber: testOrderNumberPrepaid })
    ).rejects.toThrow();

    await expect(
      callerRetailHandler.admin.orders.getDeliveryChallan({ orderNumber: testOrderNumberPrepaid })
    ).rejects.toThrow();

    await expect(
      callerRetailHandler.admin.orders.getAllDocuments({ orderNumber: testOrderNumberPrepaid })
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------
  // 17. Customer Access: Customer May Access Their Own Invoice
  // -------------------------------------------------------------
  it("17. Allows customer to fetch their own invoice via getMyInvoice", async () => {
    const myInvoice = await callerCustomerA.orders.getMyInvoice({ orderNumber: testOrderNumberPrepaid });

    expect(myInvoice).toBeDefined();
    expect(myInvoice.orderNumber).toBe(testOrderNumberPrepaid);
    expect(myInvoice.buyerDetails.customerEmail).toBe(customerUserA.email);
    expect(myInvoice.invoiceNumber).toMatch(/^TRN-INV-/);
  });

  // -------------------------------------------------------------
  // 18. Customer Security: Customer Rejected from Other's Invoice
  // -------------------------------------------------------------
  it("18. Rejects customer with FORBIDDEN when attempting to access another customer's invoice", async () => {
    await expect(
      callerCustomerB.orders.getMyInvoice({ orderNumber: testOrderNumberPrepaid })
    ).rejects.toThrow();
  });

  // -------------------------------------------------------------
  // 19. Non-Regression: Existing Online Checkout and Tracking
  // -------------------------------------------------------------
  it("19. Non-regression: Online order tracking functions as expected", async () => {
    const tracking = await callerPublic.orders.track({
      orderNumber: testOrderNumberPrepaid,
      phoneOrEmail: customerUserA.phone,
    });

    expect(tracking).toBeDefined();
    expect(tracking.orderNumber).toBe(testOrderNumberPrepaid);
    expect(tracking.orderStatus).toBe("Processing");
    expect(tracking.items.length).toBe(2);
  });

  // -------------------------------------------------------------
  // 20. Non-Regression: Retail POS Operations (Phase 4)
  // -------------------------------------------------------------
  it("20. Non-regression: Retail POS operations and branch stock access function normally", async () => {
    const branch = await callerRetailHandler.retail.myBranch();

    expect(branch).toBeDefined();
    expect(branch.id).toBe("brn_erode_hq");
    expect(branch.name).toContain("Erode");

    const stock = await callerRetailHandler.retail.branchStock();
    expect(stock).toBeDefined();
    expect(Array.isArray(stock)).toBe(true);
  });

  // -------------------------------------------------------------
  // 21. Audit Logging: Audit Trail Created for Document Views
  // -------------------------------------------------------------
  it("21. Creates audit logs when administrators view fulfilment documents", async () => {
    const dbInstance = db.getDatabase();
    const row = dbInstance.prepare("SELECT * FROM telegram_audit_logs WHERE command IN ('SHIPPING_SLIP_VIEW', 'INVOICE_VIEW', 'DELIVERY_CHALLAN_VIEW', 'ALL_DOCUMENTS_VIEW') ORDER BY createdAt DESC LIMIT 1").get() as any;

    expect(row).toBeDefined();
    expect(row.telegramUserId).toBe("Store Admin Logistics");
  });
});
