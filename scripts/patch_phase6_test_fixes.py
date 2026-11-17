with open('server/phase6_inventory_shipping.test.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update categoryId to cat_5
content = content.replace('categoryId: "cat_raw_powders",', 'categoryId: "cat_5",', 1)

# 2. Update allowUser to addAdmin
content = content.replace(
    'db.telegramRepo.allowUser("tg_p6_admin_123", "p6_admin", "Admin System");',
    'db.telegramRepo.addAdmin("tg_p6_admin_123", "p6_admin", "ADMIN", "Admin System");',
    1
)

# 3. Update telegramUserId to telegramId in cleanup
content = content.replace(
    "database.prepare(\"DELETE FROM telegram_allowed_admins WHERE telegramUserId = 'tg_p6_admin_123'\").run();",
    "database.prepare(\"DELETE FROM telegram_allowed_admins WHERE telegramId = 'tg_p6_admin_123'\").run();",
    1
)

with open('server/phase6_inventory_shipping.test.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✓ Updated server/phase6_inventory_shipping.test.ts")
