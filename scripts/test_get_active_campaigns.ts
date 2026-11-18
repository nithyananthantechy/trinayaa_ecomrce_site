import { campaignsRepo } from "../server/db.ts";

const active = campaignsRepo.getActive();
console.log(`Active campaigns found: ${active.length}`);
for (const c of active) {
  console.log(`- ${c.name} (Code: ${c.code}): ${c.discountType} ${c.discountValue}, Min: ₹${c.minOrderValue}, Max: ₹${c.maxDiscount}, Valid: ${c.startDate} to ${c.endDate}, Active: ${c.isActive}`);
}
