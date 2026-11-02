const { DatabaseSync } = process.getBuiltinModule('node:sqlite');
const db = new DatabaseSync('data/trinayaa.db');

console.log('=== DATABASE TABLES & ROW COUNTS ===');
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all();
for (const t of tables) {
  const count = db.prepare(`SELECT COUNT(*) as c FROM "${t.name}"`).get().c;
  console.log(`- ${t.name}: ${count} rows`);
}

console.log('\n=== SCHEMA SUMMARY ===');
for (const t of tables) {
  const cols = db.prepare(`PRAGMA table_info("${t.name}")`).all();
  console.log(`Table: ${t.name} (${cols.map(c => c.name + ':' + c.type).join(', ')})`);
}

