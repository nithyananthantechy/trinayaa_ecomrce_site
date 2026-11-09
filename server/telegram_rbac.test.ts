import { describe, expect, it, beforeAll } from "vitest";
import * as db from "./db";
import { handleTelegramUpdate } from "./telegram";

describe("Role-Based Telegram Bot Access (Stock Manager vs Founder)", () => {
  const founderTelegramId = "9988776655";
  const warehouseStaffTelegramId = "8877665544";
  const testChatId = 987654321;
  const testSku = "TRN-1001"; // Pure Amla Powder

  beforeAll(() => {
    // Authorize Founder as SUPER_ADMIN
    db.telegramRepo.addAdmin(founderTelegramId, "Founder Nithya", "SUPER_ADMIN", "System");
    // Authorize Warehouse Staff as STOCK_MANAGER
    db.telegramRepo.addAdmin(warehouseStaffTelegramId, "Warehouse Mani", "STOCK_MANAGER", "Founder Nithya");
  });

  it("verifies role assignments for Founder and Stock Manager", () => {
    const founderRole = db.telegramRepo.getAdminRole(founderTelegramId);
    expect(founderRole).toBe("SUPER_ADMIN");

    const managerRole = db.telegramRepo.getAdminRole(warehouseStaffTelegramId);
    expect(managerRole).toBe("STOCK_MANAGER");

    const founderIds = db.telegramRepo.getFounderAdminIds();
    expect(founderIds).toContain(founderTelegramId);
    expect(founderIds).not.toContain(warehouseStaffTelegramId);
  });

  it("creates a pending stock maintenance request via Stock Manager", () => {
    const initialProduct = db.productsRepo.getBySku(testSku);
    expect(initialProduct).toBeDefined();
    const originalStock = initialProduct!.stock;

    const req = db.telegramRepo.createStockRequest({
      managerTelegramId: warehouseStaffTelegramId,
      managerName: "Warehouse Mani",
      productSku: testSku,
      productName: initialProduct!.name,
      currentStock: originalStock,
      quantityChange: 50,
      newStockTarget: originalStock + 50,
      requestType: "COMMAND",
      notes: "Received batch shipment from Erode mill",
    });

    expect(req).toBeDefined();
    expect(req.requestNumber).toMatch(/^REQ-/);
    expect(req.status).toBe("PENDING");
    expect(req.quantityChange).toBe(50);
    expect(req.newStockTarget).toBe(originalStock + 50);

    // Verify live product stock is NOT changed yet
    const productAfterRequest = db.productsRepo.getBySku(testSku);
    expect(productAfterRequest!.stock).toBe(originalStock);
  });

  it("allows Founder to approve stock request and atomicaly update inventory", () => {
    const initialProduct = db.productsRepo.getBySku(testSku);
    const originalStock = initialProduct!.stock;

    const req = db.telegramRepo.createStockRequest({
      managerTelegramId: warehouseStaffTelegramId,
      managerName: "Warehouse Mani",
      productSku: testSku,
      productName: initialProduct!.name,
      currentStock: originalStock,
      quantityChange: 25,
      newStockTarget: originalStock + 25,
      requestType: "COMMAND",
      notes: "Restock test approval",
    });

    const result = db.telegramRepo.approveStockRequest(req.id, "Founder Nithya");
    expect(result.success).toBe(true);

    // Check request status
    const updatedReq = db.telegramRepo.getStockRequest(req.id);
    expect(updatedReq!.status).toBe("APPROVED");
    expect(updatedReq!.reviewedBy).toBe("Founder Nithya");
    expect(updatedReq!.reviewedAt).toBeDefined();

    // Verify live product inventory was updated
    const productAfterApproval = db.productsRepo.getBySku(testSku);
    expect(productAfterApproval!.stock).toBe(originalStock + 25);
  });

  it("allows Founder to reject stock request leaving inventory unchanged", () => {
    const initialProduct = db.productsRepo.getBySku(testSku);
    const originalStock = initialProduct!.stock;

    const req = db.telegramRepo.createStockRequest({
      managerTelegramId: warehouseStaffTelegramId,
      managerName: "Warehouse Mani",
      productSku: testSku,
      productName: initialProduct!.name,
      currentStock: originalStock,
      quantityChange: 100,
      newStockTarget: originalStock + 100,
      requestType: "COMMAND",
      notes: "Incorrect count from packing line",
    });

    const result = db.telegramRepo.rejectStockRequest(req.id, "Founder Nithya");
    expect(result.success).toBe(true);

    // Check request status
    const updatedReq = db.telegramRepo.getStockRequest(req.id);
    expect(updatedReq!.status).toBe("REJECTED");
    expect(updatedReq!.reviewedBy).toBe("Founder Nithya");

    // Verify live product inventory was NOT modified
    const productAfterReject = db.productsRepo.getBySku(testSku);
    expect(productAfterReject!.stock).toBe(originalStock);
  });

  it("updates admin role from Stock Manager to Super Admin", () => {
    const success = db.telegramRepo.updateAdminRole(warehouseStaffTelegramId, "SUPER_ADMIN");
    expect(success).toBe(true);

    const updatedRole = db.telegramRepo.getAdminRole(warehouseStaffTelegramId);
    expect(updatedRole).toBe("SUPER_ADMIN");

    // Revert back for consistency
    db.telegramRepo.updateAdminRole(warehouseStaffTelegramId, "STOCK_MANAGER");
    expect(db.telegramRepo.getAdminRole(warehouseStaffTelegramId)).toBe("STOCK_MANAGER");
  });

  it("handles Stock Manager /requeststock command via handleTelegramUpdate", async () => {
    const update = {
      update_id: 888123,
      message: {
        message_id: 101,
        date: Math.floor(Date.now() / 1000),
        chat: { id: testChatId, type: "private" },
        from: { id: parseInt(warehouseStaffTelegramId), first_name: "Warehouse", last_name: "Mani" },
        text: `/requeststock ${testSku} +15 Morning production batch`,
      },
    };

    const res = await handleTelegramUpdate(update as any);
    expect(res).toBeDefined();

    // Check that a new request was added
    const requests = db.telegramRepo.listStockRequests(10);
    const latest = requests[0];
    expect(latest.productSku).toBe(testSku);
    expect(latest.quantityChange).toBe(15);
    expect(latest.status).toBe("PENDING");
  });
});
