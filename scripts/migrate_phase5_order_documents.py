import sqlite3
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "trinayaa.db")

def migrate():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Create order_documents table
    print("Creating order_documents table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS order_documents (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      document_type TEXT NOT NULL, -- 'INVOICE', 'SHIPPING_SLIP', 'DELIVERY_CHALLAN', 'PACKING_STICKER'
      document_number TEXT NOT NULL UNIQUE,
      generated_by TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
    """)

    # 2. Create indexes
    print("Creating indexes on order_documents...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_order_docs_order ON order_documents(order_id, document_type);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_order_docs_number ON order_documents(document_number);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_order_docs_order_number ON order_documents(order_number);")

    conn.commit()
    conn.close()
    print("Phase 5 order documents migration completed successfully.")

if __name__ == "__main__":
    migrate()
