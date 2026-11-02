import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/trinayaa.db');
const vars = db.prepare("SELECT id, productId, packSize, sku FROM product_variants WHERE productId = 'prod_1'").all();
console.log('Variants for prod_1:', vars);

