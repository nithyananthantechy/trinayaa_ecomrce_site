import { describe, it, expect } from "vitest";
import { processCustomerQuery, findMatchingProducts, checkOrderTracking, STORE_POLICIES } from "./customerAssistant";
import * as db from "./db";

describe("TRINAYAA Customer Wellness & Store Assistant Suite", () => {
  describe("1. Verified Botanical Pharmacopeia & Health Guidance", () => {
    it("1.1: Provides verified health benefits, traditional dosage, and cautions for Ashwagandha", async () => {
      const res = await processCustomerQuery("What are the health benefits of Ashwagandha and how to use it?");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("Withania somnifera");
      expect(res.reply).toContain("அமுக்கரா");
      expect(res.reply).toContain("Rasayana");
      expect(res.reply).toContain("Recommended Traditional Usage");
      expect(res.reply).toContain("Safety & Considerations");
      expect(res.reply).toContain("Health Notice");
      expect(res.products.length).toBeGreaterThan(0);
      expect(res.products[0].nameEn.toLowerCase()).toContain("ashwagandha");
    });

    it("1.2: Recognizes Moringa queries and provides 100% verified nutritional facts", async () => {
      const res = await processCustomerQuery("Tell me about moringa leaf powder");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("Moringa oleifera");
      expect(res.reply).toContain("முருங்கை");
      expect(res.reply).toContain("iron");
      expect(res.products.length).toBeGreaterThan(0);
    });

    it("1.3: Maps health concerns (e.g. digestion / constipation) to appropriate traditional herbs (Triphala)", async () => {
      const res = await processCustomerQuery("I have digestion issues and constipation, what do you recommend?");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("Triphala");
      expect(res.reply).toContain("திரிபலா");
      expect(res.reply).toContain("bowel");
    });

    it("1.4: Maps hair care queries to Bhringaraj (King of Hair Herbs)", async () => {
      const res = await processCustomerQuery("How to stop hair fall and dandruff naturally?");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("Bhringaraj");
      expect(res.reply).toContain("கரிசலாங்கண்ணி");
      expect(res.reply).toContain("Kesharaja");
    });

    it("1.5: Enforces safety disclaimers on all health-related answers", async () => {
      const res = await processCustomerQuery("Is neem good for blood purification?");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("Health Notice");
      expect(res.reply).toContain("TRINAYAA pure botanical powders are traditional wellness foods and herbs");
    });
  });

  describe("2. Live Order Tracking & Customer Service", () => {
    it("2.1: Gracefully handles unknown order number", async () => {
      const res = await processCustomerQuery("Where is my order TRN-99999?");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("Order Lookup");
      expect(res.reply).toContain("could not find a matching record");
    });

    it("2.2: Correctly detects and tracks existing order in database", async () => {
      const allOrders = db.ordersRepo.listAll({ limit: 1 });
      if (allOrders.length > 0) {
        const orderNum = allOrders[0].orderNumber;
        const res = await processCustomerQuery(`Can you track my order ${orderNum}?`);
        expect(res.verified).toBe(true);
        expect(res.orderInfo).toBeDefined();
        expect(res.orderInfo?.orderNumber).toBe(orderNum);
        expect(res.reply).toContain(orderNum);
      }
    });
  });

  describe("3. Store Policies (Shipping, Delivery, Returns, Payments)", () => {
    it("3.1: Answers shipping & delivery queries with Pan-India timelines", async () => {
      const res = await processCustomerQuery("What is your shipping policy and delivery time?");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("Pan-India Shipping Policy");
      expect(res.reply).toContain("3 to 5 business days");
      expect(res.reply).toContain("₹499");
    });

    it("3.2: Answers payment methods queries", async () => {
      const res = await processCustomerQuery("What payment options do you support? Can I pay via UPI?");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("Secure Payment Options");
      expect(res.reply).toContain("Razorpay");
      expect(res.reply).toContain("UPI");
    });

    it("3.3: Answers return and refund policy queries", async () => {
      const res = await processCustomerQuery("Can I return or refund a damaged product?");
      expect(res.verified).toBe(true);
      expect(res.reply).toContain("7-Day Customer Replacement Guarantee");
    });
  });

  describe("4. Catalog Search & Product Recommendations", () => {
    it("4.1: Searches live catalog for general herb keywords", () => {
      const products = findMatchingProducts("licorice", 3);
      expect(products.length).toBeGreaterThan(0);
      expect(products[0].sku).toBeDefined();
      expect(products[0].price).toBeGreaterThan(0);
      expect(products[0].slug).toBeDefined();
    });
  });
});

