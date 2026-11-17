import os

db_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "server", "db.ts")

with open(db_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update formatProduct to include isCodAvailable
format_prod_target = 'featured: Boolean(p.featured),'
format_prod_replace = 'featured: Boolean(p.featured),\n    isCodAvailable: p.isCodAvailable !== undefined ? (p.isCodAvailable === 1 || p.isCodAvailable === true || p.isCodAvailable === "1") : true,'

if format_prod_target in content and 'isCodAvailable: p.isCodAvailable' not in content:
    content = content.replace(format_prod_target, format_prod_replace, 1)
    print("✓ Added isCodAvailable to formatProduct")

# 2. Update productsRepo.create to include isCodAvailable
create_target = 'status, featured, seoTitle, seoDescription, seoKeywords, createdAt, updatedAt\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
create_replace = 'status, featured, isCodAvailable, seoTitle, seoDescription, seoKeywords, createdAt, updatedAt\n      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'

if create_target in content:
    content = content.replace(create_target, create_replace, 1)
    print("✓ Added isCodAvailable to productsRepo.create SQL columns")

# Also add the value binding in create
binding_target = 'data.featured ? 1 : 0,\n      data.seoTitle || "",'
binding_replace = 'data.featured ? 1 : 0,\n      data.isCodAvailable !== undefined ? (data.isCodAvailable ? 1 : 0) : 1,\n      data.seoTitle || "",'

if binding_target in content:
    content = content.replace(binding_target, binding_replace, 1)
    print("✓ Added isCodAvailable binding to productsRepo.create")

# 3. Update productsRepo.update allowed fields
allowed_target = '"status", "featured", "seoTitle",'
allowed_replace = '"status", "featured", "isCodAvailable", "seoTitle",'

if allowed_target in content:
    content = content.replace(allowed_target, allowed_replace, 1)
    print("✓ Added isCodAvailable to productsRepo.update allowed fields")

featured_target = 'if (key === "featured") {\n          values.push(updates[key] ? 1 : 0);'
featured_replace = 'if (key === "featured" || key === "isCodAvailable") {\n          values.push(updates[key] ? 1 : 0);'

if featured_target in content:
    content = content.replace(featured_target, featured_replace, 1)
    print("✓ Handled isCodAvailable boolean casting in productsRepo.update")

# 4. Add toggleCod method to productsRepo
toggle_target = 'updatePrice(id: string, sellingPrice: number, mrp?: number) {'
toggle_code = """toggleCod(id: string, isCodAvailable?: boolean) {
    const db = getDatabase();
    const existing = db.prepare("SELECT * FROM products WHERE id = ?").get(id) as any;
    if (!existing) return null;

    const newVal = isCodAvailable !== undefined
      ? (isCodAvailable ? 1 : 0)
      : (existing.isCodAvailable === 1 ? 0 : 1);

    db.prepare("UPDATE products SET isCodAvailable = ?, updatedAt = ? WHERE id = ?")
      .run(newVal, new Date().toISOString(), id);

    return this.getById(id);
  },

  updatePrice(id: string, sellingPrice: number, mrp?: number) {"""

if toggle_target in content and 'toggleCod(' not in content:
    content = content.replace(toggle_target, toggle_code, 1)
    print("✓ Added toggleCod method to productsRepo")

# 5. Add minimum COD order value methods to siteContentRepo and checkOrderCodEligibility
site_content_target = """  set(key: string, value: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare("INSERT OR REPLACE INTO site_content (key, value, updatedAt) VALUES (?, ?, ?)")
      .run(key, value, now);
    return { key, value, updatedAt: now };
  }
};"""

site_content_replacement = """  set(key: string, value: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare("INSERT OR REPLACE INTO site_content (key, value, updatedAt) VALUES (?, ?, ?)")
      .run(key, value, now);
    return { key, value, updatedAt: now };
  },

  getMinimumCodOrderValue(): number {
    const val = this.get("minimum_cod_order_value");
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) < 0) {
      return 150;
    }
    return Number(val);
  },

  setMinimumCodOrderValue(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Minimum COD order value must be a non-negative number.");
    }
    this.set("minimum_cod_order_value", String(value));
    return value;
  }
};

export function checkOrderCodEligibility(
  items: Array<{ productId: string; quantity?: number; packSize?: string }>,
  subtotal: number,
  discountAmount = 0
): {
  isEligible: boolean;
  minimumCodOrderValue: number;
  eligibleSubtotal: number;
  reason?: string;
  ineligibleProducts: Array<{ id: string; nameEn: string; sku: string }>;
} {
  const minCod = siteContentRepo.getMinimumCodOrderValue();
  const eligibleSubtotal = Math.max(0, subtotal - discountAmount);
  const ineligibleProducts: Array<{ id: string; nameEn: string; sku: string }> = [];

  for (const it of items) {
    const prod = productsRepo.getById(it.productId);
    if (prod && prod.isCodAvailable === false) {
      ineligibleProducts.push({ id: prod.id, nameEn: prod.nameEn, sku: prod.sku });
    }
  }

  if (ineligibleProducts.length > 0) {
    return {
      isEligible: false,
      minimumCodOrderValue: minCod,
      eligibleSubtotal,
      reason: "Cash on Delivery is unavailable because one or more items in your cart do not support COD.",
      ineligibleProducts,
    };
  }

  if (eligibleSubtotal < minCod) {
    return {
      isEligible: false,
      minimumCodOrderValue: minCod,
      eligibleSubtotal,
      reason: `Cash on Delivery is available for orders of ₹${minCod} or more.`,
      ineligibleProducts: [],
    };
  }

  return {
    isEligible: true,
    minimumCodOrderValue: minCod,
    eligibleSubtotal,
    ineligibleProducts: [],
  };
}"""

if site_content_target in content and 'checkOrderCodEligibility' not in content:
    content = content.replace(site_content_target, site_content_replacement, 1)
    print("✓ Added getMinimumCodOrderValue, setMinimumCodOrderValue, and checkOrderCodEligibility to server/db.ts")

with open(db_path, "w", encoding="utf-8") as f:
    f.write(content)

print("server/db.ts patched successfully.")
