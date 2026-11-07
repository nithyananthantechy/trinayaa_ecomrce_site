import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
import viteConfig from "../../vite.config";
import { injectSeoMetadata } from "../seo";

export async function setupVite(app: Express, server: Server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const possibleClientPaths = [
        path.resolve(process.cwd(), "client", "index.html"),
        path.resolve(import.meta.dirname, "../client", "index.html"),
        path.resolve(import.meta.dirname, "../../client", "index.html"),
      ];
      const clientTemplate = possibleClientPaths.find((p) => fs.existsSync(p)) || possibleClientPaths[0];

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = injectSeoMetadata(template, url, process.env.NEXT_PUBLIC_APP_URL || "https://trinayaa.in");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      if (url.startsWith("/admin") || url.startsWith("/cart") || url.startsWith("/checkout")) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
      }
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

export function serveStatic(app: Express) {
  const possiblePaths = [
    path.resolve(process.cwd(), "dist", "public"),
    path.resolve(import.meta.dirname, "public"),
    path.resolve(import.meta.dirname, "../..", "dist", "public"),
  ];
  const distPath = possiblePaths.find((p) => fs.existsSync(p)) || possiblePaths[0];
  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // the app's not-found page keeps a real 404 status for crawlers
  app.get("/404", (_req, res) => {
    res.status(404).sendFile(path.resolve(distPath, "index.html"));
  });

  // fall through to index.html with dynamically injected SEO metadata
  app.use("*", async (req, res) => {
    try {
      const indexPath = path.resolve(distPath, "index.html");
      if (!fs.existsSync(indexPath)) {
        return res.status(404).send("Not Found");
      }
      let html = await fs.promises.readFile(indexPath, "utf-8");
      html = injectSeoMetadata(html, req.originalUrl, process.env.NEXT_PUBLIC_APP_URL || "https://trinayaa.in");
      if (req.originalUrl.startsWith("/admin") || req.originalUrl.startsWith("/cart") || req.originalUrl.startsWith("/checkout")) {
        res.setHeader("X-Robots-Tag", "noindex, nofollow");
      }
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch {
      res.sendFile(path.resolve(distPath, "index.html"));
    }
  });
}
