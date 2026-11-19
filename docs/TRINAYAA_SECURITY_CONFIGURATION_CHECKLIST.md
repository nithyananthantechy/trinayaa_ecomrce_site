# TRINAYAA ENTERPRISES — SECURITY CONFIGURATION CHECKLIST
## Pre-Launch Security Audit, Secrets Handling & Attack Surface Hardening Verification

**Application:** TRINAYAA ENTERPRISES Botanical E-Commerce  
**Audit Date:** November 19, 2026  
**Auditor:** TRINAYAA Engineering Release Team  
**Audit Standard:** OWASP Top 10 Web Application Security Compliance  

---

## 1. COMPREHENSIVE SECURITY AUDIT CHECKLIST

| Security Category | Item Checked | Mitigation & Hardening Mechanism | Audit Status |
| :--- | :--- | :--- | :---: |
| **Authentication** | Password Hashing | PBKDF2 / Bcrypt cryptographic salt and stretching | **VERIFIED** |
| **Authentication** | Multi-Factor / OTP | 2Factor & Fast2SMS transactional OTP verification | **VERIFIED** |
| **Authorization** | Multi-Tenant Isolation | Every tRPC protected procedure validates `ctx.user.id` against entity owner | **VERIFIED** |
| **Authorization** | Role Boundaries | `RETAIL_SHOP_HANDLER` strictly isolated to assigned branch; blocked from `/admin` | **VERIFIED** |
| **Data Protection** | Parameterized Queries | SQLite prepared statements eliminate SQL Injection risks | **VERIFIED** |
| **Data Protection** | Masking & Privacy | Customer phone and email masked in public Telegram alert dispatches | **VERIFIED** |
| **Network & Transport** | HTTPS / TLS | HSTS `Strict-Transport-Security` header with 1-year max age | **VERIFIED** |
| **Network & Transport** | Reverse Proxy | Express `x-powered-by` suppressed; Nginx handles client rate caps | **VERIFIED** |
| **HTTP Headers** | Clickjacking Defense | `X-Frame-Options: SAMEORIGIN` | **VERIFIED** |
| **HTTP Headers** | MIME Sniffing Defense | `X-Content-Type-Options: nosniff` | **VERIFIED** |
| **HTTP Headers** | XSS Protection | `X-XSS-Protection: 1; mode=block` | **VERIFIED** |
| **Rate Limiting** | Upload Protection | `/api/upload` capped at 30 requests/minute per IP | **VERIFIED** |
| **Rate Limiting** | Webhook Spam | `/api/webhooks/razorpay` capped at 120 requests/minute per IP | **VERIFIED** |
| **Payment Integrity** | HMAC Signature Check | Razorpay webhook & verification validates HMAC-SHA256 signatures | **VERIFIED** |
| **Payment Integrity** | Idempotency Guard | Duplicate payment webhook calls do NOT double-deduct inventory | **VERIFIED** |
| **File Storage** | Upload MIME Whitelist | Strictly permits `image/png`, `image/jpeg`, `image/webp`; max 10MB | **VERIFIED** |
| **File Storage** | Path Traversal Defense | File uploads renamed with random UUIDs; zero client-specified paths | **VERIFIED** |

---

## 2. PRODUCTION SECRETS ROTATION & HANDLING POLICY

1. **Environment Segregation:**
   - `.env` is strictly ignored in `.gitignore`.
   - Never commit `.env` or plain-text secrets to version control.
   - Use `.env.example` as the single source of truth for required configuration keys.
2. **Session Secrets:**
   - Both `SESSION_SECRET` and `JWT_SECRET` must be set to high-entropy 64-character random hexadecimal strings (`openssl rand -hex 32`).
3. **Payment Credentials:**
   - Separate test keys (`rzp_test_...`) from production keys (`rzp_live_...`).
   - Webhook secrets must match the webhook endpoint registered in the Razorpay Merchant Dashboard.
4. **Telegram Admin Bot:**
   - `TELEGRAM_ALLOWED_ADMIN_IDS` must strictly contain authorized numeric Chat IDs of verified company managers. Unauthorized users querying the bot receive no data.
