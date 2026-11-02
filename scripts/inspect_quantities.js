import fs from 'node:fs';

const data = JSON.parse(fs.readFileSync('data/parsed_products.json', 'utf8'));
const quantities = new Set();
const missingFields = [];

for (const p of data.products) {
  quantities.add(p.quantity);
  if (!p.sku || !p.nameEn || !p.nameTa || !p.category || p.sellingPrice == null || p.mrp == null) {
    missingFields.push(p.sku);
  }
}

console.log('Unique quantities in parsed_products:', Array.from(quantities));
console.log('Products with missing mandatory fields:', missingFields.length);
console.log('First 5 products with quantity/pack details:');
for (let i = 0; i < 5; i++) {
  const p = data.products[i];
  console.log(`- ${p.sku}: ${p.nameEn} (${p.nameTa}), Cat: ${p.category}, Qty: ${p.quantity}, Price: ${p.sellingPrice}, MRP: ${p.mrp}`);
}

