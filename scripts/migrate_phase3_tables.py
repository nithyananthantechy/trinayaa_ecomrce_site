import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "trinayaa.db")

def migrate():
    print(f"Connecting to database at: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. support_tickets
    print("Creating support_tickets table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS support_tickets (
      id TEXT PRIMARY KEY,
      ticket_number TEXT NOT NULL UNIQUE,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      order_id TEXT,
      order_number TEXT,
      category TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Normal',
      status TEXT NOT NULL DEFAULT 'Open',
      assigned_admin_id TEXT,
      assigned_admin_name TEXT,
      resolved_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 2. support_ticket_messages
    print("Creating support_ticket_messages table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS support_ticket_messages (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      sender_type TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      message TEXT NOT NULL,
      attachment_reference TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 3. support_ticket_audit_logs
    print("Creating support_ticket_audit_logs table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS support_ticket_audit_logs (
      id TEXT PRIMARY KEY,
      ticket_id TEXT NOT NULL,
      action TEXT NOT NULL,
      performed_by TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 4. customer_feedback
    print("Creating customer_feedback table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS customer_feedback (
      id TEXT PRIMARY KEY,
      customer_id TEXT,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      customer_phone TEXT,
      category TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      order_id TEXT,
      order_number TEXT,
      product_id TEXT,
      admin_response TEXT,
      admin_responded_at TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      internal_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 5. product_reviews
    print("Creating product_reviews table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS product_reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      rating INTEGER NOT NULL,
      title TEXT NOT NULL,
      review TEXT NOT NULL,
      is_verified_purchase INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'PENDING',
      admin_notes TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    """)

    # 6. wishlist_items
    print("Creating wishlist_items table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, product_id)
    );
    """)

    # Indexes
    print("Creating indexes...")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_tickets_cust ON support_tickets(customer_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_tickets_num ON support_tickets(ticket_number);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_support_ticket_msgs_tid ON support_ticket_messages(ticket_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_cust ON customer_feedback(customer_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_feedback_status ON customer_feedback(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reviews_prod ON product_reviews(product_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reviews_cust ON product_reviews(customer_id);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_reviews_status ON product_reviews(status);")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_wishlist_user ON wishlist_items(user_id);")

    conn.commit()
    conn.close()
    print("✅ Phase 3 migration completed successfully!")

if __name__ == "__main__":
    migrate()
