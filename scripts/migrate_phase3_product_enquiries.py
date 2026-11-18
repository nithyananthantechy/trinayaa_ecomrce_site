import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "trinayaa.db")

def migrate():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    print("Creating product_enquiries table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS product_enquiries (
      id TEXT PRIMARY KEY,
      enquiry_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      product_name TEXT NOT NULL,
      category TEXT,
      requested_quantity TEXT NOT NULL,
      preferred_pack_size TEXT,
      description TEXT NOT NULL,
      reference_image TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      admin_notes TEXT,
      reviewed_at TEXT,
      reviewed_by TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    print("Creating product_enquiries indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_enquiries_cust ON product_enquiries(customer_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_enquiries_num ON product_enquiries(enquiry_number);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_enquiries_status ON product_enquiries(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_product_enquiries_created ON product_enquiries(created_at);")

    conn.commit()
    conn.close()
    print("✅ Phase 3 product_enquiries migration completed successfully!")

if __name__ == "__main__":
    migrate()
