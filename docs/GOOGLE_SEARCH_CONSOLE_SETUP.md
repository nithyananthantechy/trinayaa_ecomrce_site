# TRINAYAA ENTERPRISES — GOOGLE SEARCH CONSOLE SETUP & OPERATIONS GUIDE

This operational guide details the exact steps for the TRINAYAA administrative team to verify domain ownership in **Google Search Console (GSC)**, submit the dynamic XML sitemap, inspect product indexing, and monitor search performance.

---

## 1. Domain Property Setup & Verification

Google Search Console offers two property types: **Domain Property** (recommended) and **URL Prefix Property**.

### Option A: Domain Property Verification via DNS (Recommended)
This covers all protocols (`http://`, `https://`) and subdomains (`trinayaa.in`, `www.trinayaa.in`).

1. Navigate to **[Google Search Console](https://search.google.com/search-console)** and sign in with the official TRINAYAA business Google account (e.g. `trinayaa.herbal@gmail.com` or `admin@trinayaa.in`).
2. Click **Add Property** in the top-left dropdown.
3. Select the **Domain** option and enter:
   ```
   trinayaa.in
   ```
4. Google will generate a unique `TXT` record, for example:
   ```
   google-site-verification=abc123XYZ_sample_token_trinayaa_2026
   ```
5. Log in to your DNS provider (Cloudflare, GoDaddy, Namecheap, Hostinger, etc.).
6. Navigate to **DNS Management** for `trinayaa.in` and add a new record:
   - **Type**: `TXT`
   - **Name / Host**: `@` (or leave blank depending on provider)
   - **Value / Content**: Paste the verification token provided by Google.
   - **TTL**: Auto or 3600 seconds.
7. Return to Google Search Console and click **Verify**. (DNS propagation may take between 5 minutes and 24 hours).

### Option B: HTML Tag Verification (Fallback)
If DNS access is delayed:
1. In Search Console, select **URL Prefix** and enter:
   ```
   https://trinayaa.in
   ```
2. Choose **HTML Tag** under "Other verification methods".
3. Copy the `<meta name="google-site-verification" content="..." />` code.
4. Add the verification token to your server environment or `client/index.html` within the `<head>` section.
5. Click **Verify**.

---

## 2. Submitting the Dynamic XML Sitemap

Once domain verification is confirmed:

1. In the Search Console left navigation panel, click **Sitemaps** (under the "Indexing" section).
2. Under **Add a new sitemap**, enter:
   ```
   sitemap.xml
   ```
   *(Full URL: `https://trinayaa.in/sitemap.xml`)*
3. Click **Submit**.
4. Confirm the submission status updates to **Success** (green).
5. GSC will report the total number of discovered URLs:
   - 162 Published Product URLs (`/products/slug`)
   - 9 Category URLs (`/categories/slug`)
   - Static Informational Pages (`/`, `/about`, `/contact`, `/track-order`, `/policies/shipping`, `/policies/returns`, `/policies/privacy`, `/policies/terms`).

---

## 3. URL Inspection & Rich Results Testing

To verify how Googlebot renders an individual product page:

1. Copy any product URL from your catalogue, for example:
   ```
   https://trinayaa.in/products/licorice-root-trn-1001
   ```
2. Paste it into the top **Inspect any URL** search bar in Google Search Console and press Enter.
3. Click **Test Live URL** to fetch the live response from the TRINAYAA Express server.
4. Verify the following:
   - **Crawl Status**: Allowed / Crawl successful.
   - **Page Fetch**: Successful (HTTP 200).
   - **Indexing Allowed**: Yes.
   - **User-declared Canonical**: Matches `https://trinayaa.in/products/licorice-root-trn-1001`.
   - **Google-selected Canonical**: Same as user-declared.
   - **Enhancements / Structured Data**: Confirm **Product** and **Breadcrumbs** are detected without errors.
5. Click **Request Indexing** to queue high-priority products for immediate crawling.

---

## 4. Identifying & Resolving Indexing Issues

Inspect the **Pages** report under the "Indexing" section weekly to monitor indexing health:

| Status | Cause | Action Required |
| :--- | :--- | :--- |
| **Indexed** | Page is successfully indexed and appearing in Google search results. | No action required. |
| **Discovered – currently not indexed** | Google knows the URL exists, but has not yet crawled it due to crawl budget scheduling. | Normal for newly launched products. Allow 7–14 days. Ensure sitemap is active. |
| **Crawled – currently not indexed** | Google crawled the page but decided not to index it yet. | Ensure unique factual product descriptions; avoid identical boilerplate text across products. |
| **Excluded by 'noindex' tag** | Intentionally excluded via robots tag. | Expected for `/admin`, `/cart`, `/checkout`, `/account`. Verify no public product pages appear here. |
| **Blocked by robots.txt** | Disallow rule in `robots.txt` matched the URL. | Verify public assets (`/images/*`, `/assets/*`) are not blocked. |
| **Not found (404)** | Deleted or broken URL. | If a product was discontinued, redirect its slug to the respective category page. |

---

## 5. Monitoring Search Performance & Queries

In the **Performance** tab:
1. **Total Clicks**: Number of users who clicked from Google into TRINAYAA.
2. **Total Impressions**: Number of times TRINAYAA appeared in Google search results.
3. **Average CTR**: Click-through rate (`Clicks / Impressions`). Aim for 3%–7% on non-branded keywords and >25% on branded searches.
4. **Average Position**: Average ranking across all queries.

### Key Query Categories to Track:
- **Brand Queries**: "Trinayaa", "Trinayaa Enterprises", "Trinayaa Erode", "Trinayaa herbal"
- **Tamil / Regional Queries**: "அதிமதுரம் தூய மூலிகை", "முருங்கை இலை பொடி ஈரோடு", "கருஞ்சீரகம் ஆன்லைன்"
- **Product Queries**: "pure licorice root powder", "raw ashwagandha online India", "sun-dried hibiscus petals"
- **Category Queries**: "authentic herbal powders Tamil Nadu", "natural seeds online"

---

## 6. Security & Spam Protection Checks

1. **Security Issues**: Check the **Security & Manual Actions** tab monthly to ensure no malware, compromised content, or phishing warnings exist.
2. **Core Web Vitals**: Review the **Core Web Vitals** report (LCP, INP, CLS) for mobile and desktop. TRINAYAA's lightweight asset architecture is designed to score in the **Good** tier.
