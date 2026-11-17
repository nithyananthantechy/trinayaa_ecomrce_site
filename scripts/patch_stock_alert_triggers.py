with open('server/db.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update productsRepo.updateStock
old_prod_update = """  updateStock(id: string, stock: number) {
    const db = getDatabase();
    const availability = stock > 0 ? "In Stock" : "Out of Stock";
    db.prepare("UPDATE products SET stock = ?, stockAvailability = ?, updatedAt = ? WHERE id = ?")
      .run(stock, availability, new Date().toISOString(), id);
    return this.getById(id);
  },"""

new_prod_update = """  updateStock(id: string, stock: number) {
    const db = getDatabase();
    const availability = stock > 0 ? "In Stock" : "Out of Stock";
    db.prepare("UPDATE products SET stock = ?, stockAvailability = ?, updatedAt = ? WHERE id = ?")
      .run(stock, availability, new Date().toISOString(), id);
    handleStockChangeAlert(id, stock).catch(() => {});
    return this.getById(id);
  },"""

assert old_prod_update in content, "Could not find old_prod_update in server/db.ts"
content = content.replace(old_prod_update, new_prod_update, 1)

# 2. Update inventoryRepo.updateStock
old_inv_update = """    auditLogsRepo.log(updatedBy, "STOCK_UPDATE", `Updated ${prod.sku} stock from ${oldStock} to ${newStock}. Reason: ${reason || "Manual adjustment"}`);
    return { success: true, oldStock, newStock, availability };
  },"""

new_inv_update = """    auditLogsRepo.log(updatedBy, "STOCK_UPDATE", `Updated ${prod.sku} stock from ${oldStock} to ${newStock}. Reason: ${reason || "Manual adjustment"}`);
    handleStockChangeAlert(productId, newStock).catch(() => {});
    return { success: true, oldStock, newStock, availability };
  },"""

assert old_inv_update in content, "Could not find old_inv_update in server/db.ts"
content = content.replace(old_inv_update, new_inv_update, 1)

# 3. Update inventoryRepo.adjustStock
old_inv_adjust = """    auditLogsRepo.log(
      actor,
      `STOCK_${changeType || "ADJUST"}`,
      `Adjusted ${prod.sku} stock by ${delta} (${oldStock} -> ${newStock}). Ref: ${referenceId || "N/A"}. Reason: ${reason || "Inventory adjustment"}`
    );

    return { productId, oldStock, newStock, delta, availability };
  }"""

new_inv_adjust = """    auditLogsRepo.log(
      actor,
      `STOCK_${changeType || "ADJUST"}`,
      `Adjusted ${prod.sku} stock by ${delta} (${oldStock} -> ${newStock}). Ref: ${referenceId || "N/A"}. Reason: ${reason || "Inventory adjustment"}`
    );
    handleStockChangeAlert(productId, newStock).catch(() => {});
    return { productId, oldStock, newStock, delta, availability };
  }"""

assert old_inv_adjust in content, "Could not find old_inv_adjust in server/db.ts"
content = content.replace(old_inv_adjust, new_inv_adjust, 1)

# 4. Add handleStockChangeAlert & registerLowStockNotifier
alert_handler_code = """
let lowStockNotifier: ((prod: any, threshold: number) => Promise<void>) | null = null;

export function registerLowStockNotifier(fn: (prod: any, threshold: number) => Promise<void>) {
  lowStockNotifier = fn;
}

export async function handleStockChangeAlert(productId: string, newStock: number) {
  try {
    const threshold = siteContentRepo.getLowStockThreshold();
    const db = getDatabase();
    const prod = db.prepare("SELECT id, sku, nameEn, nameTa, stock FROM products WHERE id = ?").get(productId) as any;
    if (!prod) return;

    if (newStock <= threshold) {
      if (lowStockAlertsRepo.shouldAlert(productId, newStock, threshold)) {
        lowStockAlertsRepo.recordAlert(productId, prod.sku, threshold, newStock);
        auditLogsRepo.log("System", "LOW_STOCK_ALERT_TRIGGERED", `${prod.sku} stock (${newStock}) is at or below threshold (${threshold})`);
        if (lowStockNotifier) {
          try {
            await lowStockNotifier({ ...prod, stock: newStock }, threshold);
          } catch (notifErr: any) {
            console.error(`[LowStockAlert] Notification error for ${prod.sku}:`, notifErr?.message || notifErr);
            auditLogsRepo.log("System", "TELEGRAM_ALERT_FAILED", `Failed to send low stock alert for ${prod.sku}: ${notifErr?.message || notifErr}`);
          }
        }
      }
    } else {
      // Stock returned above threshold: reset alert state so a future drop alerts again
      const existing = lowStockAlertsRepo.getAlert(productId);
      if (existing && existing.alertState === "ALERTED") {
        lowStockAlertsRepo.clearAlert(productId);
        auditLogsRepo.log("System", "LOW_STOCK_ALERT_CLEARED", `${prod.sku} restocked to ${newStock} (above threshold ${threshold})`);
      }
    }
  } catch (err) {
    console.error("[LowStockAlert] Error in handleStockChangeAlert:", err);
  }
}
"""

content = content + "\n" + alert_handler_code

with open('server/db.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Successfully integrated handleStockChangeAlert into server/db.ts")
