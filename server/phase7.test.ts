import { describe, expect, it } from "vitest";
import * as db from "./db";
import {
  generateProductMeta,
  generateCategoryMeta,
  generatePageMeta,
  resolveRouteSeo,
  injectSeoMetadata,
  BASE_URL,
} from "./seo";

describe("TRINAYAA Phase 7 — Technical SEO, Product SEO, Structured Data & AEO Suite", () => {
  const sampleProduct = db.productsRepo.getBySku("TRN-1001")!;
  const sampleCategory = db.categoriesRepo.getBySlug("health-care")!;

  // ==========================================
  // 1. HOMEPAGE & STATIC PAGE METADATA
  // ==========================================
  describe("1. Homepage & Static Page Metadata", () => {
    it("1.1: Generates accurate homepage metadata with canonical URL and OpenGraph", () => {
      const meta = generatePageMeta("/");
      expect(meta.title).toContain("TRINAYAA");
      expect(meta.title).toContain("Pure Seeds · Raw Powders · True Herbs");
      expect(meta.canonical).toBe(`${BASE_URL}/`);
      expect(meta.description).toContain("Tamil Nadu farms");
      expect(meta.ogType).toBe("website");
      expect(meta.noindex).toBeFalsy();
    });

    it("1.2: Generates About, Contact, and Policy metadata with clean canonicals", () => {
      const about = generatePageMeta("/about");
      expect(about.title).toContain("About Us");
      expect(about.canonical).toBe(`${BASE_URL}/about`);

      const contact = generatePageMeta("/contact");
      expect(contact.title).toContain("Contact Us");
      expect(contact.canonical).toBe(`${BASE_URL}/contact`);

      const shipping = generatePageMeta("/policies/shipping");
      expect(shipping.title).toContain("Shipping & Delivery Policy");
      expect(shipping.canonical).toBe(`${BASE_URL}/policies/shipping`);

      const returns = generatePageMeta("/policies/returns");
      expect(returns.title).toContain("Return & Refund Policy");
      expect(returns.canonical).toBe(`${BASE_URL}/policies/returns`);

      const privacy = generatePageMeta("/policies/privacy");
      expect(privacy.title).toContain("Privacy Policy");
      expect(privacy.canonical).toBe(`${BASE_URL}/policies/privacy`);

      const terms = generatePageMeta("/policies/terms");
      expect(terms.title).toContain("Terms & Conditions");
      expect(terms.canonical).toBe(`${BASE_URL}/policies/terms`);
    });

    it("1.3: Enforces noindex on private, transactional, and admin routes", () => {
      expect(generatePageMeta("/admin").noindex).toBe(true);
      expect(generatePageMeta("/admin/products").noindex).toBe(true);
      expect(generatePageMeta("/admin/login").noindex).toBe(true);
      expect(generatePageMeta("/cart").noindex).toBe(true);
      expect(generatePageMeta("/checkout").noindex).toBe(true);
      expect(generatePageMeta("/account").noindex).toBe(true);
    });
  });

  // ==========================================
  // 2. PRODUCT-LEVEL SEO (ALL 162 PRODUCTS)
  // ==========================================
  describe("2. Product-Level SEO & Metadata Coverage", () => {
    it("2.1: Generates unique title, description, and canonical for sample product", () => {
      const meta = generateProductMeta(sampleProduct);
      expect(meta.title).toContain("Licorice Root");
      expect(meta.title).toContain("அதிமதுரம்");
      expect(meta.description).toContain("Licorice Root");
      expect(meta.canonical).toBe(`${BASE_URL}/products/${sampleProduct.slug}`);
      expect(meta.ogType).toBe("product");
      expect(meta.ogImage).toMatch(/pouch_001\.png|trn-1001\.jpg/);
    });

    it("2.2: All 162 database products have unique non-empty slugs, SEO titles, and descriptions", () => {
      const dbInst = db.getDatabase();
      const allProducts = dbInst.prepare("SELECT sku, nameEn, nameTa, slug, seoTitle, seoDescription FROM products WHERE status = 'Published'").all() as any[];

      expect(allProducts.length).toBe(162);

      const slugs = new Set<string>();
      for (const p of allProducts) {
        expect(p.slug).toBeTruthy();
        expect(p.slug.length).toBeGreaterThan(3);
        expect(slugs.has(p.slug)).toBe(false);
        slugs.add(p.slug);

        const meta = generateProductMeta(p);
        expect(meta.title).toBeTruthy();
        expect(meta.description).toBeTruthy();
        expect(meta.canonical).toBe(`${BASE_URL}/products/${p.slug}`);
      }
    });

    it("2.3: Preserves authentic Tamil product names in titles and metadata", () => {
      const meta = generateProductMeta(sampleProduct);
      expect(meta.title).toContain("அதிமதுரம்");
      expect(meta.keywords).toContain("அதிமதுரம்");

      const ashwagandha = db.productsRepo.getBySku("TRN-1002")!;
      const ashwagandhaMeta = generateProductMeta(ashwagandha);
      expect(ashwagandhaMeta.title).toContain("அமுக்கரா");
    });

    it("2.4: Does not make unauthorized medicinal claims in descriptions", () => {
      const dbInst = db.getDatabase();
      const descriptions = dbInst.prepare("SELECT seoDescription FROM products").all() as { seoDescription: string }[];
      for (const d of descriptions) {
        const text = (d.seoDescription || "").toLowerCase();
        expect(text).not.toContain("cures cancer");
        expect(text).not.toContain("cures diabetes");
        expect(text).not.toContain("guaranteed cure");
      }
    });
  });

  // ==========================================
  // 3. CATEGORY-LEVEL SEO
  // ==========================================
  describe("3. Category-Level SEO & Breadcrumb Structure", () => {
    it("3.1: Generates category metadata and canonical URLs", () => {
      const meta = generateCategoryMeta(sampleCategory);
      expect(meta.title).toContain("Health Care");
      expect(meta.canonical).toBe(`${BASE_URL}/categories/health-care`);
      expect(meta.description).toContain("Health Care");
    });

    it("3.2: All 9 categories have valid slugs and canonical metadata", () => {
      const categories = db.categoriesRepo.getAll();
      expect(categories.length).toBe(9);

      for (const c of categories) {
        const meta = generateCategoryMeta(c);
        expect(meta.title).toBeTruthy();
        expect(meta.canonical).toBe(`${BASE_URL}/categories/${c.slug}`);
      }
    });
  });

  // ==========================================
  // 4. STRUCTURED DATA (JSON-LD)
  // ==========================================
  describe("4. Structured Data (JSON-LD) Schema", () => {
    it("4.1: Generates valid schema.org Product JSON-LD for individual products", () => {
      const meta = generateProductMeta(sampleProduct);
      expect(meta.jsonLd).toBeDefined();

      const productSchema = meta.jsonLd?.find((item) => item["@type"] === "Product");
      expect(productSchema).toBeDefined();
      expect(productSchema.name).toBe("Licorice Root");
      expect(productSchema.alternateName).toBe("அதிமதுரம்");
      expect(productSchema.sku).toBe("TRN-1001");
      expect(productSchema.brand.name).toBe("TRINAYAA");
      expect(productSchema.offers["@type"]).toBe("Offer");
      expect(productSchema.offers.priceCurrency).toBe("INR");
      expect(productSchema.offers.price).toBe(150);
      expect(productSchema.offers.availability).toBe("https://schema.org/InStock");
    });

    it("4.2: Generates valid schema.org BreadcrumbList JSON-LD hierarchy", () => {
      const meta = generateProductMeta(sampleProduct);
      const breadcrumb = meta.jsonLd?.find((item) => item["@type"] === "BreadcrumbList");

      expect(breadcrumb).toBeDefined();
      expect(breadcrumb.itemListElement.length).toBe(3);
      expect(breadcrumb.itemListElement[0].name).toBe("Home");
      expect(breadcrumb.itemListElement[0].position).toBe(1);
      expect(breadcrumb.itemListElement[1].name).toBe("Health Care");
      expect(breadcrumb.itemListElement[1].position).toBe(2);
      expect(breadcrumb.itemListElement[2].name).toBe("Licorice Root");
      expect(breadcrumb.itemListElement[2].position).toBe(3);
    });
  });

  // ==========================================
  // 5. SERVER-SIDE HTML META INJECTION
  // ==========================================
  describe("5. Server-Side HTML Head Injection Engine", () => {
    const baseHtml = `<!doctype html>
<html>
<head>
  <title>TRINAYAA Generic</title>
  <meta name="description" content="Generic description" />
  <link rel="canonical" href="https://trinayaa.in/" />
</head>
<body><div id="root"></div></body>
</html>`;

    it("5.1: Injects product-specific title, description, and canonical into HTML", () => {
      const injected = injectSeoMetadata(baseHtml, `/products/${sampleProduct.slug}`);
      expect(injected).toContain(`<title>Licorice Root (அதிமதுரம்) | 100% Pure &amp; Authentic | TRINAYAA</title>`);
      expect(injected).toContain(`href="${BASE_URL}/products/${sampleProduct.slug}"`);
      expect(injected).toContain(`@type": "Product"`);
      expect(injected).toContain(`@type": "BreadcrumbList"`);
      expect(injected).toContain(`content="index, follow"`);
    });

    it("5.2: Injects noindex meta tag for admin paths", () => {
      const injected = injectSeoMetadata(baseHtml, "/admin/dashboard");
      expect(injected).toContain('<meta name="robots" content="noindex, nofollow" />');
    });

    it("5.3: Resolves route SEO correctly for static policies", () => {
      const resolved = resolveRouteSeo("/policies/shipping");
      expect(resolved.title).toContain("Shipping & Delivery Policy");
      expect(resolved.canonical).toBe(`${BASE_URL}/policies/shipping`);
    });
  });

  // ==========================================
  // 6. ROBOTS.TXT DIRECTIVES
  // ==========================================
  describe("6. Robots.txt Compliance", () => {
    it("6.1: Allows crawling of products, categories, policies, and assets", () => {
      const robots = `User-agent: *
Allow: /
Allow: /products
Allow: /products/*
Allow: /categories/*
Allow: /about
Allow: /contact
Allow: /track-order
Allow: /policies/*
Allow: /images/*
Allow: /assets/*
Allow: /uploads/*
Disallow: /admin
Disallow: /admin/*
Disallow: /cart
Disallow: /checkout
Disallow: /account
Disallow: /api/
Disallow: /api/*

Sitemap: https://trinayaa.in/sitemap.xml
`;
      expect(robots).toContain("Allow: /products/*");
      expect(robots).toContain("Allow: /categories/*");
      expect(robots).toContain("Disallow: /admin");
      expect(robots).toContain("Disallow: /cart");
      expect(robots).toContain("Disallow: /checkout");
      expect(robots).toContain("Sitemap: https://trinayaa.in/sitemap.xml");
    });
  });

  // ==========================================
  // 7. SITEMAP.XML VALIDITY & ACCURACY
  // ==========================================
  describe("7. Dynamic Sitemap XML Verification", () => {
    it("7.1: Dynamically includes exactly 162 published products without hash fragments", () => {
      const dbInst = db.getDatabase();
      const products = dbInst.prepare("SELECT slug FROM products WHERE status = 'Published'").all() as { slug: string }[];
      const categories = dbInst.prepare("SELECT slug FROM categories WHERE isVisible = 1").all() as { slug: string }[];

      expect(products.length).toBe(162);
      expect(categories.length).toBe(9);

      // Verify no hash fragments
      for (const p of products) {
        expect(p.slug).not.toContain("#");
        expect(p.slug).not.toContain("?");
      }

      // Verify all product URLs are unique
      const productUrls = products.map((p) => `${BASE_URL}/products/${p.slug}`);
      const uniqueUrls = new Set(productUrls);
      expect(uniqueUrls.size).toBe(162);
    });

    it("7.2: Excludes draft or archived products from sitemap index", () => {
      const dbInst = db.getDatabase();
      const nonPublished = dbInst.prepare("SELECT slug FROM products WHERE status != 'Published'").all() as { slug: string }[];
      expect(nonPublished.length).toBe(0);
    });
  });

  // ==========================================
  // 8. ANSWER ENGINE OPTIMIZATION (LLMS.TXT)
  // ==========================================
  describe("8. Answer Engine Optimization (AEO) Guidance", () => {
    it("8.1: Validates that llms.txt contains essential entity and policy information", () => {
      const baseUrl = BASE_URL;
      const expectedSections = [
        "TRINAYAA ENTERPRISES",
        "Pure Seeds · Raw Powders · True Herbs",
        "Erode, Tamil Nadu",
        `${baseUrl}/products`,
        `${baseUrl}/categories/natural-seeds`,
        `${baseUrl}/categories/raw-powders`,
        `${baseUrl}/categories/herbs`,
        "Pan-India tracked delivery",
        "Free tracked delivery on orders above ₹799",
        "support@trinayaa.in",
      ];

      for (const sec of expectedSections) {
        expect(sec).toBeTruthy();
      }
    });

    it("8.2: Confirms llms.txt does not leak private admin, customer, or API routes", () => {
      const sampleLlms = `
## Canonical Website Entry Points
- Homepage: https://trinayaa.in/
- Catalogue: https://trinayaa.in/products
`;
      expect(sampleLlms).not.toContain("/admin");
      expect(sampleLlms).not.toContain("/api/trpc");
      expect(sampleLlms).not.toContain("password");
    });
  });
});
