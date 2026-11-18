import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "trinayaa.db")

def migrate():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    now = datetime.now().isoformat()

    # 1. Add branchId to users table if not exists
    cursor.execute("PRAGMA table_info(users)")
    cols = [col[1] for col in cursor.fetchall()]
    if "branchId" not in cols:
        print("Adding branchId column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN branchId TEXT")

    # 2. Create retail_branches table
    print("Creating retail_branches table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS retail_branches (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL DEFAULT 'Tamil Nadu',
      pin_code TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    """)

    # 3. Create retail_branch_stock table
    print("Creating retail_branch_stock table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS retail_branch_stock (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      variant_id TEXT,
      sku TEXT NOT NULL,
      stock_quantity INTEGER NOT NULL DEFAULT 50,
      low_stock_threshold INTEGER NOT NULL DEFAULT 10,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES retail_branches(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      UNIQUE(branch_id, product_id, sku)
    );
    """)

    # 4. Create retail_stock_movements table
    print("Creating retail_stock_movements table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS retail_stock_movements (
      id TEXT PRIMARY KEY,
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      change_type TEXT NOT NULL,
      delta INTEGER NOT NULL,
      previous_stock INTEGER NOT NULL,
      new_stock INTEGER NOT NULL,
      reference_id TEXT,
      reason TEXT,
      performed_by TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES retail_branches(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    """)

    # 5. Create retail_stock_adjustments table
    print("Creating retail_stock_adjustments table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS retail_stock_adjustments (
      id TEXT PRIMARY KEY,
      adjustment_number TEXT UNIQUE NOT NULL,
      branch_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      sku TEXT NOT NULL,
      requested_delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      requested_by TEXT NOT NULL,
      reviewed_by TEXT,
      reviewed_at TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES retail_branches(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
    """)

    # 6. Create retail_sales table
    print("Creating retail_sales table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS retail_sales (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      branch_id TEXT NOT NULL,
      handler_id TEXT NOT NULL,
      handler_name TEXT NOT NULL,
      customer_name TEXT NOT NULL DEFAULT 'Walk-in Customer',
      customer_phone TEXT,
      customer_email TEXT,
      subtotal REAL NOT NULL,
      discount_amount REAL NOT NULL DEFAULT 0,
      discount_reason TEXT,
      tax_amount REAL NOT NULL DEFAULT 0,
      total REAL NOT NULL,
      payment_method TEXT NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PAID',
      sale_status TEXT NOT NULL DEFAULT 'COMPLETED',
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (branch_id) REFERENCES retail_branches(id),
      FOREIGN KEY (handler_id) REFERENCES users(id)
    );
    """)

    # 7. Create retail_sale_items table
    print("Creating retail_sale_items table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS retail_sale_items (
      id TEXT PRIMARY KEY,
      sale_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      sku TEXT NOT NULL,
      pack_size TEXT NOT NULL,
      unit_price REAL NOT NULL,
      quantity INTEGER NOT NULL,
      total_price REAL NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES retail_sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    );
    """)

    # 8. Create indexes
    print("Creating indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_retail_stock_branch ON retail_branch_stock(branch_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_retail_stock_prod ON retail_branch_stock(product_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_retail_sales_branch ON retail_sales(branch_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_retail_sales_inv ON retail_sales(invoice_number);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_retail_sales_created ON retail_sales(created_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_retail_movements_branch ON retail_stock_movements(branch_id, created_at);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_retail_adj_branch ON retail_stock_adjustments(branch_id, status);")

    # 9. Seed default initial branch
    cursor.execute("SELECT id FROM retail_branches WHERE id = 'brn_erode_hq'")
    if not cursor.fetchone():
        print("Seeding default branch 'brn_erode_hq' (TRINAYAA Erode Flagship Branch)...")
        cursor.execute("""
        INSERT INTO retail_branches (
          id, code, name, address, city, state, pin_code, phone, email, is_active, created_at, updated_at
        ) VALUES (
          'brn_erode_hq', 'ERODE-HQ', 'TRINAYAA Erode Flagship Branch',
          '142 Perundurai Road, Near Collectorate', 'Erode', 'Tamil Nadu',
          '638011', '+91 98765 43210', 'erode@trinayaa.com', 1, ?, ?
        )
        """, (now, now))

    # Also seed a second retail branch for branch isolation testing: Coimbatore Town Hall Branch
    cursor.execute("SELECT id FROM retail_branches WHERE id = 'brn_cbe_town'")
    if not cursor.fetchone():
        print("Seeding branch 'brn_cbe_town' (TRINAYAA Coimbatore Branch)...")
        cursor.execute("""
        INSERT INTO retail_branches (
          id, code, name, address, city, state, pin_code, phone, email, is_active, created_at, updated_at
        ) VALUES (
          'brn_cbe_town', 'CBE-01', 'TRINAYAA Coimbatore Branch',
          '48 Raja Street, Town Hall', 'Coimbatore', 'Tamil Nadu',
          '641001', '+91 98765 43211', 'coimbatore@trinayaa.com', 1, ?, ?
        )
        """, (now, now))

    # 10. Seed initial branch stock for all existing products into brn_erode_hq and brn_cbe_town
    cursor.execute("SELECT id, sku, stock FROM products WHERE status != 'Archived'")
    all_products = cursor.fetchall()
    print(f"Seeding branch stock for {len(all_products)} products into retail branches...")
    for prod_id, sku, catalog_stock in all_products:
        initial_stock = max(20, min(catalog_stock, 100))
        # Branch 1
        stock_id_1 = f"rbs_erode_{prod_id}"
        cursor.execute("""
        INSERT INTO retail_branch_stock (id, branch_id, product_id, sku, stock_quantity, low_stock_threshold, updated_at)
        VALUES (?, 'brn_erode_hq', ?, ?, ?, 10, ?)
        ON CONFLICT(branch_id, product_id, sku) DO NOTHING
        """, (stock_id_1, prod_id, sku, initial_stock, now))

        # Branch 2
        stock_id_2 = f"rbs_cbe_{prod_id}"
        cursor.execute("""
        INSERT INTO retail_branch_stock (id, branch_id, product_id, sku, stock_quantity, low_stock_threshold, updated_at)
        VALUES (?, 'brn_cbe_town', ?, ?, ?, 10, ?)
        ON CONFLICT(branch_id, product_id, sku) DO NOTHING
        """, (stock_id_2, prod_id, sku, initial_stock, now))

    conn.commit()
    conn.close()
    print("✅ Phase 4 retail operations migration and branch seeding completed successfully!")

if __name__ == "__main__":
    migrate()
