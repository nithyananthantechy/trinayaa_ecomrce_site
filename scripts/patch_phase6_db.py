import re

with open('server/db.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update siteContentRepo with getLowStockThreshold & setLowStockThreshold
old_site_content = """  setMinimumCodOrderValue(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Minimum COD order value must be a non-negative number.");
    }
    this.set("minimum_cod_order_value", String(value));
    return value;
  }
};"""

new_site_content = """  setMinimumCodOrderValue(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Minimum COD order value must be a non-negative number.");
    }
    this.set("minimum_cod_order_value", String(value));
    return value;
  },

  getLowStockThreshold(): number {
    const val = this.get("low_stock_threshold");
    if (val === null || val === undefined || isNaN(Number(val)) || Number(val) < 0) {
      return 10;
    }
    return Math.floor(Number(val));
  },

  setLowStockThreshold(value: number): number {
    if (typeof value !== "number" || isNaN(value) || value < 0) {
      throw new Error("Low-stock threshold must be a non-negative integer.");
    }
    const intVal = Math.floor(value);
    this.set("low_stock_threshold", String(intVal));
    return intVal;
  }
};"""

assert old_site_content in content, "Could not find old_site_content in server/db.ts"
content = content.replace(old_site_content, new_site_content, 1)

# 2. Add lowStockAlertsRepo and sanitizePublicProduct
low_stock_repo_code = """
// ==========================================
// 8E. LOW STOCK ALERTS REPOSITORY (PHASE 6)
// ==========================================
export const lowStockAlertsRepo = {
  getAlert(productId: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM low_stock_alerts WHERE productId = ?").get(productId) as any;
  },

  shouldAlert(productId: string, currentStock: number, threshold: number): boolean {
    if (currentStock > threshold) return false;
    const existing = this.getAlert(productId);
    if (!existing) return true;
    return existing.alertState !== "ALERTED";
  },

  recordAlert(productId: string, sku: string, threshold: number, stock: number) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const id = "lsa_" + crypto.randomUUID();
    db.prepare(`
      INSERT INTO low_stock_alerts (id, productId, sku, thresholdAtAlert, stockAtAlert, alertState, lastAlertSentAt, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'ALERTED', ?, ?, ?)
      ON CONFLICT(productId) DO UPDATE SET
        thresholdAtAlert = excluded.thresholdAtAlert,
        stockAtAlert = excluded.stockAtAlert,
        alertState = 'ALERTED',
        lastAlertSentAt = excluded.lastAlertSentAt,
        updatedAt = excluded.updatedAt
    `).run(id, productId, sku, threshold, stock, now, now, now);
  },

  clearAlert(productId: string) {
    const db = getDatabase();
    const now = new Date().toISOString();
    db.prepare("UPDATE low_stock_alerts SET alertState = 'CLEARED', updatedAt = ? WHERE productId = ?")
      .run(now, productId);
  },

  list(limit = 100) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM low_stock_alerts ORDER BY updatedAt DESC LIMIT ?").all(limit) as any[];
  }
};

/**
 * Public storefront stock privacy sanitizer (Phase 6)
 * When stock <= threshold: hides exact quantity, exposes 'Limited availability',
 * and for zero stock exposes 'Out of Stock'.
 */
export function sanitizePublicProduct(product: any, threshold?: number) {
  if (!product) return product;
  const thresh = threshold !== undefined ? threshold : siteContentRepo.getLowStockThreshold();
  const currentStock = typeof product.stock === "number" ? product.stock : 0;

  if (currentStock <= 0) {
    return {
      ...product,
      stock: 0,
      stockAvailability: "Out of Stock",
      isOutOfStock: true,
      isLowStock: false,
      sizes: product.sizes?.map((s: any) => ({ ...s, stock: 0 })) || product.sizes,
    };
  }

  if (currentStock <= thresh) {
    return {
      ...product,
      stock: null, // Exact quantity hidden from public users
      stockAvailability: "Limited availability",
      isOutOfStock: false,
      isLowStock: true,
      sizes: product.sizes?.map((s: any) => ({ ...s, stock: null })) || product.sizes,
    };
  }

  return {
    ...product,
    stockAvailability: "In Stock",
    isOutOfStock: false,
    isLowStock: false,
  };
}
"""

content = content + "\n" + low_stock_repo_code

with open('server/db.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ server/db.ts updated with siteContentRepo threshold methods & lowStockAlertsRepo")
