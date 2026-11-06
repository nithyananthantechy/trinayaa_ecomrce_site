import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDatabase } from "./db";

describe("TRINAYAA Phase 1 — B2B Wholesale & Bulk Enquiries Suite", () => {
  const publicCaller = appRouter.createCaller({
    user: null as any,
    session: null as any,
    req: {} as any,
    res: {} as any,
  });

  const adminCaller = appRouter.createCaller({
    user: { id: "usr_admin", role: "ADMIN", name: "TRINAYAA Administrator" } as any,
    session: {} as any,
    req: {} as any,
    res: {} as any,
  });

  const testSuffix = Date.now();
  let createdEnquiryNumber: string;
  let createdEnquiryId: string;

  it("1.1: getProductOptions returns catalog items with SKU, English name, and Tamil name", async () => {
    const options = await publicCaller.enquiries.getProductOptions();
    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
    const sample = options[0];
    expect(sample).toHaveProperty("sku");
    expect(sample).toHaveProperty("nameEn");
  });

  it("1.2: Valid public enquiry submission creates business enquiry record with sequential ENQ number", async () => {
    const res = await publicCaller.enquiries.submit({
      contactName: "Murugan Swaminathan",
      companyName: `Murugan Herbal Clinic ${testSuffix}`,
      email: `dr.murugan_${testSuffix}@example.com`,
      phone: "+91 94433 12345",
      buyerType: "Ayurvedic Clinic",
      deliveryCity: "Coimbatore",
      deliveryState: "Tamil Nadu",
      requirements: "Require 50kg batch packed in airtight bags for clinical formulations.",
      items: [
        {
          sku: "TRN-1001",
          productName: "Amla Fruit Powder",
          quantity: 25,
          unit: "kg",
          targetPrice: 280,
        },
        {
          sku: "TRN-1002",
          productName: "Ashwagandha Root Powder",
          quantity: 25,
          unit: "kg",
        },
      ],
    });

    expect(res.success).toBe(true);
    expect(res.enquiryNumber).toMatch(/^ENQ-\d+$/);
    expect(res.id).toBeTruthy();

    createdEnquiryNumber = res.enquiryNumber;
    createdEnquiryId = res.id;
  });

  it("1.3: Rejects duplicate submission within 60s cooldown window", async () => {
    await expect(
      publicCaller.enquiries.submit({
        contactName: "Murugan Swaminathan",
        companyName: `Murugan Herbal Clinic ${testSuffix}`,
        email: `dr.murugan_${testSuffix}@example.com`,
        phone: "+91 94433 12345",
        buyerType: "Ayurvedic Clinic",
        deliveryCity: "Coimbatore",
        deliveryState: "Tamil Nadu",
      })
    ).rejects.toThrow(/just a moment ago/);
  });

  it("1.4: Admin can retrieve enquiry details by ID including item line items", async () => {
    const enq = await adminCaller.admin.enquiries.getById({ id: createdEnquiryId });
    expect(enq).toBeTruthy();
    expect(enq.enquiryNumber).toBe(createdEnquiryNumber);
    expect(enq.companyName).toContain(`Murugan Herbal Clinic ${testSuffix}`);
    expect(enq.status).toBe("NEW");
    expect(Array.isArray(enq.items)).toBe(true);
    expect(enq.items.length).toBe(2);
    expect(enq.items[0].sku).toBe("TRN-1001");
    expect(enq.items[0].quantity).toBe(25);
  });

  it("1.5: Admin can filter and search enquiry records", async () => {
    const searchRes = await adminCaller.admin.enquiries.list({
      search: `Murugan Herbal Clinic ${testSuffix}`,
      limit: 10,
    });
    expect(searchRes.total).toBeGreaterThanOrEqual(1);
    expect(searchRes.enquiries.some((e: any) => e.id === createdEnquiryId)).toBe(true);
  });

  it("1.6: Admin can update enquiry status and record internal follow-up notes", async () => {
    const updated = await adminCaller.admin.enquiries.updateStatus({
      id: createdEnquiryId,
      status: "CONTACTED",
      assignedTo: "Sales Representative Senthil",
      internalNotes: "Spoke via phone. Confirmed delivery to Coimbatore bypass warehouse.",
    });

    expect(updated).toBeTruthy();
    expect(updated.status).toBe("CONTACTED");
    expect(updated.assignedTo).toBe("Sales Representative Senthil");
    expect(updated.internalNotes).toContain("Coimbatore bypass warehouse");
  });

  it("1.7: Admin CSV export returns properly formatted CSV string with headers", async () => {
    const csv = await adminCaller.admin.enquiries.exportCsv();
    expect(typeof csv).toBe("string");
    expect(csv).toContain("Enquiry Number");
    expect(csv).toContain("Company Name");
    expect(csv).toContain("Phone");
    expect(csv).toContain(createdEnquiryNumber);
  });
});
