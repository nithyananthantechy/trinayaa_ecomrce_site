import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('data/parsed_products.json', 'utf8'));
const counts = {};
for (const p of data.products) {
  counts[p.category] = (counts[p.category] || 0) + 1;
}
console.log('Category counts in parsed_products.json:');
console.log(counts);

