import sqlite3
import json
import time

db_path = 'data/trinayaa.db'
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

now = "2026-11-07T20:45:00.000Z"

# 1. Policies content extracted from existing PolicyPage.tsx
default_policies = {
    "shipping": {
        "slug": "shipping",
        "title": "Shipping & Delivery Policy",
        "subtitle": "Pan-India tracked delivery for fresh botanical herbs, pure seeds, and raw powders.",
        "isPublished": True,
        "lastUpdated": "November 2026",
        "content": """<h2>1. Order Processing & Dispatch</h2>
<p>All orders placed on TRINAYAA (https://trinayaa.in) are processed and dispatched directly from our dedicated traditional herb packaging facility in Erode, Tamil Nadu – 638002.</p>
<p>Orders placed before 2:00 PM IST on business days are dispatched within 24 to 48 hours following payment verification. Orders placed on Sundays or national holidays are dispatched on the next operational business day.</p>

<h2>2. Shipping Charges & Free Delivery Threshold</h2>
<p>We offer transparent, upfront delivery pricing without hidden surcharges.</p>
<ul>
  <li>Free Delivery: Available across all serviceable Indian pin codes on all orders with a net cart value of ₹799 or more.</li>
  <li>Standard Delivery: A nominal flat shipping charge of ₹60 is applied to orders below ₹799.</li>
</ul>

<h2>3. Delivery Timelines & Courier Partners</h2>
<p>We partner with reputable national courier and postal networks (including India Post Speed Post, ST Courier, Professional Couriers, and Blue Dart) to ensure safe, tracked delivery to your doorstep.</p>
<ul>
  <li>Tamil Nadu & South India: Estimated delivery within 2 to 3 business days from dispatch.</li>
  <li>Rest of India (Metros & Major Cities): Estimated delivery within 3 to 5 business days.</li>
  <li>North-East & Remote Regions: Estimated delivery within 5 to 7 business days.</li>
</ul>

<h2>4. Real-Time Tracking</h2>
<p>Once your package is handed over to our courier partner, you will receive real-time tracking updates via email and SMS.</p>
<p>You can also track your shipment at any time by entering your Order ID (e.g. TRN-10482) on our dedicated tracking page: <a href="/track-order">https://trinayaa.in/track-order</a>.</p>

<h2>5. Packaging & Product Protection</h2>
<p>All natural botanicals, seeds, and powders are packed in food-grade, airtight, tamper-evident individual pouches. Pouches are cushioned in sturdy eco-conscious shipping boxes to protect herbs against moisture and transit handling.</p>"""
    },
    "returns": {
        "slug": "returns",
        "title": "Return & Refund Policy",
        "subtitle": "Our commitment to honest botanical quality and customer satisfaction.",
        "isPublished": True,
        "lastUpdated": "November 2026",
        "content": """<h2>1. 7-Day Replacement Guarantee</h2>
<p>Because TRINAYAA products are 100% natural, unadulterated botanical ingredients, we prioritize supreme product integrity and safety. We offer a 7-day replacement guarantee from the date of delivery if:</p>
<ul>
  <li>The package arrived physically damaged or unsealed.</li>
  <li>An incorrect product or variant was delivered.</li>
  <li>The package was lost or confirmed damaged in transit by our courier partner.</li>
</ul>

<h2>2. Replacement Process</h2>
<p>To initiate a replacement request:</p>
<ul>
  <li>Send an email to support@trinayaa.in within 7 days of receiving your package.</li>
  <li>Include your Order ID (e.g. TRN-10482) and brief photos showing the outer package and damaged item.</li>
  <li>Our customer care team will review your request and dispatch a replacement package within 2 business days at zero additional cost to you.</li>
</ul>

<h2>3. Refunds & Payment Reversals</h2>
<p>In situations where a replacement is unavailable or mutually agreed upon, a full refund will be processed to your original payment method (Razorpay: UPI, Credit/Debit Card, or NetBanking).</p>
<p>Refunds are credited to your original bank account or card within 5 to 7 business days in accordance with Indian banking settlement standards.</p>

<h2>4. Non-Returnable Scenarios</h2>
<p>To safeguard product hygiene, opened pouches cannot be accepted for return unless defective or damaged prior to receipt.</p>"""
    },
    "privacy": {
        "slug": "privacy",
        "title": "Privacy Policy",
        "subtitle": "How TRINAYAA safeguards your personal data, transactions, and privacy.",
        "isPublished": True,
        "lastUpdated": "November 2026",
        "content": """<h2>1. Information We Collect</h2>
<p>TRINAYAA Enterprises collects only the necessary information required to process and deliver your orders safely:</p>
<ul>
  <li>Contact details: Full name, email address, and mobile phone number.</li>
  <li>Shipping details: Delivery street address, city, district, state, and pin code.</li>
  <li>Account credentials: Cryptographically hashed passwords (plain text passwords are never stored).</li>
  <li>Order history: Purchased products, quantities, order numbers, and tracking information.</li>
</ul>

<h2>2. Payment Security</h2>
<p>All online payments on TRINAYAA are processed through Razorpay, a PCI-DSS Level 1 certified payment gateway.</p>
<p>TRINAYAA never stores, processes, or transmits credit/debit card numbers, UPI PINs, or CVV codes on our servers. All sensitive financial transactions occur through secure 256-bit SSL encrypted gateway channels.</p>

<h2>3. Data Sharing & Third Parties</h2>
<p>We do not sell, rent, or trade your personal information to marketing brokers or advertising networks. We share contact and shipping details solely with:</p>
<ul>
  <li>Courier & logistics partners strictly for package delivery.</li>
  <li>Transactional notification services for order status confirmations via SMS or email.</li>
</ul>

<h2>4. Data Retention & Your Rights</h2>
<p>You may request access to, correction of, or deletion of your personal account data at any time by contacting support@trinayaa.in.</p>"""
    },
    "terms": {
        "slug": "terms",
        "title": "Terms & Conditions",
        "subtitle": "Terms of service and user agreement for TRINAYAA Enterprises.",
        "isPublished": True,
        "lastUpdated": "November 2026",
        "content": """<h2>1. Agreement to Terms</h2>
<p>By accessing or purchasing through TRINAYAA (https://trinayaa.in), you agree to be bound by these Terms and Conditions and our Privacy Policy. If you do not agree, please do not use this website.</p>

<h2>2. Botanical Product Information & Medical Disclaimer</h2>
<p>TRINAYAA Enterprises provides 100% natural, single-ingredient botanical herbs, pure seeds, and raw powders. Traditional Tamil and Ayurvedic names are provided for cultural, botanical, and identification purposes.</p>
<p>TRINAYAA products are traditional natural ingredients and dietary botanicals. They are not intended to diagnose, treat, cure, or prevent any illness or disease. Consult a qualified healthcare professional before using herbs for therapeutic dietary regimens.</p>

<h2>3. Pricing & Orders</h2>
<p>All prices are quoted in Indian Rupees (INR) and are inclusive of applicable taxes. TRINAYAA reserves the right to modify prices, catalogue offerings, or promotional discounts at any time.</p>
<p>An order is confirmed only upon successful verification of payment via our Razorpay payment gateway.</p>

<h2>4. Governing Law & Jurisdiction</h2>
<p>These terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of or related to your use of this website shall be subject to the exclusive jurisdiction of the competent courts in Erode, Tamil Nadu.</p>"""
    }
}

# Migrate policies to site_content
for slug, policy in default_policies.items():
    key = f"policy_content_{slug}"
    cursor.execute("SELECT value FROM site_content WHERE key = ?", (key,))
    existing = cursor.fetchone()
    if not existing:
        cursor.execute(
            "INSERT INTO site_content (key, value, updatedAt) VALUES (?, ?, ?)",
            (key, json.dumps(policy), now)
        )
        print(f"Inserted default policy: {key}")
    else:
        print(f"Policy {key} already present in site_content.")

# 2. Social Links
social_defaults = {
    "social_instagram": "https://www.instagram.com/trinayaa_botanicals",
    "social_facebook": "https://www.facebook.com/trinayaa.enterprises",
    "social_whatsapp_phone": "+91 94422 18990",
    "social_whatsapp_message": "Hello TRINAYAA, I would like to inquire about your botanical products."
}

for key, val in social_defaults.items():
    cursor.execute("SELECT value FROM site_content WHERE key = ?", (key,))
    existing = cursor.fetchone()
    if not existing:
        cursor.execute(
            "INSERT INTO site_content (key, value, updatedAt) VALUES (?, ?, ?)",
            (key, val, now)
        )
        print(f"Inserted default social: {key} = {val}")
    else:
        print(f"Social {key} already present with value: {existing[0]}")

conn.commit()
product_count = cursor.execute("SELECT COUNT(*) FROM products").fetchone()[0]
print(f"Product count after migration: {product_count} (must be 162)")
conn.close()
print("Phase 8 Content & Social migration completed successfully.")
