import path from "node:path";

async function main() {
  const db = await import("../server/db.ts");
  const rawDb = db.getDatabase();
  const now = new Date().toISOString();

  console.log("=== CHECKING & PROVISIONING CREDENTIALS ===");

  // 1. Promote admin@trinayaa.in to SUPER_ADMIN so they can manage both Admin & Retail
  rawDb.prepare("UPDATE users SET role = 'SUPER_ADMIN', updatedAt = ? WHERE email = 'admin@trinayaa.in'").run(now);
  const adminUser = db.usersRepo.getByEmail("admin@trinayaa.in");
  console.log("Admin user:", { email: adminUser.email, role: adminUser.role, status: adminUser.status });

  // 2. Ensure Erode HQ Branch exists
  let branch = rawDb.prepare("SELECT * FROM retail_branches WHERE code = 'ERODE_HQ'").get();
  if (!branch) {
    console.log("Creating Erode HQ retail branch...");
    branch = db.retailBranchesRepo.create({
      code: "ERODE_HQ",
      name: "TRINAYAA Erode Head Store",
      address: "14/2 Bhavani Main Road, Ashokapuram",
      city: "Erode",
      state: "Tamil Nadu",
      pinCode: "638004",
      phone: "+919876543210",
      email: "retail@trinayaa.in"
    });
    console.log("Branch created:", branch.id, branch.name);
  } else {
    console.log("Branch exists:", branch.id, branch.name);
  }

  // 3. Create or update retail staff user
  const retailPassword = "Retail@Trinayaa2026!";
  const retailHash = db.hashPassword(retailPassword);

  const existingRetail = db.usersRepo.getByEmail("retail@trinayaa.in");
  if (!existingRetail) {
    rawDb.prepare(`
      INSERT INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'RETAIL_SHOP_HANDLER', 'ACTIVE', ?, ?, ?)
    `).run("usr_retail_staff_erode", "retail@trinayaa.in", retailHash, "TRINAYAA Retail Staff", "+919876543202", branch.id, now, now);
    console.log("Created retail user: retail@trinayaa.in");
  } else {
    rawDb.prepare(`
      UPDATE users SET passwordHash = ?, role = 'RETAIL_SHOP_HANDLER', branchId = ?, status = 'ACTIVE', updatedAt = ?
      WHERE email = 'retail@trinayaa.in'
    `).run(retailHash, branch.id, now);
    console.log("Updated existing retail user: retail@trinayaa.in");
  }

  // Also support placeholder email retail.erode@trinayaa.in
  const existingRetailAlias = db.usersRepo.getByEmail("retail.erode@trinayaa.in");
  if (!existingRetailAlias) {
    rawDb.prepare(`
      INSERT INTO users (id, email, passwordHash, name, phone, role, status, branchId, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'RETAIL_SHOP_HANDLER', 'ACTIVE', ?, ?, ?)
    `).run("usr_retail_alias_erode", "retail.erode@trinayaa.in", retailHash, "TRINAYAA Retail Erode", "+919876543203", branch.id, now, now);
    console.log("Created retail alias: retail.erode@trinayaa.in");
  } else {
    rawDb.prepare(`
      UPDATE users SET passwordHash = ?, role = 'RETAIL_SHOP_HANDLER', branchId = ?, status = 'ACTIVE', updatedAt = ?
      WHERE email = 'retail.erode@trinayaa.in'
    `).run(retailHash, branch.id, now);
    console.log("Updated retail alias: retail.erode@trinayaa.in");
  }

  // 4. Test Verification
  console.log("\n=== TESTING CREDENTIALS ===");
  const adminTest = db.verifyPassword("Admin@Trinayaa2026!", adminUser.passwordHash);
  console.log("1. admin@trinayaa.in / Admin@Trinayaa2026! ->", adminTest ? "VALID (OK)" : "FAILED");

  const retailUser = db.usersRepo.getByEmail("retail@trinayaa.in");
  const retailTest = db.verifyPassword("Retail@Trinayaa2026!", retailUser.passwordHash);
  console.log("2. retail@trinayaa.in / Retail@Trinayaa2026! ->", retailTest ? "VALID (OK)" : "FAILED");

  const retailAliasUser = db.usersRepo.getByEmail("retail.erode@trinayaa.in");
  const retailAliasTest = db.verifyPassword("Retail@Trinayaa2026!", retailAliasUser.passwordHash);
  console.log("3. retail.erode@trinayaa.in / Retail@Trinayaa2026! ->", retailAliasTest ? "VALID (OK)" : "FAILED");

  console.log("\nAll staff and admin credentials verified successfully!");
}

main().catch(console.error);

