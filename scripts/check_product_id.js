import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/trinayaa.db');
const row = db.prepare("SELECT id, sku, nameEn FROM products WHERE sku = 'TRN-1001'").get();
console.log('TRN-1001 in DB:', row);

