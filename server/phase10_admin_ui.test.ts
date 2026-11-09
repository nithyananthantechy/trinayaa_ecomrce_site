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

describe("TRINAYAA Phase 10 — Admin Dashboard Visual Refinement", () => {
  let customerUser: any;
  let adminUser: any;
  let callerCustomer: any;
  let callerAdmin: any;
  let adminDashboardSource: string;

  beforeAll(async () => {
    const ts = Date.now();
    customerUser = db.usersRepo.create({
      email: `phase10_cust_${ts}@trinayaa.in`,
      password: "CustomerPassword123!",
      name: "Phase 10 Customer",
      phone: "9876543290",
      role: "CUSTOMER",
    });

    adminUser = db.usersRepo.create({
      email: `phase10_admin_${ts}@trinayaa.in`,
      password: "AdminPassword123!",
      name: "Phase 10 Admin",
      phone: "9876543291",
      role: "ADMIN",
    });

    callerCustomer = appRouter.createCaller(createMockContext(customerUser).ctx);
    callerAdmin = appRouter.createCaller(createMockContext(adminUser).ctx);

    const adminFilePath = path.resolve(process.cwd(), "client/src/pages/admin/AdminDashboard.tsx");
    adminDashboardSource = fs.readFileSync(adminFilePath, "utf-8");
  });

  // ==========================================
  // 1. SIDEBAR ARCHITECTURE & BRANDING
  // ==========================================
  describe("1. Sidebar Visual Design & Branding", () => {
    it("1.1: Uses deep forest green background (#123D28) matching TRINAYAA branding", () => {
      expect(adminDashboardSource).toContain("bg-[#123D28]");
    });

    it("1.2: Renders original TRINAYAA logo aligned with storefront branding", () => {
      expect(adminDashboardSource).toContain("<BrandMark");
      expect(adminDashboardSource).toContain('import BrandMark from "@/components/BrandMark";');
    });

    it("1.3: Organizes navigation into 5 clear functional groups", () => {
      expect(adminDashboardSource).toContain('groupTitle: "Overview"');
      expect(adminDashboardSource).toContain('groupTitle: "Store Management"');
      expect(adminDashboardSource).toContain('groupTitle: "Customer Management"');
      expect(adminDashboardSource).toContain('groupTitle: "Content & Settings"');
      expect(adminDashboardSource).toContain('groupTitle: "Operations"');
    });

    it("1.4: Preserves all 17 existing admin navigation tab identifiers", () => {
      const expectedTabs = [
        "overview",
        "products",
        "categories",
        "inventory",
        "orders",
        "offers",
        "import",
        "customers",
        "enquiries",
        "helpdesk",
        "feedback",
        "rewards",
        "policies",
        "content",
        "settings",
        "telegram",
        "ai_image",
      ];

      for (const tab of expectedTabs) {
        expect(adminDashboardSource).toContain(`id: "${tab}"`);
      }
    });

    it("1.5: Distinct active tab state indicator styling with gold accent bar", () => {
      expect(adminDashboardSource).toContain("border-[#E5C378]");
      expect(adminDashboardSource).toContain("border-l-4");
      expect(adminDashboardSource).toContain("bg-white/15");
    });
  });

  // ==========================================
  // 2. HEADER & FOOTER REFINEMENTS
  // ==========================================
  describe("2. Header & Footer Visual Refinements", () => {
    it("2.1: Header provides contextual category and title breadcrumb", () => {
      expect(adminDashboardSource).toContain("tabContext.group");
      expect(adminDashboardSource).toContain("tabContext.title");
    });

    it("2.2: Header includes live refresh and customer storefront action links", () => {
      expect(adminDashboardSource).toContain('title="Refresh Live Data"');
      expect(adminDashboardSource).toContain('title="Open Customer Storefront"');
      expect(adminDashboardSource).toContain('href="/"');
    });

    it("2.3: Admin system footer rendered with operational status and Erode dispatch notice", () => {
      expect(adminDashboardSource).toContain("TRINAYAA Admin Operations Console");
      expect(adminDashboardSource).toContain("Erode Dispatch & Apothecary Facility");
      expect(adminDashboardSource).toContain("System Status:");
      expect(adminDashboardSource).toContain("Operational");
    });
  });

  // ==========================================
  // 3. RESPONSIVE MOBILE NAVIGATION
  // ==========================================
  describe("3. Responsive Mobile Drawer Navigation", () => {
    it("3.1: Includes mobile menu toggle button with accessible aria-label", () => {
      expect(adminDashboardSource).toContain("setMobileMenuOpen(true)");
      expect(adminDashboardSource).toContain('aria-label="Open Navigation Menu"');
      expect(adminDashboardSource).toContain("md:hidden");
    });

    it("3.2: Mobile drawer includes backdrop, close button, and auto-close on navigation", () => {
      expect(adminDashboardSource).toContain("mobileMenuOpen &&");
      expect(adminDashboardSource).toContain("setMobileMenuOpen(false)");
      expect(adminDashboardSource).toContain('aria-label="Close navigation"');
    });
  });

  // ==========================================
  // 4. SECURITY & PERMISSION INTEGRITY
  // ==========================================
  describe("4. Security & Access Control Enforcement", () => {
    it("4.1: Rejects non-admin users from admin dashboard metrics", async () => {
      await expect(callerCustomer.admin.dashboardOverview()).rejects.toThrow();
    });

    it("4.2: Admin caller successfully retrieves overview stats", async () => {
      const stats = await callerAdmin.admin.dashboardOverview();
      expect(stats).toBeDefined();
      expect(stats.totalProducts).toBe(162);
      expect(stats.totalCategories).toBe(9);
    });
  });

  // ==========================================
  // 5. DATABASE & CATALOGUE INTEGRITY
  // ==========================================
  describe("5. Database & Catalogue Integrity", () => {
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
