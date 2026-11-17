import { describe, it, expect, beforeAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { appRouter } from "./routers.ts";

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

describe("TRINAYAA Client Feedback Phase 1 — Brand Typography & Footer Readability", () => {
  let callerPublic: any;

  beforeAll(async () => {
    callerPublic = appRouter.createCaller(createMockContext(null).ctx);
  });

  describe("1. Brand Typography & Logo Alignment", () => {
    it("1.1: client/index.html includes preconnect and Google Fonts stylesheet for Cinzel and Montserrat", () => {
      const htmlPath = path.resolve(process.cwd(), "client/index.html");
      expect(fs.existsSync(htmlPath)).toBe(true);
      const html = fs.readFileSync(htmlPath, "utf-8");
      expect(html).toContain("fonts.googleapis.com");
      expect(html).toContain("family=Cinzel");
      expect(html).toContain("family=Montserrat");
    });

    it("1.2: BrandMark component renders TRINAYAA wordmark in Cinzel serif with #7A1B28 burgundy color", () => {
      const brandMarkPath = path.resolve(process.cwd(), "client/src/components/BrandMark.tsx");
      expect(fs.existsSync(brandMarkPath)).toBe(true);
      const content = fs.readFileSync(brandMarkPath, "utf-8");

      expect(content).toContain("Cinzel");
      expect(content).toContain("#7A1B28");
      expect(content).toContain("TRINAYAA");
    });

    it("1.3: BrandMark component renders tagline with « and » guillemets matching client-approved template", () => {
      const brandMarkPath = path.resolve(process.cwd(), "client/src/components/BrandMark.tsx");
      const content = fs.readFileSync(brandMarkPath, "utf-8");

      expect(content).toContain("«");
      expect(content).toContain("»");
      expect(content).toContain("PURE SEEDS · RAW POWDERS · TRUE HERBS");
      expect(content).toContain("Montserrat");
    });

    it("1.4: Botanical emblem asset is preserved at /images/brand/emblem_crisp.png", () => {
      const emblemPath = path.resolve(process.cwd(), "client/public/images/brand/emblem_crisp.png");
      expect(fs.existsSync(emblemPath)).toBe(true);
      const stats = fs.statSync(emblemPath);
      expect(stats.size).toBeGreaterThan(1000);
    });
  });

  describe("2. Footer Text Readability & Contrast Enhancements", () => {
    it("2.1: StoreFooter component uses high-contrast text-[#0B2D1D] for links, policies, and contacts", () => {
      const footerPath = path.resolve(process.cwd(), "client/src/components/StoreFooter.tsx");
      expect(fs.existsSync(footerPath)).toBe(true);
      const footer = fs.readFileSync(footerPath, "utf-8");

      expect(footer).toContain("#0B2D1D");
      expect(footer).toContain("QUICK LINKS");
      expect(footer).toContain("USEFUL POLICIES");
      expect(footer).toContain("CONTACT US");
    });

    it("2.2: StoreFooter maintains Erode map card and Indian flag badge", () => {
      const footerPath = path.resolve(process.cwd(), "client/src/components/StoreFooter.tsx");
      const footer = fs.readFileSync(footerPath, "utf-8");

      expect(footer).toContain("ERODE_MAP_PATH");
      expect(footer).toContain("INDIA");
      expect(footer).toContain("ERODE");
      expect(footer).toContain("TAMIL NADU");
    });

    it("2.3: Content router provides social links for footer icons without error", async () => {
      const links = await callerPublic.content.getSocialLinks();
      expect(links).toBeDefined();
      expect(links).toHaveProperty("instagram");
      expect(links).toHaveProperty("facebook");
    });
  });
});
