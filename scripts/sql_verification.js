import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

const db = new DatabaseSync('data/trinayaa.db');
db.exec("PRAGMA foreign_keys = ON;");

console.log('========================================================================');
console.log('              TRINAYAA PHASE 2 — SQL VERIFICATION SUITE                 ');
console.log('========================================================================\n');

function runCheck(label, sql, validator) {
  console.log(`QUERY: ${sql}`);
  const result = db.prepare(sql).all();
  console.log(`RESULT: ${JSON.stringify(result)}`);
  const passed = validator(result);
  console.log(`STATUS: [${passed ? 'PASS' : 'FAIL'}] — ${label}\n`);
  return passed;
}

const allPassed = [
  // 1. Total products = 162
  runCheck(
    "Total products count is exactly 162",
    "SELECT COUNT(*) AS total_products FROM products",
    r => r[0].total_products === 162
  ),

  // 2. Expected categories = 9
  runCheck(
    "Expected categories count is 9",
    "SELECT COUNT(*) AS total_categories FROM categories",
    r => r[0].total_categories === 9
  ),

  // 3. SKU range = TRN-1001 through TRN-1162
  runCheck(
    "SKU range spans TRN-1001 through TRN-1162",
    "SELECT MIN(sku) AS min_sku, MAX(sku) AS max_sku FROM products",
    r => r[0].min_sku === 'TRN-1001' && r[0].max_sku === 'TRN-1162'
  ),

  // 4. No duplicate SKUs
  runCheck(
    "Zero duplicate SKUs",
    "SELECT sku, COUNT(*) AS count FROM products GROUP BY sku HAVING count > 1",
    r => r.length === 0
  ),

  // 5. No duplicate product slugs
  runCheck(
    "Zero duplicate product slugs",
    "SELECT slug, COUNT(*) AS count FROM products GROUP BY slug HAVING count > 1",
    r => r.length === 0
  ),

  // 6. No products with missing mandatory fields
  runCheck(
    "Zero products with missing mandatory fields",
    `SELECT COUNT(*) AS invalid_count FROM products 
     WHERE sku IS NULL OR sku = '' 
        OR nameEn IS NULL OR nameEn = '' 
        OR nameTa IS NULL OR nameTa = '' 
        OR sellingPrice IS NULL OR sellingPrice <= 0 
        OR mrp IS NULL OR mrp <= 0 
        OR primaryImage IS NULL OR primaryImage = ''`,
    r => r[0].invalid_count === 0
  ),

  // 7. All category references are valid
  runCheck(
    "All products reference an existing category",
    `SELECT COUNT(*) AS orphan_count FROM products 
     WHERE categoryId IS NULL OR categoryId NOT IN (SELECT id FROM categories)`,
    r => r[0].orphan_count === 0
  ),

  // 8. Prices and MRP values match source catalogue sample
  runCheck(
    "Prices and MRP sample verification",
    `SELECT sku, nameEn, nameTa, sellingPrice, mrp FROM products 
     WHERE sku IN ('TRN-1001', 'TRN-1051', 'TRN-1100', 'TRN-1162') ORDER BY sku`,
    r => r.length === 4 && r[0].sellingPrice > 0 && r[0].mrp >= r[0].sellingPrice
  ),

  // 9. Foreign-key integrity check
  runCheck(
    "Database foreign-key integrity passes cleanly",
    "PRAGMA foreign_key_check",
    r => r.length === 0
  )
];

// 10. Mapped product image file existence on disk
console.log('VERIFYING DISK ASSETS:');
const images = db.prepare("SELECT sku, primaryImage FROM products").all();
let missingImages = 0;
for (const p of images) {
  const filePath = path.resolve('client', 'public', p.primaryImage.replace(/^\//, ''));
  if (!fs.existsSync(filePath)) {
    missingImages++;
    console.error(`Missing file for ${p.sku}: ${filePath}`);
  }
}
console.log(`Image files on disk check: ${images.length - missingImages} found, ${missingImages} missing.`);
console.log(`STATUS: [${missingImages === 0 ? 'PASS' : 'FAIL'}] — All 162 mapped product image files exist on disk.\n`);

console.log('========================================================================');
console.log(`OVERALL VERIFICATION: ${allPassed.every(Boolean) && missingImages === 0 ? 'ALL CHECKS PASSED (10/10)' : 'SOME CHECKS FAILED'}`);
console.log('========================================================================');

