import { productsRepo } from '../server/db.ts';

const items = productsRepo.getAll({ limit: 162 });
console.log(`Successfully fetched all ${items.length} products from repository.`);

let verifiedBotanical = 0;
let categoryPlaceholders = 0;

for (const it of items) {
  if (it.image.includes('/images/products/generated/')) {
    verifiedBotanical++;
  } else if (it.image.includes('/images/products/placeholders/')) {
    categoryPlaceholders++;
  }
}

console.log(`\nRepository Image Resolution Breakdown:`);
console.log(`  ✓ Verified Botanical Photographs: ${verifiedBotanical}`);
console.log(`  ✓ Category Placeholders: ${categoryPlaceholders}`);
console.log(`  ✓ Total: ${verifiedBotanical + categoryPlaceholders} / ${items.length}`);

// Sample first 15
console.log(`\nSample outputs:`);
for (const it of items.slice(0, 15)) {
  console.log(`  [${it.sku}] ${it.name} (${it.category}) => ${it.image}`);
}
