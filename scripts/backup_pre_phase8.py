import shutil
import os
import time

os.makedirs('backups', exist_ok=True)
timestamp = time.strftime("%Y%m%d_%H%M%S")
backup_path = f"backups/trinayaa_pre_phase8_{timestamp}.db"
shutil.copy2("data/trinayaa.db", backup_path)
print(f"Backup created: {backup_path}, Size: {os.path.getsize(backup_path)} bytes")
