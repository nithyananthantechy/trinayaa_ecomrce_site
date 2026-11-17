import sqlite3

conn = sqlite3.connect('data/trinayaa.db')
c = conn.cursor()

c.executescript("""
CREATE TABLE IF NOT EXISTS business_enquiries (
  id TEXT PRIMARY KEY,
  enquiryNumber TEXT UNIQUE NOT NULL,
  contactName TEXT NOT NULL,
  companyName TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  buyerType TEXT NOT NULL,
  deliveryCity TEXT NOT NULL,
  deliveryState TEXT NOT NULL,
  requirements TEXT,
  gstNumber TEXT,
  status TEXT NOT NULL DEFAULT 'NEW',
  assignedTo TEXT,
  internalNotes TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS business_enquiry_items (
  id TEXT PRIMARY KEY,
  enquiryId TEXT NOT NULL,
  productId TEXT,
  sku TEXT NOT NULL,
  productName TEXT NOT NULL,
  quantity REAL NOT NULL,
  unit TEXT NOT NULL DEFAULT 'kg',
  targetPrice REAL,
  createdAt TEXT NOT NULL,
  FOREIGN KEY (enquiryId) REFERENCES business_enquiries(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enquiries_number ON business_enquiries(enquiryNumber);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON business_enquiries(status);
CREATE INDEX IF NOT EXISTS idx_enquiry_items_enquiryId ON business_enquiry_items(enquiryId);
""")

conn.commit()
print("Tables in data/trinayaa.db:")
for row in c.execute("SELECT name FROM sqlite_master WHERE type='table'"):
    print("-", row[0])

conn.close()

