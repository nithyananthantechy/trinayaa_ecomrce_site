# Trinayaa Storefront Plan

## Scope
Build a responsive customer-facing herbal ecommerce storefront based on the client-approved Trinayaa reference. The first release is a polished storefront prototype with realistic catalog data, search/filtering, product details, wishlist, cart, checkout UI, and order tracking. Server and database capabilities are enabled so future releases can connect real product, offer, customer, and order records. No separate unfinished admin panel is exposed in this release.

## Implementation approach
- Frontend: React + TypeScript + Tailwind CSS with the existing Vite starter.
- State: local React state for catalog filtering, wishlist, cart, checkout, and tracking interactions; structure remains ready to replace mock data with API-backed records.
- Backend: preserve the existing Express/tRPC/Drizzle foundation and managed server/database configuration for future product, discount, and order persistence.
- Assets: create an original botanical hero and a small set of coordinated product visuals inspired by the supplied reference; use the user’s screenshot as the style reference, not as a page image.
- Routes: `/` storefront home, `/track-order` tracking experience, `/404` existing not-found route. A route manifest is served from `public/manus-routes.json`.

## Design

### Design movement
Editorial botanical apothecary: a contemporary natural wellness storefront with the calm restraint of an old seed catalogue, tuned for modern ecommerce.

### Core principles
1. Let warm negative space and deep green framing make products feel considered and trustworthy.
2. Pair serif editorial headings with crisp functional UI text for a premium but approachable hierarchy.
3. Use real interactions—search, filters, cart count, wishlist, order timeline—as part of the visual language, not as hidden utility.
4. Keep every section conversion-oriented without looking promotional or loud.

### Color philosophy
Forest green anchors trust and natural provenance. Warm ivory keeps the page breathable. Muted saffron, sage, blush, and sand create a quiet taxonomy for categories and offers while supporting the photographed botanicals.

### Layout paradigm
A full-width framed storefront: dark utility rails bracket a warm, asymmetrical hero; category cards and product shelves then step down in calm horizontal bands. On mobile, bands collapse into scrollable shelves and vertically stacked editorial blocks.

### Signature elements
- Thin botanical line motifs and leaf-like strokes in the utility bar and footer.
- Small uppercase overlines paired with oversized serif statements.
- Product cards with quiet border, rounded image well, and dark green action bar.

### Interaction philosophy
Interactions should feel like browsing a well-kept apothecary: filters are visible, state changes are gentle, buttons confirm with brief toasts, and the cart is always one glance away. The interface should reward exploration without forcing a full page reload.

### Animation
Use 150–250ms ease-out transitions for cards, buttons, drawers, and filter chips. Hero imagery can have a subtle slow scale on load. Avoid continuous motion that competes with product reading.

### Typography system
Use Georgia as the editorial serif fallback for Trinayaa’s warm, literate voice, with Inter/system sans for navigation, metadata, buttons, and forms. Hero headlines are large and tight; overlines use tracked uppercase; product names stay compact and readable.

### Brand essence
Pure botanical ingredients for everyday rituals, sourced with care and presented without noise. Personality: grounded, discerning, generous.

### Brand voice
Headlines speak in calm, specific promises: “Pure seeds. Raw powders. True herbs.” CTAs are clear and warm: “Explore products” and “Follow your order.”

### Wordmark & logo
Use a compact leaf-mark monogram built from two curved strokes beside a spaced TRINAYAA wordmark and a small descriptor line. Keep it as a responsive text/SVG-like mark so it remains crisp without requiring a separate logo asset.

### Signature brand color
`#123D28` — Trinayaa forest, a deep herbal green that is recognizable across rails, buttons, footer, and key status markers.

## Project structure
- `client/src/pages/Home.tsx`: storefront composition and all customer-facing interactions.
- `client/src/index.css`: palette, type, layout, component treatments, responsive rules, and botanical details.
- `client/public/images/`: original hero and product assets.
- `public/manus-routes.json`: route manifest for the visible pages.
- `drizzle/schema.ts`, `server/db.ts`, `server/routers.ts`: existing managed data foundation left ready for future product/order APIs.
- `app.config.ts`: project logo metadata.
