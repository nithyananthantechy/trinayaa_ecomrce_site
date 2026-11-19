# TRINAYAA ENTERPRISES — DATABASE BACKUP & RESTORE SOP
## Standard Operating Procedure for Production SQLite Backups, Integrity Verification & Point-in-Time Disaster Recovery

**Database Path:** `./data/trinayaa.db`  
**Engine:** SQLite 3 in WAL (Write-Ahead Logging) Mode  
**Zero Data Loss Objective:** RPO (Recovery Point Objective) < 4 hours; RTO (Recovery Time Objective) < 15 minutes  

---

## 1. BACKUP PRINCIPLES & WAL MODE SAFETY

TRINAYAA uses SQLite with Write-Ahead Logging (`PRAGMA journal_mode=WAL;`).  
**CRITICAL:** Never create backups by using raw file copy (`cp data/trinayaa.db backup.db`) while the application server is writing to the database, as that can result in a corrupt snapshot missing WAL frames.

Always use either:
1. SQLite's official online backup API (`sqlite3 data/trinayaa.db ".backup ..."`)
2. Or Node.js / Python DatabaseSync connection during scheduled low-traffic maintenance.

---

## 2. MANUAL BACKUP PROCEDURE

To create an immediate, timestamped backup before maintenance, migrations, or software updates:

```bash
# Navigate to application root
cd /var/www/trinayaa

# Define timestamp
TS=$(date +"%Y%m%d_%H%M%S")
BACKUP_PATH="./data/backups/trinayaa_backup_${TS}.db"

# Ensure backup directory exists
mkdir -p ./data/backups

# Execute atomic SQLite online backup
sqlite3 ./data/trinayaa.db ".backup '${BACKUP_PATH}'"

# Verify backup file size and integrity
sqlite3 "${BACKUP_PATH}" "PRAGMA integrity_check;"
# MUST OUTPUT: ok
```

---

## 3. AUTOMATED BACKUP CRON SCHEDULE (CRONTAB)

Configure a production crontab entry for user `www-data` to take snapshots every 4 hours and retain them for 30 days:

Create backup script `/var/www/trinayaa/scripts/auto_backup.sh`:

```bash
#!/bin/bash
set -euo pipefail

APP_DIR="/var/www/trinayaa"
BACKUP_DIR="${APP_DIR}/data/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/trinayaa_backup_${TIMESTAMP}.db"

mkdir -p "${BACKUP_DIR}"

# 1. Take atomic online backup
sqlite3 "${APP_DIR}/data/trinayaa.db" ".backup '${BACKUP_FILE}'"

# 2. Verify integrity
CHECK_RESULT=$(sqlite3 "${BACKUP_FILE}" "PRAGMA integrity_check;")
if [ "${CHECK_RESULT}" != "ok" ]; then
    echo "ERROR: Backup integrity check failed for ${BACKUP_FILE}!" >&2
    exit 1
fi

# 3. Gzip compress verified backup
gzip "${BACKUP_FILE}"

# 4. Remove backups older than 30 days
find "${BACKUP_DIR}" -name "trinayaa_backup_*.db.gz" -mtime +30 -delete

echo "Backup completed successfully: ${BACKUP_FILE}.gz"
```

Make executable and register in crontab:
```bash
chmod +x /var/www/trinayaa/scripts/auto_backup.sh

# Edit crontab
crontab -e

# Add schedule (Runs every 4 hours: 00:00, 04:00, 08:00, 12:00, 16:00, 20:00)
0 */4 * * * /var/www/trinayaa/scripts/auto_backup.sh >> /var/log/trinayaa/backup.log 2>&1
```

---

## 4. POINT-IN-TIME DISASTER RECOVERY PROCEDURE

If the primary database encounters hardware corruption or accidental administrative deletion:

```bash
# 1. Stop the application server immediately
sudo -u www-data pm2 stop trinayaa-store

# 2. Archive the existing corrupt database files
cd /var/www/trinayaa/data
mv trinayaa.db trinayaa.db.corrupt_$(date +%s)
mv trinayaa.db-wal trinayaa.db-wal.corrupt_$(date +%s) 2>/dev/null || true
mv trinayaa.db-shm trinayaa.db-shm.corrupt_$(date +%s) 2>/dev/null || true

# 3. Select the latest healthy verified backup
LATEST_BACKUP=$(ls -t backups/trinayaa_backup_*.db.gz | head -n 1)
echo "Restoring from: ${LATEST_BACKUP}"

# Decompress and place as trinayaa.db
gunzip -c "${LATEST_BACKUP}" > trinayaa.db

# 4. Set strict file ownership and permissions
sudo chown www-data:www-data trinayaa.db
sudo chmod 640 trinayaa.db

# 5. Run integrity and foreign key validation
sqlite3 trinayaa.db "PRAGMA integrity_check;"
sqlite3 trinayaa.db "PRAGMA foreign_key_check;"

# 6. Verify catalogue products count (Must equal 162)
sqlite3 trinayaa.db "SELECT count(*) FROM products WHERE id NOT LIKE 'prod_inelig_%' AND id NOT LIKE 'prod_low_stock_%';"

# 7. Restart application server
sudo -u www-data pm2 start trinayaa-store

# 8. Probe health endpoint
curl -f http://localhost:3000/health
```
