import { DatabaseSync } from 'node:sqlite';

const db = new DatabaseSync('data/trinayaa.db');
const cats = db.prepare("SELECT id, name, slug, displayOrder FROM categories ORDER BY displayOrder, name").all();
console.log('Categories in DB count:', cats.length);
for (const c of cats) {
  console.log(`- [${c.id}] ${c.name} (slug: ${c.slug}, order: ${c.displayOrder})`);
}

