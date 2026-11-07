with open('server/db.ts', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Enhance usersRepo
users_marker = 'getByEmail(email: string) {'
users_insert = '''getByPhone(phone: string) {
    const db = getDatabase();
    const clean = phone.replace(/[\\s\\-\\(\\)\\+]/g, "");
    const last10 = clean.slice(-10);
    return db.prepare(`
      SELECT * FROM users
      WHERE phone = ? OR phone = ? OR phone = ? OR phone LIKE ?
      LIMIT 1
    `).get(phone, clean, `+91${clean}`, `%${last10}`) as any;
  },

  createFromOtp(data: { phone: string; name?: string; email?: string }) {
    const db = getDatabase();
    const clean = data.phone.replace(/[\\s\\-\\(\\)\\+]/g, "").slice(-10);
    const id = "usr_" + Date.now() + "_" + Math.floor(Math.random() * 1000);
    const name = data.name?.trim() || `Customer ${clean.slice(-4)}`;
    const email = data.email?.trim().toLowerCase() || `phone_${clean}@trinayaa.in`;
    const now = new Date().toISOString();
    const randomSecret = crypto.randomBytes(32).toString("hex");
    const passwordHash = hashPassword(randomSecret);

    db.prepare(`
      INSERT INTO users (id, email, passwordHash, name, phone, role, status, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, 'CUSTOMER', 'ACTIVE', ?, ?)
    `).run(id, email, passwordHash, name, clean, now, now);

    return this.getById(id);
  },

  updatePassword(userId: string, newPassword: string) {
    const db = getDatabase();
    const hash = hashPassword(newPassword);
    const now = new Date().toISOString();
    db.prepare("UPDATE users SET passwordHash = ?, updatedAt = ? WHERE id = ?").run(hash, now, userId);
    return this.getById(userId);
  },

  '''

if "getByPhone(phone: string)" not in text:
    text = text.replace(users_marker, users_insert + users_marker, 1)
    print("Enhanced usersRepo with getByPhone, createFromOtp, updatePassword.")

# 2. Add authOtpsRepo at end of file
auth_otps_repo = '''
// ==========================================
// 14. AUTH OTPS REPOSITORY
// ==========================================
export const authOtpsRepo = {
  create(phone: string, otpHash: string, purpose = "LOGIN", ttlSeconds = 300) {
    const db = getDatabase();
    const id = "otp_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();
    const nowIso = now.toISOString();

    // Invalidate any active, unverified OTPs for this phone and purpose
    db.prepare(`
      UPDATE auth_otps
      SET expires_at = ?
      WHERE phone = ? AND purpose = ? AND verified_at IS NULL
    `).run(nowIso, phone, purpose);

    db.prepare(`
      INSERT INTO auth_otps (id, phone, otp_hash, purpose, expires_at, attempts, verified_at, created_at)
      VALUES (?, ?, ?, ?, ?, 0, NULL, ?)
    `).run(id, phone, otpHash, purpose, expiresAt, nowIso);

    return this.getById(id);
  },

  getById(id: string) {
    const db = getDatabase();
    return db.prepare("SELECT * FROM auth_otps WHERE id = ?").get(id) as any;
  },

  getLatestActive(phone: string, purpose = "LOGIN") {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    return db.prepare(`
      SELECT * FROM auth_otps
      WHERE phone = ? AND purpose = ? AND verified_at IS NULL AND expires_at > ? AND attempts < 5
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, purpose, nowIso) as any;
  },

  incrementAttempts(id: string) {
    const db = getDatabase();
    db.prepare("UPDATE auth_otps SET attempts = attempts + 1 WHERE id = ?").run(id);
    return this.getById(id);
  },

  markVerified(id: string) {
    const db = getDatabase();
    const nowIso = new Date().toISOString();
    db.prepare("UPDATE auth_otps SET verified_at = ? WHERE id = ?").run(nowIso, id);
    return this.getById(id);
  },

  getLastRequestTime(phone: string, purpose = "LOGIN") {
    const db = getDatabase();
    const row = db.prepare(`
      SELECT created_at FROM auth_otps
      WHERE phone = ? AND purpose = ?
      ORDER BY created_at DESC LIMIT 1
    `).get(phone, purpose) as { created_at: string } | undefined;
    return row ? new Date(row.created_at).getTime() : 0;
  },

  countRecentRequests(phone: string, windowSeconds = 600) {
    const db = getDatabase();
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    const row = db.prepare(`
      SELECT COUNT(*) as count FROM auth_otps
      WHERE phone = ? AND created_at > ?
    `).get(phone, since) as { count: number };
    return row ? row.count : 0;
  },
};
'''

if "export const authOtpsRepo" not in text:
    text = text.rstrip() + "\n" + auth_otps_repo + "\n"
    print("Added authOtpsRepo to server/db.ts.")

with open('server/db.ts', 'w', encoding='utf-8') as f:
    f.write(text)

print("server/db.ts successfully updated.")
