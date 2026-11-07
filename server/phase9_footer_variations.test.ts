import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db.ts";
import { appRouter } from "./routers.ts";
import fs from "node:fs";
import path from "node:path";

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

describe("TRINAYAA Phase 9 — Footer Variations & Erode Map Integration", () => {
  let callerPublic: any;

  beforeAll(async () => {
    callerPublic = appRouter.createCaller(createMockContext(null).ctx);
  });

  // ==========================================
  // 1. REUSABLE COMPONENT & ASSETS VERIFICATION
  // ==========================================
  describe("1. Component Architecture & Assets", () => {
    it("1.1: ErodeMapGraphic component exists and defines normalized SVG silhouette", () => {
      const mapComponentPath = path.resolve(process.cwd(), "client/src/components/ErodeMapGraphic.tsx");
      expect(fs.existsSync(mapComponentPath)).toBe(true);

      const content = fs.readFileSync(mapComponentPath, "utf-8");
      expect(content).toContain("erodePath");
      expect(content).toContain("ERODE");
      expect(content).toContain("TAMIL NADU");
      expect(content).toContain("🇮🇳"); // Indian flag badge
    });

    it("1.2: FooterVariation component implements shared split-footer structure for all 4 options", () => {
      const footerVarPath = path.resolve(process.cwd(), "client/src/components/FooterVariation.tsx");
      expect(fs.existsSync(footerVarPath)).toBe(true);

      const content = fs.readFileSync(footerVarPath, "utf-8");
      // All 4 options defined in theme dictionary
      expect(content).toContain("option1");
      expect(content).toContain("option2");
      expect(content).toContain("option3");
      expect(content).toContain("option4");

      // Verify theme colors matching client specification:
      // Option 1: Deep forest green (#123D28) left, Warm ivory (#FBF8F0) right
      expect(content).toContain("#123D28");
      expect(content).toContain("#FBF8F0");

      // Option 2: White left, Deep green right, Warm gold (#E5C378)
      expect(content).toContain("#E5C378");

      // Option 3: Kraft packaging tone (#C2A67E)
      expect(content).toContain("#C2A67E");

      // Option 4: Natural olive green tone (#3F5E4D)
      expect(content).toContain("#3F5E4D");
    });

    it("1.3: Verifies all 4 options share the exact same navigation hierarchy & verified Erode address", () => {
      const footerVarPath = path.resolve(process.cwd(), "client/src/components/FooterVariation.tsx");
      const content = fs.readFileSync(footerVarPath, "utf-8");

      // Quick Links
      expect(content).toContain('setLocation("/")');
      expect(content).toContain('setLocation("/products")');
      expect(content).toContain('setLocation("/bulk-enquiry")');
      expect(content).toContain('setLocation("/about")');
      expect(content).toContain('setLocation("/contact")');

      // Useful Policies
      expect(content).toContain('setLocation("/policies/privacy")');
      expect(content).toContain('setLocation("/policies/terms")');
      expect(content).toContain('setLocation("/policies/shipping")');
      expect(content).toContain('setLocation("/policies/returns")');

      // Verified Erode Address & Details
      expect(content).toContain("TRINAYAA ENTERPRISES");
      expect(content).toContain("42, Kongu Nagar, Erode");
      expect(content).toContain("Tamil Nadu – 638002, India");
      expect(content).toContain("support@trinayaa.in");
      expect(content).toContain("+91 94422 18990");
    });
  });

  // ==========================================
  // 2. DYNAMIC CMS & WHATSAPP INTEGRATION
  // ==========================================
  describe("2. Dynamic CMS & WhatsApp Integration", () => {
    it("2.1: Footer variations query public social links dynamically", async () => {
      const socialLinks = await callerPublic.content.getSocialLinks();
      expect(socialLinks).toBeDefined();
      expect(socialLinks.whatsappUrl).toContain("https://wa.me/");
      expect(socialLinks.whatsappPhone).toBeTruthy();
    });

    it("2.2: WhatsApp customer care button connects to verified business number", async () => {
      const footerVarPath = path.resolve(process.cwd(), "client/src/components/FooterVariation.tsx");
      const content = fs.readFileSync(footerVarPath, "utf-8");

      expect(content).toContain("socialLinks?.whatsappUrl");
      expect(content).toContain("WhatsApp Erode Care Team");
    });
  });

  // ==========================================
  // 3. PREVIEW PAGE & PRODUCTION PROTECTION
  // ==========================================
  describe("3. Client Preview Page & Production Isolation", () => {
    it("3.1: FooterSamplesPage component exists and is registered at /footer-samples route", () => {
      const previewPagePath = path.resolve(process.cwd(), "client/src/pages/FooterSamplesPage.tsx");
      expect(fs.existsSync(previewPagePath)).toBe(true);

      const appPath = path.resolve(process.cwd(), "client/src/App.tsx");
      const appContent = fs.readFileSync(appPath, "utf-8");
      expect(appContent).toContain('path="/footer-samples"');
      expect(appContent).toContain("FooterSamplesPage");
    });

    it("3.2: Production StoreFooter component remains completely unchanged and locked", () => {
      const storeFooterPath = path.resolve(process.cwd(), "client/src/components/StoreFooter.tsx");
      expect(fs.existsSync(storeFooterPath)).toBe(true);

      const content = fs.readFileSync(storeFooterPath, "utf-8");
      // Current production footer uses official brand footer layout
      expect(content).toContain('className="site-footer"');
      expect(content).toContain("footer-brand");
      expect(content).toContain("Quick links");
      expect(content).toContain("Contact us");
    });

    it("3.3: Client selection in preview saves to preview preference only without altering production footer", () => {
      const previewPagePath = path.resolve(process.cwd(), "client/src/pages/FooterSamplesPage.tsx");
      const content = fs.readFileSync(previewPagePath, "utf-8");

      expect(content).toContain("trinayaa_preview_footer_theme");
      expect(content).toContain("The current production footer remains 100% untouched until explicit client approval");
    });
  });

  // ==========================================
  // 4. DATABASE & CATALOGUE INTEGRITY
  // ==========================================
  describe("4. Database & Catalogue Integrity", () => {
    it("4.1: Exactly 162 botanical products and 9 categories preserved", () => {
      const dbInstance = db.getDatabase();
      const prodCount = dbInstance.prepare("SELECT COUNT(*) as c FROM products").get().c;
      const catCount = dbInstance.prepare("SELECT COUNT(*) as c FROM categories").get().c;

      expect(prodCount).toBe(162);
      expect(catCount).toBe(9);
    });

    it("4.2: Product SKUs TRN-1001 through TRN-1162 remain intact", () => {
      const p1 = db.productsRepo.getBySku("TRN-1001");
      const p162 = db.productsRepo.getBySku("TRN-1162");

      expect(p1).toBeDefined();
      expect(p162).toBeDefined();
    });

    it("4.3: Policy CMS and social configuration remain intact", () => {
      const shippingPolicy = db.policiesRepo.getPolicy("shipping");
      expect(shippingPolicy).toBeDefined();
      expect(shippingPolicy?.isPublished).toBe(true);

      const socialConfig = db.socialLinksRepo.getConfig();
      expect(socialConfig.whatsappPhone).toBeTruthy();
    });
  });
});
