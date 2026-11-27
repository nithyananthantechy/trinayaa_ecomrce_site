import fs from "fs";
import path from "path";
import crypto from "crypto";
import sqlite3 from "node:sqlite";

const DB_PATH = path.resolve(process.cwd(), "data", "trinayaa.db");
const db = new sqlite3.DatabaseSync(DB_PATH);

const products = db.prepare(`
  SELECT p.*, c.name as categoryName 
  FROM products p 
  LEFT JOIN categories c ON p.categoryId = c.id 
  ORDER BY p.sku ASC
`).all();

console.log(`Total products queried: ${products.length}`);

const clientGenDir = path.resolve(process.cwd(), "client", "public", "images", "products", "generated");

const fileHashes = new Map(); // hash -> list of skus
const fileSizes = new Map(); // size -> list of skus
const allProductDetails = [];

for (const p of products) {
  const sku = (p.sku || "").trim().toUpperCase();
  const filePath = path.join(clientGenDir, `${sku}.webp`);
  let exists = fs.existsSync(filePath);
  let size = 0;
  let hash = "";

  if (exists) {
    const buf = fs.readFileSync(filePath);
    size = buf.length;
    hash = crypto.createHash("sha256").update(buf).digest("hex");

    if (!fileHashes.has(hash)) fileHashes.set(hash, []);
    fileHashes.get(hash).push(sku);

    if (!fileSizes.has(size)) fileSizes.set(size, []);
    fileSizes.get(size).push(sku);
  }

  allProductDetails.push({
    id: p.id,
    sku,
    nameEn: p.nameEn || p.name,
    nameTa: p.nameTa,
    category: p.categoryName || p.category,
    productType: p.productType,
    botanicalName: p.botanicalName,
    exists,
    size,
    hash
  });
}

console.log("\n=== IDENTICAL IMAGE (HASH COLLISION) AUDIT ===");
let exactDuplicates = 0;
for (const [hash, skus] of fileHashes.entries()) {
  if (skus.length > 1) {
    exactDuplicates++;
    console.log(`Hash ${hash.slice(0, 10)}... shared by SKUs: ${skus.join(", ")}`);
    for (const s of skus) {
      const prod = allProductDetails.find(x => x.sku === s);
      console.log(`   -> [${prod.sku}] "${prod.nameEn}" (${prod.nameTa}) | ${prod.botanicalName}`);
    }
  }
}
if (exactDuplicates === 0) {
  console.log("Zero identical image files! Every image file has a unique binary SHA256 checksum.");
}

console.log("\n=== DETAILED ANALYSIS OF THE 7 REPEATED / SIMILAR PRODUCTS ===");
const similarGroups = [
  { name: "Ashwagandha", skus: ["TRN-1002", "TRN-1004"] },
  { name: "Sweet basil (Raw / Leaves)", skus: ["TRN-1011", "TRN-1069"] },
  { name: "Benzoin Resin (Sambrani)", skus: ["TRN-1073", "TRN-1074", "TRN-1075"] },
  { name: "Sweet basil Powder", skus: ["TRN-1102", "TRN-1154"] },
  { name: "Indian Gooseberry Powder (Amla)", skus: ["TRN-1112", "TRN-1113"] },
  { name: "Camel Grass Powder (Vetiver)", skus: ["TRN-1143", "TRN-1144"] },
  { name: "Indian Rose Powder", skus: ["TRN-1147", "TRN-1148"] }
];

for (const grp of similarGroups) {
  console.log(`\nGroup: ${grp.name}`);
  for (const s of grp.skus) {
    const prod = allProductDetails.find(x => x.sku === s);
    if (prod) {
      console.log(`  SKU: ${prod.sku}`);
      console.log(`    English Name:   "${prod.nameEn}"`);
      console.log(`    Tamil Name:     "${prod.nameTa}"`);
      console.log(`    Botanical Name: "${prod.botanicalName}"`);
      console.log(`    Category:       "${prod.category}"`);
      console.log(`    Type:           "${prod.productType}"`);
      console.log(`    Image File:     ${prod.sku}.webp (${prod.size} bytes)`);
    }
  }
}

