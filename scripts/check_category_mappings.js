import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/trinayaa.db');
const cats = db.prepare("SELECT id, name FROM categories").all();
console.log('Categories in DB:');
for (const c of cats) {
  const count = db.prepare("SELECT COUNT(*) as cnt FROM products WHERE categoryId = ?").get(c.id).cnt;
  console.log(`- ${c.name} (${c.id}): ${count} products`);
}

const unassigned = db.prepare("SELECT COUNT(*) as cnt FROM products WHERE categoryId IS NULL OR categoryId NOT IN (SELECT id FROM categories)").get().cnt;
console.log('Products without valid categoryId:', unassigned);

