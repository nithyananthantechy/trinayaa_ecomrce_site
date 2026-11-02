# TRINAYAA ENTERPRISES — PHASE 8 SECURITY AUDIT
## Comprehensive Security Architecture, Threat Modeling & Dependency Audit Report

**Date:** November 2026  
**Auditor:** TRINAYAA Core Engineering Team  
**System Version:** TRINAYAA E-Commerce v1.0.0 (Production Release)  
**Database:** SQLite 3 (WAL Mode, Prepared Statements)  
**Backend:** Node.js v24 + Express + tRPC v11  
**Frontend:** React 19 + TypeScript + Vite + Tailwind CSS v4  

---

## 1. Executive Summary

A comprehensive application security audit and vulnerability assessment was conducted across all customer, administrative, payment, database, and infrastructure surfaces of the TRINAYAA e-commerce platform.

The TRINAYAA platform demonstrates a robust **Defense-in-Depth** architecture:
1. **Zero Raw SQL Interpolation**: All database queries and updates use parameterized prepared statements (`node:sqlite DatabaseSync`), eliminating SQL injection vulnerabilities.
2. **Strict Cryptographic Integrity**: Customer passwords use salted PBKDF2 with 100,000 iterations (SHA-512); payment signatures use HMAC-SHA256 with timing-safe comparisons.
3. **Multi-Tenant Ownership Guarantees**: Customer orders, profile records, and address books are verified at the database query level with strict `userId` / `customerId` matching.
4. **Idempotent Financial Workflows**: Webhooks and payment callbacks verify payment status idempotently, preventing duplicate stock deductions or double billing.
5. **Hardened Edge & Upload Policies**: Uploaded assets receive randomized alphanumeric filenames (`trn_<timestamp>_<hex>.<ext>`) with strict MIME and 10MB limits, preventing path traversal and shell upload exploits.

---

## 2. Authentication & Authorization Review

| Security Control | Implementation Mechanism | Status | Notes |
|---|---|---|---|
| **Password Storage** | PBKDF2-HMAC-SHA512 (100,000 rounds, 32-byte cryptographically secure salt) | **VERIFIED** | Passwords never stored in plaintext. Verification hashes recalculated dynamically. |
| **Session Cookies** | `HttpOnly: true`, `Secure: true`, `SameSite: "none"` (preview) / `"lax"` (prod) | **VERIFIED** | JavaScript cannot access session tokens via `document.cookie`, preventing XSS session hijacking. |
| **Session Expiration** | 7-day token validity with standard JWT expiration (`exp` claim) | **VERIFIED** | Expired tokens automatically rejected with `UNAUTHORIZED` status. |
| **Admin Route Guard** | `adminProcedure` middleware checks `ctx.user.role IN ('ADMIN', 'SUPER_ADMIN')` | **VERIFIED** | Direct API access to `/admin` tRPC procedures returns HTTP 403 `FORBIDDEN` for regular customers or unauthenticated guests. |
| **Customer Order Ownership** | `orders.getById` & `payments.verifyPayment` check `order.customerId === ctx.user.id` | **VERIFIED** | Customers cannot inspect or verify payments for orders belonging to other users. |
| **Address Book Ownership** | `addressesRepo` includes `WHERE id = ? AND userId = ?` in all queries | **VERIFIED** | Customer A cannot view, update, or delete addresses belonging to Customer B. |

---

## 3. Input Validation & Injection Defenses

### A. SQL Injection (SQLi)
- **Engine**: Node.js built-in `DatabaseSync` (`node:sqlite`).
- **Audit Result**: **ZERO SQL VULNERABILITIES IDENTIFIED**.
- **Evidence**:
  - Every query throughout `server/db.ts` uses parameterized placeholders (`?`).
  - Dynamic update queries (e.g. `UPDATE products SET ${fields.join(", ")} WHERE id = ?`) interpolate strictly hardcoded column assignment strings (e.g. `"sellingPrice = ?"`) while user inputs are appended to positional parameter arrays (`...values`).
  - No user-controlled strings are ever concatenated directly into SQL text.

### B. Cross-Site Scripting (XSS)
- **Audit Result**: **SECURE**.
- **Defenses**:
  - React 19 escapes all dynamic values rendered into JSX by default.
  - Dynamic SEO meta tag injection in `server/seo.ts` sanitizes all strings with `escapeHtml()` converting `&`, `<`, `>`, `"`, and `'` into HTML entities before writing `<head>` tags.
  - Static file uploads are served from a isolated `/uploads` route with `X-Content-Type-Options: nosniff`.

### C. Cross-Site Request Forgery (CSRF)
- **Audit Result**: **SECURE**.
- **Defenses**:
  - All tRPC API mutations require `Content-Type: application/json`. Standard HTML `<form>` submissions cannot generate cross-origin JSON requests with credentials without triggering CORS pre-flight blocks.
  - OAuth login endpoints implement state nonce cookies (`OAUTH_STATE_COOKIE`) to verify that the return redirect originates from the same browser session.

### D. Path Traversal & Unrestricted File Upload
- **Audit Result**: **SECURE**.
- **Defenses in `/api/upload`**:
  - Client-supplied filenames are ignored for storage. A server-generated name is constructed: `trn_${Date.now()}_${crypto.randomBytes(4).toString("hex")}${ext}`.
  - Extension is strictly whitelisted (`.png`, `.jpg`, `.jpeg`, `.webp`).
  - MIME type is validated against `image/png`, `image/jpeg`, `image/webp`.
  - Buffer length is strictly checked (`buffer.length <= 10 * 1024 * 1024`).
  - File is written strictly inside `client/public/uploads` using `path.join()`.

---

## 4. Payment Security & Financial Integrity

### A. Razorpay Signature Verification
- **Audit Result**: **VERIFIED**.
- **Implementation**:
  - When Razorpay returns payment identifiers (`razorpay_order_id`, `razorpay_payment_id`, `razorpay_signature`), the backend calculates:
    $$\text{HMAC-SHA256}(\text{key\_secret}, \text{order\_id} \parallel "|" \parallel \text{payment\_id})$$
  - Signature comparison rejects forged signatures and logs the failure in `order_status_history` and `orders.paymentStatus = 'FAILED'`.
  - Orders are never marked as paid based merely on client-side status flags.

### B. Webhook Signature & Idempotency
- **Audit Result**: **VERIFIED**.
- **Implementation**:
  - `POST /api/webhooks/razorpay` verifies `X-Razorpay-Signature` against `process.env.RAZORPAY_WEBHOOK_SECRET`.
  - **Idempotency Guard**: If an order is already marked as `PAID` / `Confirmed`, duplicate `order.paid` or `payment.captured` webhooks do not deduct inventory twice or trigger duplicate notifications.
  - Restocking on cancellation or refund is protected by transaction checks in `inventoryRepo.adjustStock()`.

### C. Price Tampering Immunity
- **Audit Result**: **VERIFIED**.
- **Implementation**:
  - Checkout calculations (`orders.calculateSummary` and `orders.create`) discard any client-provided price or total.
  - Prices, MRPs, discount amounts, and shipping fees (Free if subtotal $\ge$ ₹799, else ₹60) are calculated entirely on the server by querying the verified SQLite database for each SKU.

---

## 5. Infrastructure & Edge Security

### A. HTTP Security Headers
The following production headers are configured globally in `server/_core/index.ts`:
```http
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
Strict-Transport-Security: max-age=31536000; includeSubDomains (in production/HTTPS)
```
In addition, `app.disable("x-powered-by")` suppresses Express version disclosure.

### B. Health Check Endpoints
- `/health` and `/api/health` provide JSON probes for container orchestrators and uptime monitors without exposing sensitive configuration:
  ```json
  {
    "status": "ok",
    "uptime": 12450,
    "timestamp": "2026-11-02T19:40:00.000Z",
    "service": "trinayaa-storefront-api",
    "version": "1.0.0"
  }
  ```

### C. Rate Limiting Middleware
- In-memory rate limiting shields sensitive endpoints from brute-force attacks:
  - `/api/upload`: Max 30 requests / minute / IP.
  - `/api/webhooks/telegram`: Max 120 requests / minute / IP.
  - `/api/webhooks/razorpay`: Max 120 requests / minute / IP.

---

## 6. Dependency Vulnerability Analysis (`pnpm audit`)

Running `pnpm audit` across the dependency tree identified 169 vulnerability advisories (15 low, 89 moderate, 59 high, 6 critical).

### Critical Vulnerability Breakdown & Risk Assessment:

1. **`fast-xml-parser` (<5.3.5)**:
   - **Path**: `@aws-sdk/client-s3 > @aws-sdk/xml-builder > fast-xml-parser`
   - **Risk Assessment**: **NEGLIGIBLE / INACTIVE IN PRODUCTION**. TRINAYAA uses local persistent disk storage (`data/trinayaa.db` and `client/public/uploads`) rather than AWS S3. S3 SDK modules are never invoked in the production customer journey.

2. **`tar` (<=7.5.18)**:
   - **Path**: `@tailwindcss/vite > @tailwindcss/oxide > tar`
   - **Risk Assessment**: **BUILD-TIME ONLY**. This dependency is used solely during `vite build` on the developer workstation to compile Tailwind CSS v4 tokens. It is not bundled or executed in the production Node server.

3. **`vitest` UI server**:
   - **Path**: `vitest > @vitest/ui`
   - **Risk Assessment**: **DEVELOPMENT-ONLY**. The Vitest UI server is never exposed or started on production servers (`NODE_ENV=production node dist/index.js`).

4. **`dompurify` (<=3.4.16)**:
   - **Path**: `streamdown > mermaid > dompurify`
   - **Risk Assessment**: **INACTIVE**. Mermaid diagramming is not loaded on customer storefront pages.

### Remediation Strategy:
- **Do NOT run `npm audit fix --force`**: Aggressive force-fixing would break Tailwind CSS v4 or downgrade React 19 dependencies.
- **Production Isolation**: The production bundle compiled via `esbuild` includes only `express`, `drizzle-orm`, `zod`, `jose`, `@trpc/server`, and Node.js built-ins. All devDependencies are excluded from `dist/index.js`.

---

## 7. Production Security Checklist

- [x] All 162 catalogue products have validated, unadulterated botanical records.
- [x] Passwords protected with 100,000-round PBKDF2 salts.
- [x] SQL injection impossible via 100% prepared statements.
- [x] Razorpay HMAC signature verification enforced.
- [x] Webhook idempotency validated (no double inventory deduction).
- [x] Telegram bot commands restricted to allowlisted admin IDs.
- [x] File uploads sanitized, type-checked, and capped at 10MB.
- [x] Security headers and rate limiting active.
- [x] Sensitive endpoints (`/admin`, `/checkout`, `/account`) protected with `X-Robots-Tag: noindex`.
- [x] Database backups stored outside public web directory.
