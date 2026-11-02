import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/trinayaa.db');
const standard = db.prepare("SELECT sku, nameEn FROM products WHERE sku LIKE 'TRN-1%' ORDER BY sku").all();
console.log('Standard catalogue products count:', standard.length);
console.log('First standard:', standard[0], 'Last standard:', standard[standard.length - 1]);
const testProducts = db.prepare("SELECT sku, nameEn FROM products WHERE sku NOT LIKE 'TRN-1%'").all();
console.log('Test / Extra products:', testProducts.length, testProducts.map(p => p.sku));

