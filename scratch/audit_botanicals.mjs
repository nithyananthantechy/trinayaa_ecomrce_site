import fs from "fs";
import path from "path";
import sqlite3 from "node:sqlite";

const DB_PATH = path.resolve(process.cwd(), "data", "trinayaa.db");
const db = new sqlite3.DatabaseSync(DB_PATH);

const dbProducts = db.prepare("SELECT * FROM products ORDER BY sku ASC").all();

const csvText = fs.readFileSync(path.resolve(process.cwd(), "docs", "TRINAYAA_162_PRODUCT_BOTANICAL_MANIFEST.csv"), "utf8");
const csvLines = csvText.trim().split("\n");
const header = csvLines[0].split(",").map(h => h.trim());

const manifestItems = [];
for (let i = 1; i < csvLines.length; i++) {
  const line = csvLines[i].trim();
  if (!line) continue;
  // Handle commas inside fields if any, or simple split
  const cols = line.split(",");
  manifestItems.push({
    sku: cols[0]?.trim(),
    name_en: cols[1]?.trim(),
    name_ta: cols[2]?.trim(),
    category: cols[3]?.trim(),
    product_type: cols[4]?.trim(),
    botanical_name: cols[5]?.trim(),
    plant_family: cols[6]?.trim(),
    product_form: cols[7]?.trim(),
    image_filename: cols[9]?.trim()
  });
}

console.log("=== MANIFEST VS DATABASE AUDIT ===");
console.log(`Manifest rows: ${manifestItems.length}`);
console.log(`Database rows: ${dbProducts.length}`);

// Compare each SKU
let mismatches = 0;
for (const m of manifestItems) {
  const dbp = dbProducts.find(p => p.sku === m.sku);
  if (!dbp) {
    console.log(`Missing in DB: SKU ${m.sku} (${m.name_en})`);
    mismatches++;
  }
}
for (const p of dbProducts) {
  const m = manifestItems.find(x => x.sku === p.sku);
  if (!m) {
    console.log(`Extra in DB: SKU ${p.sku} (${p.nameEn})`);
    mismatches++;
  }
}
if (mismatches === 0) {
  console.log("All 162 SKUs match 1:1 between CSV Manifest and Database!");
}

// Group products by botanical / common root to find all repeated botanicals
const botanicalMap = new Map();
for (const m of manifestItems) {
  const bot = (m.botanical_name || "").trim().toLowerCase();
  if (!bot) continue;
  if (!botanicalMap.has(bot)) botanicalMap.set(bot, []);
  botanicalMap.get(bot).push(m);
}

console.log("\n=== PRODUCTS WITH THE SAME BOTANICAL / SCIENTIFIC NAME ===");
for (const [bot, list] of botanicalMap.entries()) {
  if (list.length > 1) {
    console.log(`\nBotanical: "${bot}" (${list.length} products):`);
    for (const item of list) {
      console.log(`  - [${item.sku}] EN: "${item.name_en}" | TA: "${item.name_ta}" | Type: ${item.product_type} (${item.product_form}) | Cat: ${item.category}`);
    }
  }
}

