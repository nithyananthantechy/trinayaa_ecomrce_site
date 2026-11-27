import fs from "fs";
import path from "path";
import sqlite3 from "node:sqlite";

const DB_PATH = path.resolve(process.cwd(), "data", "trinayaa.db");
const db = new sqlite3.DatabaseSync(DB_PATH);

// 1. Get all products from database
const products = db.prepare("SELECT * FROM products ORDER BY sku ASC").all();

console.log("=== TRINAYAA PRODUCT AUDIT ===");
console.log(`Total Products in DB: ${products.length}`);

// Check categories count
const categories = db.prepare("SELECT * FROM categories").all();
console.log(`Total Categories in DB: ${categories.length}`);

// Status breakdown
const statusCounts = {};
for (const p of products) {
  statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
}
console.log("Status Breakdown:", statusCounts);

// Check duplicate SKUs
const skuMap = new Map();
const dupSkus = [];
for (const p of products) {
  const s = (p.sku || "").trim().toUpperCase();
  if (skuMap.has(s)) {
    dupSkus.push({ sku: s, product1: skuMap.get(s), product2: p });
  } else {
    skuMap.set(s, p);
  }
}
console.log(`Duplicate SKUs count: ${dupSkus.length}`);
if (dupSkus.length > 0) {
  console.log("Duplicate SKUs:", dupSkus);
}

// Check duplicate Slugs
const slugMap = new Map();
const dupSlugs = [];
for (const p of products) {
  const s = (p.slug || "").trim().toLowerCase();
  if (slugMap.has(s)) {
    dupSlugs.push({ slug: s, id1: slugMap.get(s).id, name1: slugMap.get(s).nameEn, id2: p.id, name2: p.nameEn });
  } else {
    slugMap.set(s, p);
  }
}
console.log(`Duplicate Slugs count: ${dupSlugs.length}`);
if (dupSlugs.length > 0) {
  console.log("Duplicate Slugs:", dupSlugs);
}

// Check repeated/duplicate product names (English & Tamil)
const nameEnMap = new Map();
const dupNameEns = [];
for (const p of products) {
  // Normalize: lower case, strip -1, -2, extra spaces
  const raw = (p.nameEn || p.name || "").trim();
  const norm = raw.toLowerCase().replace(/\s*-\s*\d+$/, "").trim();
  if (!nameEnMap.has(norm)) {
    nameEnMap.set(norm, []);
  }
  nameEnMap.get(norm).push({ id: p.id, sku: p.sku, nameEn: p.nameEn, nameTa: p.nameTa, category: p.category });
}

for (const [norm, list] of nameEnMap.entries()) {
  if (list.length > 1) {
    dupNameEns.push({ normalizedName: norm, items: list });
  }
}
console.log(`Potentially Repeated / Similar Product Names count: ${dupNameEns.length}`);
for (const d of dupNameEns) {
  console.log(`\n- "${d.normalizedName}":`);
  for (const it of d.items) {
    console.log(`    [${it.sku}] EN: "${it.nameEn}" | TA: "${it.nameTa}" | Cat: ${it.category}`);
  }
}

// Check Tamil names repeated
const nameTaMap = new Map();
const dupNameTas = [];
for (const p of products) {
  const raw = (p.nameTa || "").trim();
  if (!raw) continue;
  if (!nameTaMap.has(raw)) {
    nameTaMap.set(raw, []);
  }
  nameTaMap.get(raw).push({ id: p.id, sku: p.sku, nameEn: p.nameEn, nameTa: p.nameTa });
}
for (const [ta, list] of nameTaMap.entries()) {
  if (list.length > 1) {
    dupNameTas.push({ nameTa: ta, items: list });
  }
}
console.log(`\nDuplicate Tamil Names count: ${dupNameTas.length}`);
for (const d of dupNameTas) {
  console.log(`\n- TA "${d.nameTa}":`);
  for (const it of d.items) {
    console.log(`    [${it.sku}] EN: "${it.nameEn}"`);
  }
}

// Check images for all products
console.log("\n=== IMAGE AUDIT ===");
const clientPublic = path.resolve(process.cwd(), "client", "public");
const distPublic = path.resolve(process.cwd(), "dist", "public");

const imageResults = {
  total: products.length,
  hasDirectImageFile: 0,
  hasGeneratedSkuWebp: 0,
  missingImageFiles: [],
  placeholderFallbacks: [],
  imageUsageCounts: new Map()
};

for (const p of products) {
  const sku = (p.sku || "").trim().toUpperCase();
  const directImg = p.image || p.imageUrl || "";
  
  // Sku webp path
  const skuWebpRel = `/images/products/generated/${sku}.webp`;
  const skuWebpClientPath = path.join(clientPublic, "images", "products", "generated", `${sku}.webp`);
  const skuWebpDistPath = path.join(distPublic, "images", "products", "generated", `${sku}.webp`);
  
  const clientExists = fs.existsSync(skuWebpClientPath);
  const distExists = fs.existsSync(skuWebpDistPath);

  // Check file size if exists
  let sizeBytes = 0;
  if (clientExists) {
    sizeBytes = fs.statSync(skuWebpClientPath).size;
  }

  // Count image usage
  const imgKey = clientExists ? skuWebpRel : (directImg || "NONE");
  imageResults.imageUsageCounts.set(imgKey, (imageResults.imageUsageCounts.get(imgKey) || 0) + 1);

  if (clientExists && distExists && sizeBytes > 0) {
    imageResults.hasGeneratedSkuWebp++;
  } else {
    imageResults.missingImageFiles.push({
      sku,
      nameEn: p.nameEn,
      clientExists,
      distExists,
      sizeBytes,
      directImg
    });
  }
}

console.log(`Products with verified generated SKU webp image (both in client and dist): ${imageResults.hasGeneratedSkuWebp} / ${products.length}`);
if (imageResults.missingImageFiles.length > 0) {
  console.log("Missing or 0-byte image files:", imageResults.missingImageFiles);
} else {
  console.log("All products have dedicated generated webp image files present and non-empty!");
}

// Check if any distinct products share the exact same generated image
console.log("\n=== IMAGE REUSE AUDIT ===");
let reusedImages = 0;
for (const [img, count] of imageResults.imageUsageCounts.entries()) {
  if (count > 1) {
    reusedImages++;
    console.log(`Image "${img}" is shared by ${count} products.`);
  }
}
if (reusedImages === 0) {
  console.log("No shared images! Every single product has its own unique 1-to-1 SKU image (/images/products/generated/{SKU}.webp).");
}

