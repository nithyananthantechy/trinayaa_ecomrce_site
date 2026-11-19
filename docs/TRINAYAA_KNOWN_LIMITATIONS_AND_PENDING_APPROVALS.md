# TRINAYAA ENTERPRISES — KNOWN LIMITATIONS & PENDING CLIENT APPROVALS
## Operational Decisions, Third-Party Integrations & Statutory Parameter Clearances

**Document Date:** November 19, 2026  
**Context:** Phase 8 Final Handover Package  
**Purpose:** Formally document all business, legal, financial, and external service parameters that require client sign-off or third-party account provisioning before public launch.

---

## 1. STATUTORY & TAX CONFIGURATION (PENDING CLIENT / CA APPROVAL)

| Statutory Parameter | Current Implementation | Action Required by Client / Accountant | Impact if Unresolved |
| :--- | :--- | :--- | :--- |
| **GSTIN Registration Number** | Formatted sample GSTIN in `site_content` table | Provide authentic 15-character GSTIN for TRINAYAA ENTERPRISES | Must be accurate on Tax Invoices for business input tax credit |
| **Registered Business Address** | "Main Road, Erode, Tamil Nadu – 638 001, India" | Confirm exact registered address per GST certificate | Appears on Tax Invoices and Delivery Challans |
| **HSN Codes for Botanicals** | Standard agricultural/herbal HSN codes (e.g., `1211`, `0910`, `1207`) | CA / tax consultant to confirm specific 6-digit or 8-digit HSN codes per category | Required on B2B invoices and high-value B2C invoices |
| **Intra vs Inter-State GST Rates** | 5% GST split: 2.5% CGST + 2.5% SGST for Tamil Nadu; 5% IGST for other states | Confirm whether certain raw seeds or unbranded whole botanicals qualify for 0% GST exemption | Ensures optimal tax compliance and customer pricing |

---

## 2. PAYMENT GATEWAY & FINANCIAL ACCOUNTS (CLIENT ACTION REQUIRED)

| Item | Current State | Required Client Action | Status |
| :--- | :--- | :--- | :---: |
| **Razorpay Production Account** | Operating with verified sandbox/test keys | Activate KYC on live Razorpay merchant dashboard; generate production API Key ID and Key Secret | Pending Client KYC |
| **Razorpay Webhook Registration** | Webhook URL `/api/webhooks/razorpay` active with HMAC check | Register live webhook in Razorpay Dashboard with `order.paid`, `payment.failed` events; copy secret to `.env` | Pending Webhook Secret |
| **Bank Settlement Account** | Dummy bank details in test environment | Link corporate current bank account for automated T+1 day merchant settlements | Client Banking Team |

---

## 3. LOGISTICS & COURIER PARTNER INTEGRATION (OPERATIONAL CHOICE)

| Item | Current Capability | Next Step / Optional Enhancement |
| :--- | :--- | :--- |
| **Order Fulfilment Printing** | Generates professional Shipping Slips, Tax Invoices, Delivery Challans, and 4x6 Parcel Stickers with AWB placeholders | Operational team manually enters AWB numbers or carrier names (e.g., India Post Speed Post, ST Courier, Delhivery) |
| **Automated Courier API Dispatch** | System architecture supports webhooks and REST dispatch calls | Client may choose to integrate direct Shiprocket / Delhivery / India Post APIs for automated AWB generation in a future phase |

---

## 4. SUBSCRIPTION DISCOUNT POLICIES (CLIENT BUSINESS DECISION)

| Business Decision | Current Implementation | Recommendation for Client Management |
| :--- | :--- | :--- |
| **Subscriber Discount %** | Subscriptions currently bill the standard variant price with recurring automation | Client management may define a permanent "Subscribe & Save" discount (e.g., 5% or 10% off) to drive long-term customer retention |
| **Frequency Choices** | 15, 30, 45, 60, and 90 days | Review customer uptake to determine if weekly (7 days) deliveries should be added for local Erode/Coimbatore orders |

---

## 5. REVENUE & LEGAL SIGN-OFF SUMMARY

All technical implementation tasks within Phases 1 through 8 are 100% complete.  
The technical platform is completely ready for deployment (**Tier B: Ready for Production Deployment**).  
The above items are non-blocking for technical code readiness, but represent external administrative and statutory actions to be finalized prior to processing public customer revenue.
