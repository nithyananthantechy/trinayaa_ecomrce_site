import { productsRepo } from '../server/db.ts';

const items = productsRepo.getAll({ limit: 162 });

console.log('Sample of non-generated products resolving to category placeholders:');
const samplePlaceholders = items.filter(it => it.image.includes('/placeholders/')).slice(0, 10);
for (const it of samplePlaceholders) {
  console.log(`  [${it.sku}] ${it.name} (${it.category} / ${it.productType}) => ${it.image}`);
}

