import fs from 'node:fs';

console.log('=== INSPECTING data/parsed_products.json ===');
const parsed = JSON.parse(fs.readFileSync('data/parsed_products.json', 'utf8'));
console.log('Total items in parsed_products.json:', parsed.length);
if (parsed.length > 0) {
  console.log('Sample item 0:', JSON.stringify(parsed[0], null, 2));
  console.log('Sample item last:', JSON.stringify(parsed[parsed.length - 1], null, 2));
}

// Categories found
const categories = new Set();
const skus = new Set();
let duplicates = 0;
for (const p of parsed) {
  categories.add(p.category || p.categoryName);
  if (skus.has(p.sku)) {
    duplicates++;
  }
  skus.add(p.sku);
}
console.log('Unique categories in parsed_products:', categories.size, Array.from(categories));
console.log('Unique SKUs:', skus.size, 'Duplicates:', duplicates);

console.log('\n=== INSPECTING data/product_image_mapping_report.json ===');
const imgReport = JSON.parse(fs.readFileSync('data/product_image_mapping_report.json', 'utf8'));
if (Array.isArray(imgReport)) {
  console.log('Image mapping report entries:', imgReport.length);
  console.log('Sample entry:', imgReport[0]);
} else {
  console.log('Image mapping report keys:', Object.keys(imgReport));
  if (imgReport.summary) console.log('Summary:', imgReport.summary);
  if (imgReport.mappings) console.log('Total mappings:', imgReport.mappings.length, 'Sample:', imgReport.mappings[0]);
}
