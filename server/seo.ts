/**
 * TRINAYAA ENTERPRISES — TECHNICAL & PRODUCT SEO SERVICE (PHASE 7)
 *
 * Implements high-performance dynamic metadata generation, schema.org JSON-LD structured data,
 * canonical URL resolution, OpenGraph/Twitter Cards, and server-side head injection for all 162
 * products and 9 categories without breaking SPA client-side React hydration.
 */

import * as db from "./db";

export interface PageSeoConfig {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogType?: string;
  ogImage?: string;
  noindex?: boolean;
  jsonLd?: any[];
  breadcrumbs?: Array<{ name: string; url: string }>;
}

export const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://trinayaa.in";

// ==========================================
// 1. PRODUCT METADATA & SCHEMA GENERATOR
// ==========================================

export function generateProductMeta(product: any, baseUrl = BASE_URL): PageSeoConfig {
  const canonical = `${baseUrl}/products/${product.slug}`;
  const title = product.seoTitle || `${product.nameEn}${product.nameTa ? ` (${product.nameTa})` : ""} | 100% Pure & Authentic | TRINAYAA`;
  const description = product.seoDescription ||
    `Buy authentic ${product.nameEn} (${product.nameTa || "Herbal Ingredient"}) from TRINAYAA Enterprises, Erode. 100% pure, natural, and preservative-free botanical quality with Pan-India delivery.`;

  const primaryImg = product.primaryImage || product.image || "/images/products/packaged/pouch_001.png";
  const ogImage = primaryImg.startsWith("http") ? primaryImg : `${baseUrl}${primaryImg.startsWith("/") ? "" : "/"}${primaryImg}`;

  const categoryName = product.category || product.categoryName || "Herbs";
  const categorySlug = (product.categorySlug || categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/^-|-$/g, "");

  // Schema.org: Product
  const productSchema = {
    "@type": "Product",
    "@id": `${canonical}#product`,
    "name": product.nameEn,
    "alternateName": product.nameTa || undefined,
    "sku": product.sku,
    "image": [ogImage],
    "description": description,
    "brand": {
      "@type": "Brand",
      "name": "TRINAYAA"
    },
    "category": categoryName,
    "offers": {
      "@type": "Offer",
      "url": canonical,
      "priceCurrency": "INR",
      "price": product.sellingPrice || product.price,
      "priceValidUntil": "2030-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": (product.stock > 0) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      "seller": {
        "@type": "Organization",
        "name": "TRINAYAA ENTERPRISES"
      }
    }
  };

  // Schema.org: Breadcrumbs
  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${baseUrl}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": `${baseUrl}/categories/${categorySlug}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.nameEn,
        "item": canonical
      }
    ]
  };

  return {
    title,
    description,
    canonical,
    keywords: `${product.nameEn}, ${product.nameTa || ""}, ${product.sku}, ${categoryName}, TRINAYAA, pure herbs, natural seeds, Tamil Nadu botanicals`,
    ogType: "product",
    ogImage,
    jsonLd: [productSchema, breadcrumbSchema],
    breadcrumbs: [
      { name: "Home", url: `${baseUrl}/` },
      { name: categoryName, url: `${baseUrl}/categories/${categorySlug}` },
      { name: product.nameEn, url: canonical }
    ]
  };
}

// ==========================================
// 2. CATEGORY METADATA & SCHEMA GENERATOR
// ==========================================

export function generateCategoryMeta(category: any, baseUrl = BASE_URL): PageSeoConfig {
  const canonical = `${baseUrl}/categories/${category.slug}`;
  const title = `${category.name} Collection | 100% Pure Botanical Botanicals | TRINAYAA`;
  const description = category.description
    ? `${category.name} — ${category.description} Direct from authentic regional farmers by TRINAYAA Enterprises.`
    : `Explore pure and unadulterated ${category.name} from TRINAYAA Enterprises. Sourced directly from trusted traditional herb farms in Tamil Nadu with Pan-India delivery.`;

  const ogImage = category.image
    ? (category.image.startsWith("http") ? category.image : `${baseUrl}${category.image.startsWith("/") ? "" : "/"}${category.image}`)
    : `${baseUrl}/images/hero/hero_botanical_display.png`;

  const breadcrumbSchema = {
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": `${baseUrl}/`
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": category.name,
        "item": canonical
      }
    ]
  };

  return {
    title,
    description,
    canonical,
    keywords: `${category.name}, TRINAYAA, natural botanical products, Tamil Nadu herbs, pure seeds, raw powders`,
    ogType: "website",
    ogImage,
    jsonLd: [breadcrumbSchema],
    breadcrumbs: [
      { name: "Home", url: `${baseUrl}/` },
      { name: category.name, url: canonical }
    ]
  };
}

// ==========================================
// 3. STATIC & INFORMATIONAL PAGES METADATA
// ==========================================

export function generatePageMeta(path: string, baseUrl = BASE_URL): PageSeoConfig {
  const cleanPath = path.split("?")[0].replace(/\/+$/, "") || "/";

  // Private routes (noindex)
  if (
    cleanPath.startsWith("/admin") ||
    cleanPath === "/cart" ||
    cleanPath === "/checkout" ||
    cleanPath === "/account" ||
    cleanPath.startsWith("/api")
  ) {
    return {
      title: "TRINAYAA Enterprises",
      description: "TRINAYAA Botanical Apothecary Storefront",
      canonical: `${baseUrl}${cleanPath}`,
      noindex: true
    };
  }

  switch (cleanPath) {
    case "/":
    case "":
      return {
        title: "TRINAYAA — Pure Seeds · Raw Powders · True Herbs | Natural Botanical Apothecary",
        description: "TRINAYAA Enterprises offers 100% natural, single-origin herbs, raw herbal powders, and pure seeds sourced directly from Tamil Nadu farms. Cleaned, dried, and packed fresh with Pan-India delivery.",
        canonical: `${baseUrl}/`,
        keywords: "Trinayaa, herbal powder, pure seeds, true herbs, moringa powder, kalonji, black seed, hibiscus flower dried, amla powder, licorice root, Tamil Nadu herbs, botanical wellness",
        ogType: "website",
        ogImage: `${baseUrl}/images/hero/hero_botanical_display.png`,
      };

    case "/products":
      return {
        title: "Complete Botanical Catalogue | 162 Pure Herbs & Seeds | TRINAYAA",
        description: "Browse all 162 traditional botanical wellness products by TRINAYAA. Natural seeds, raw powders, true herbs, and herbal formulations delivered across India.",
        canonical: `${baseUrl}/products`,
        keywords: "TRINAYAA catalogue, buy herbs online, traditional Tamil Nadu botanicals, pure herbs list",
        ogType: "website",
        ogImage: `${baseUrl}/images/hero/hero_botanical_display.png`,
      };

    case "/about":
      return {
        title: "About Us | TRINAYAA Enterprises — Heritage Botanical Apothecary",
        description: "Learn about TRINAYAA Enterprises: a traditional apothecary rooted in Erode, Tamil Nadu. Small-batch ethical sourcing, direct farm partnerships, and zero chemical additives.",
        canonical: `${baseUrl}/about`,
        keywords: "About TRINAYAA, Erode botanicals, natural herbs supplier, traditional apothecary Tamil Nadu",
        ogType: "website",
        ogImage: `${baseUrl}/images/brand/trinayaa_logo.png`,
      };

    case "/contact":
      return {
        title: "Contact Us | TRINAYAA Enterprises Customer Care",
        description: "Contact TRINAYAA Enterprises at Erode, Tamil Nadu. Email support@trinayaa.in or call +91 98765 43210 for product questions, orders, and delivery assistance.",
        canonical: `${baseUrl}/contact`,
        keywords: "Contact TRINAYAA, customer care, Erode herbal store, support@trinayaa.in",
        ogType: "website",
        ogImage: `${baseUrl}/images/brand/trinayaa_logo.png`,
      };

    case "/track-order":
      return {
        title: "Track Your Order | Real-Time Delivery Updates | TRINAYAA",
        description: "Track your TRINAYAA botanical parcel in real-time. Enter your Order ID (e.g. TRN-10482) to view tracking number, courier carrier, and live delivery status.",
        canonical: `${baseUrl}/track-order`,
        keywords: "Track order, TRINAYAA courier tracking, order status, parcel tracking",
        ogType: "website",
        ogImage: `${baseUrl}/images/hero/hero_botanical_display.png`,
      };

    case "/policies/shipping":
      return {
        title: "Shipping & Delivery Policy | Pan-India Tracked Delivery | TRINAYAA",
        description: "Official shipping policy for TRINAYAA Enterprises. Free tracked delivery on orders above ₹799 across India. Standard delivery within 2–5 business days from Erode.",
        canonical: `${baseUrl}/policies/shipping`,
        keywords: "TRINAYAA shipping policy, delivery charges, free shipping above 799, courier delivery time",
        ogType: "website",
        ogImage: `${baseUrl}/images/brand/trinayaa_logo.png`,
      };

    case "/policies/returns":
      return {
        title: "Return & Refund Policy | 7-Day Replacement Guarantee | TRINAYAA",
        description: "TRINAYAA Enterprises return and refund policy. 7-day replacement guarantee on damaged or defective botanical items. Fast transparent resolution.",
        canonical: `${baseUrl}/policies/returns`,
        keywords: "TRINAYAA return policy, refund policy, damaged item replacement, customer guarantee",
        ogType: "website",
        ogImage: `${baseUrl}/images/brand/trinayaa_logo.png`,
      };

    case "/policies/privacy":
      return {
        title: "Privacy Policy | Customer Data Protection | TRINAYAA Enterprises",
        description: "Privacy policy of TRINAYAA Enterprises. Strict protection of customer contact details, delivery addresses, and encrypted payment transactions.",
        canonical: `${baseUrl}/policies/privacy`,
        keywords: "TRINAYAA privacy policy, customer data protection, secure e-commerce",
        ogType: "website",
        ogImage: `${baseUrl}/images/brand/trinayaa_logo.png`,
      };

    case "/policies/terms":
      return {
        title: "Terms & Conditions | Order Terms & User Agreement | TRINAYAA",
        description: "Terms and conditions governing purchases, order processing, Razorpay payments, and botanical wellness products on TRINAYAA Enterprises.",
        canonical: `${baseUrl}/policies/terms`,
        keywords: "TRINAYAA terms and conditions, user agreement, purchase terms",
        ogType: "website",
        ogImage: `${baseUrl}/images/brand/trinayaa_logo.png`,
      };

    default:
      return {
        title: "TRINAYAA — Pure Seeds · Raw Powders · True Herbs",
        description: "TRINAYAA Enterprises offers 100% natural, single-origin herbs, raw herbal powders, and pure seeds sourced directly from Tamil Nadu farms.",
        canonical: `${baseUrl}${cleanPath}`,
        ogType: "website",
        ogImage: `${baseUrl}/images/brand/trinayaa_logo.png`,
      };
  }
}

// ==========================================
// 4. SERVER-SIDE HTML HEAD INJECTION ENGINE
// ==========================================

export function resolveRouteSeo(urlPath: string, baseUrl = BASE_URL): PageSeoConfig {
  const cleanPath = urlPath.split("?")[0].replace(/\/+$/, "") || "/";

  // 1. Product page: /products/:slug
  const productMatch = cleanPath.match(/^\/products\/([^/]+)$/);
  if (productMatch) {
    const slug = productMatch[1];
    const product = db.productsRepo.getBySlug(slug);
    if (product) {
      return generateProductMeta(product, baseUrl);
    }
  }

  // 2. Category page: /categories/:slug
  const categoryMatch = cleanPath.match(/^\/categories\/([^/]+)$/);
  if (categoryMatch) {
    const slug = categoryMatch[1];
    const category = db.categoriesRepo.getBySlug(slug);
    if (category) {
      return generateCategoryMeta(category, baseUrl);
    }
  }

  // 3. Static/Informational pages or Private paths
  return generatePageMeta(cleanPath, baseUrl);
}

export function injectSeoMetadata(htmlTemplate: string, urlPath: string, baseUrl = BASE_URL): string {
  const config = resolveRouteSeo(urlPath, baseUrl);
  let html = htmlTemplate;

  // 1. Robots handling
  if (config.noindex) {
    if (html.includes('<meta name="robots"')) {
      html = html.replace(/<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="noindex, nofollow" />');
    } else {
      html = html.replace("</head>", '  <meta name="robots" content="noindex, nofollow" />\n</head>');
    }
  } else {
    // Ensure indexable
    if (html.includes('<meta name="robots"')) {
      html = html.replace(/<meta\s+name="robots"[^>]*>/i, '<meta name="robots" content="index, follow" />');
    } else {
      html = html.replace("</head>", '  <meta name="robots" content="index, follow" />\n</head>');
    }
  }

  // 2. Title replacement
  if (config.title) {
    html = html.replace(/<title>.*?<\/title>/i, `<title>${escapeHtml(config.title)}</title>`);
  }

  // 3. Meta description replacement
  if (config.description) {
    if (html.includes('name="description"')) {
      html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(config.description)}" />`);
    } else {
      html = html.replace("</head>", `  <meta name="description" content="${escapeHtml(config.description)}" />\n</head>`);
    }
  }

  // 4. Canonical replacement
  if (config.canonical) {
    if (html.includes('rel="canonical"')) {
      html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${config.canonical}" />`);
    } else {
      html = html.replace("</head>", `  <link rel="canonical" href="${config.canonical}" />\n</head>`);
    }
  }

  // 5. OpenGraph replacements
  if (config.title) {
    html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${escapeHtml(config.title)}" />`);
    html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${escapeHtml(config.title)}" />`);
  }
  if (config.description) {
    html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${escapeHtml(config.description)}" />`);
    html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${escapeHtml(config.description)}" />`);
  }
  if (config.canonical) {
    html = html.replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:url" content="${config.canonical}" />`);
  }
  if (config.ogImage) {
    html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${config.ogImage}" />`);
    html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${config.ogImage}" />`);
  }

  // 6. JSON-LD Structured Data Injection
  if (config.jsonLd && config.jsonLd.length > 0) {
    const scripts = config.jsonLd
      .map((item) => `  <script type="application/ld+json">\n${JSON.stringify(item, null, 2)}\n  </script>`)
      .join("\n");
    html = html.replace("</head>", `${scripts}\n</head>`);
  }

  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
