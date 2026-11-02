import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { publicPlatformScript } from "./publicConfig";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { handleTelegramUpdate } from "../telegram";
import * as db from "../db";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Configure body parser with 50mb size limit for file uploads and JSON
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Serve static uploads
  const uploadsDir = path.resolve(process.cwd(), "client", "public", "uploads");
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use("/uploads", express.static(uploadsDir));

  // Health check
  app.get("/api/health", (_req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

  // Platform config
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  // ==========================================
  // IMAGE UPLOAD API WITH VALIDATION
  // ==========================================
  app.post("/api/upload", (req, res) => {
    try {
      const { fileName, fileData, mimeType } = req.body;
      if (!fileData) {
        return res.status(400).json({ error: "No file data provided." });
      }

      // Allowed MIME types
      const allowedMimes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
      if (mimeType && !allowedMimes.includes(mimeType.toLowerCase())) {
        return res.status(400).json({ error: "Invalid image format. Allowed: PNG, JPEG, WEBP." });
      }

      // Convert base64 data to buffer
      const base64Data = fileData.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      // Validate size (max 10MB)
      if (buffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({ error: "Image file exceeds maximum allowed size (10 MB)." });
      }

      // Generate sanitized unique filename
      const ext = path.extname(fileName || "image.png").toLowerCase() || ".png";
      const cleanName = `trn_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`;
      const filePath = path.join(uploadsDir, cleanName);

      fs.writeFileSync(filePath, buffer);

      return res.json({
        success: true,
        url: `/uploads/${cleanName}`,
        fileName: cleanName,
        size: buffer.length,
      });
    } catch (err: any) {
      console.error("[Upload Error]:", err);
      return res.status(500).json({ error: "File upload failed: " + err.message });
    }
  });

  // ==========================================
  // TELEGRAM BOT WEBHOOK
  // ==========================================
  app.post("/api/webhooks/telegram", async (req, res) => {
    try {
      const result = await handleTelegramUpdate(req.body);
      return res.json(result);
    } catch (err: any) {
      console.error("[Telegram Webhook Error]:", err);
      return res.status(200).json({ ok: false, error: err.message });
    }
  });

  // ==========================================
  // RAZORPAY PAYMENT WEBHOOK (IDEMPOTENT)
  // ==========================================
  app.post("/api/webhooks/razorpay", (req, res) => {
    try {
      const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET || "placeholder_webhook_secret_value";
      const signature = req.headers["x-razorpay-signature"] as string;

      // Verify webhook HMAC
      if (secret && !secret.includes("placeholder") && !secret.includes("PLACEHOLDER") && signature) {
        const bodyContent = (req as any).rawBody || JSON.stringify(req.body);
        const expected = crypto.createHmac("sha256", secret).update(bodyContent).digest("hex");
        if (signature !== expected) {
          return res.status(400).json({ error: "Invalid webhook signature" });
        }
      }

      const event = req.body?.event;
      const paymentEntity = req.body?.payload?.payment?.entity;
      const razorpayOrderId = paymentEntity?.order_id || req.body?.payload?.order?.entity?.id;
      const razorpayPaymentId = paymentEntity?.id;

      if (!razorpayOrderId) {
        return res.json({ status: "ignored", reason: "No order ID in payload" });
      }

      const dbInstance = db.getDatabase();
      const order = dbInstance.prepare("SELECT id, paymentStatus, orderStatus FROM orders WHERE razorpayOrderId = ?").get(razorpayOrderId) as any;
      if (!order) {
        return res.json({ status: "ignored", reason: "Order not found" });
      }

      if (event === "order.paid" || event === "payment.captured") {
        // Idempotent: confirm payment & deduct stock
        db.ordersRepo.confirmPayment(order.id, {
          gatewayPaymentId: razorpayPaymentId,
          rawResponse: req.body,
        });
      } else if (event === "payment.failed") {
        const errorDesc = paymentEntity?.error_description || "Payment failed at Razorpay gateway";
        db.ordersRepo.recordPaymentFailure(order.id, {
          reason: errorDesc,
          rawResponse: req.body,
        });
      } else if (event === "refund.processed") {
        db.ordersRepo.updateStatus(order.id, "Refunded", "Refund processed via Razorpay Webhook", "Razorpay Webhook");
      }

      return res.json({ status: "ok", event });
    } catch (err: any) {
      console.error("[Razorpay Webhook Error]:", err);
      return res.status(500).json({ error: err.message });
    }
  });

  // ==========================================
  // TECHNICAL SEO: SITEMAP.XML
  // ==========================================
  app.get("/sitemap.xml", (_req, res) => {
    try {
      const products = db.productsRepo.getAll({ limit: 500 });
      const categories = db.categoriesRepo.getAll();
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trinayaa.in";
      const now = new Date().toISOString().split("T")[0];

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // Static routes
      xml += `  <url>\n    <loc>${baseUrl}/</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>1.0</priority>\n  </url>\n`;
      xml += `  <url>\n    <loc>${baseUrl}/track-order</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;

      // Categories
      for (const cat of categories) {
        xml += `  <url>\n    <loc>${baseUrl}/?category=${encodeURIComponent(cat.name)}</loc>\n    <lastmod>${now}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }

      // Products
      for (const prod of products) {
        xml += `  <url>\n    <loc>${baseUrl}/#product-${prod.slug}</loc>\n    <lastmod>${prod.updatedAt ? prod.updatedAt.split("T")[0] : now}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      }

      xml += `</urlset>`;
      res.header("Content-Type", "application/xml").send(xml);
    } catch (err) {
      res.status(500).send("Error generating sitemap");
    }
  });

  // ==========================================
  // TECHNICAL SEO: ROBOTS.TXT
  // ==========================================
  app.get("/robots.txt", (_req, res) => {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://trinayaa.in";
    const robots = `User-agent: *
Allow: /
Allow: /track-order
Disallow: /admin
Disallow: /admin/*
Disallow: /api/
Disallow: /api/*

Sitemap: ${baseUrl}/sitemap.xml
`;
    res.header("Content-Type", "text/plain").send(robots);
  });

  // ==========================================
  // ANSWER ENGINE OPTIMIZATION (AEO): LLMS.TXT
  // ==========================================
  app.get("/llms.txt", (_req, res) => {
    const content = `# TRINAYAA — Pure Seeds · Raw Powders · True Herbs

> TRINAYAA Enterprises is a premier botanical wellness brand and traditional apothecary rooted in Tamil Nadu, India.
> Brand Philosophy: "Pure Seeds. Raw Powders. True Herbs. Good ingredients need nothing extra."

## Core Product Categories
1. Natural Seeds: Pure aromatic cumin, kalonji (black seed), peepal seeds, fenugreek seeds, and unadulterated whole botanicals.
2. Raw Powders: Gently sun-dried and stone-ground pure herbal powders including Moringa leaf powder, Amla powder, and Ashwagandha.
3. True Herbs: Whole botanicals including Licorice Root (அதிமதுரம்), Dried Hibiscus Flower petals, and single-origin medicinal plants.

## Sourcing and Quality Standards
- Direct farm partnerships across Tamil Nadu, India.
- Zero artificial colors, chemical preservatives, or synthetic additives.
- Meticulously cleaned, naturally dried, and hygienically packed in individual pouches.
- Pan-India tracked delivery with free shipping on orders above ₹799.

## Customer Support & Verification
- Official Website: https://trinayaa.in
- Headquarters: Erode, Tamil Nadu – 638002
- Customer Care Email: support@trinayaa.in
- Support Phone: +91 98765 43210
- Order Tracking: https://trinayaa.in/track-order
`;
    res.header("Content-Type", "text/markdown; charset=utf-8").send(content);
  });

  registerOAuthRoutes(app);

  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  // Development vs Production
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", (error) => {
    console.error("Server failed:", error.message);
    process.exit(1);
  });
  server.listen(port, "0.0.0.0", () => console.log(`TRINAYAA Server listening on port ${port}`));
}

startServer().catch((error) => {
  console.error(error);
  process.exit(1);
});
