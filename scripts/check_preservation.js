import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/trinayaa.db');
const userCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
const orderCount = db.prepare("SELECT COUNT(*) as c FROM orders").get().c;
const productCount = db.prepare("SELECT COUNT(*) as c FROM products").get().c;
const categoryCount = db.prepare("SELECT COUNT(*) as c FROM categories").get().c;
const imageCount = db.prepare("SELECT COUNT(*) as c FROM product_images").get().c;
const inventoryCount = db.prepare("SELECT COUNT(*) as c FROM inventory").get().c;
const variantCount = db.prepare("SELECT COUNT(*) as c FROM product_variants").get().c;

console.log('=== DATA PRESERVATION CHECK ===');
console.log(`- Users: ${userCount}`);
console.log(`- Orders: ${orderCount}`);
console.log(`- Products: ${productCount}`);
console.log(`- Categories: ${categoryCount}`);
console.log(`- Product Images: ${imageCount}`);
console.log(`- Inventory records: ${inventoryCount}`);
console.log(`- Product Variants: ${variantCount}`);

