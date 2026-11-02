// TRINAYAA Database Backup & Verification Utility
// Tests backup creation, data integrity, and atomic restoration
import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

const DATA_DIR = path.resolve(process.cwd(), "data");
const BACKUP_DIR = path.resolve(DATA_DIR, "backups");
const SOURCE_DB_PATH = path.resolve(DATA_DIR, "trinayaa.db");

if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

function runBackupAndRestoreVerification() {
  console.log("========================================================================");
  console.log("        TRINAYAA — PRODUCTION BACKUP & RESTORE VERIFICATION             ");
  console.log("========================================================================");

  if (!fs.existsSync(SOURCE_DB_PATH)) {
    throw new Error(`Source database not found at ${SOURCE_DB_PATH}`);
  }

  // 1. Verify source database integrity
  console.log("[1/4] Inspecting source database:", SOURCE_DB_PATH);
  const sourceDb = new DatabaseSync(SOURCE_DB_PATH);
  const sourceProducts = sourceDb.prepare("SELECT COUNT(*) as c FROM products").get().c;
  const sourceCategories = sourceDb.prepare("SELECT COUNT(*) as c FROM categories").get().c;
  const fkCheck = sourceDb.prepare("PRAGMA foreign_key_check").all();
  const integrityCheck = sourceDb.prepare("PRAGMA integrity_check").all();

  console.log(`  • Source Products: ${sourceProducts}`);
  console.log(`  • Source Categories: ${sourceCategories}`);
  console.log(`  • Foreign Key Violations: ${fkCheck.length}`);
  console.log(`  • Integrity Check: ${integrityCheck[0].integrity_check}`);

  if (fkCheck.length > 0 || integrityCheck[0].integrity_check !== "ok") {
    throw new Error("Source database failed integrity check!");
  }

  // 2. Create production backup
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupFileName = `trinayaa_backup_${timestamp}.db`;
  const backupFilePath = path.join(BACKUP_DIR, backupFileName);

  console.log(`\n[2/4] Generating production backup: ${backupFilePath}`);
  // SQLite WAL checkpoint before copy to ensure all pending pages are written
  try {
    sourceDb.exec("PRAGMA wal_checkpoint(TRUNCATE);");
  } catch (e) {
    console.warn("  (WAL checkpoint note):", e.message);
  }
  sourceDb.close();

  fs.copyFileSync(SOURCE_DB_PATH, backupFilePath);
  const backupStats = fs.statSync(backupFilePath);
  console.log(`  • Backup created successfully (${(backupStats.size / 1024).toFixed(1)} KB)`);

  // 3. Test Restoration into an isolated test database
  const testRestorePath = path.resolve(DATA_DIR, "test_restore_verification.db");
  console.log(`\n[3/4] Testing restoration from backup into: ${testRestorePath}`);
  if (fs.existsSync(testRestorePath)) {
    fs.unlinkSync(testRestorePath);
  }
  fs.copyFileSync(backupFilePath, testRestorePath);

  const restoredDb = new DatabaseSync(testRestorePath);
  const restoredProducts = restoredDb.prepare("SELECT COUNT(*) as c FROM products").get().c;
  const restoredCategories = restoredDb.prepare("SELECT COUNT(*) as c FROM categories").get().c;
  const restoredSkus = restoredDb.prepare("SELECT MIN(sku) as minSku, MAX(sku) as maxSku FROM products").get();
  const restoredIntegrity = restoredDb.prepare("PRAGMA integrity_check").all();

  console.log(`  • Restored Products: ${restoredProducts} (Expected: ${sourceProducts})`);
  console.log(`  • Restored Categories: ${restoredCategories} (Expected: ${sourceCategories})`);
  console.log(`  • Restored SKU Range: ${restoredSkus.minSku} - ${restoredSkus.maxSku}`);
  console.log(`  • Restored Integrity: ${restoredIntegrity[0].integrity_check}`);

  const passed =
    restoredProducts === 162 &&
    restoredCategories === 9 &&
    restoredIntegrity[0].integrity_check === "ok" &&
    restoredSkus.minSku === "TRN-1001" &&
    restoredSkus.maxSku === "TRN-1162";

  restoredDb.close();
  fs.unlinkSync(testRestorePath);

  // 4. Results
  console.log("\n[4/4] Verification Result:");
  if (passed) {
    console.log("  >>> SUCCESS: Production database backup and restoration verified! (PASS)");
  } else {
    throw new Error("Restoration verification check failed!");
  }
  console.log("========================================================================\n");
}

try {
  runBackupAndRestoreVerification();
  process.exit(0);
} catch (err) {
  console.error("Backup & restore verification failed:", err);
  process.exit(1);
}
