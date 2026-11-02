# Trinayaa Storefront TODO

## Responsive Trinayaa storefront shell
- [x] Match the client-approved reference direction with deep forest green utility and footer rails, warm ivory surfaces, muted botanical accents, serif editorial headings, and the Trinayaa wordmark/leaf mark.
- [x] Provide responsive navigation for Shop All, Seeds, Raw Powders, Herbs, About Us, Contact, Account, Cart, Support, and Track Order, including a mobile-friendly menu.
- [x] Include a full-width hero with the supplied reference-led visual tone, a primary Explore Products CTA, and trust cues for natural products, sourcing, and quality.

## Product discovery and shopping interactions
- [x] Populate the catalog with Moringa Leaf Powder, Black Seed (Kalonji), Hibiscus Flower (Dried), Amla Powder, and Fenugreek Seeds, using INR pricing and common pack sizes.
- [x] Provide product search, category filtering, and sorting controls.
- [x] Provide product detail interactions with imagery, description, INR pricing, pack-size and quantity selectors, wishlist affordance, and add-to-cart action.
- [x] Provide wishlist save/remove interactions from product cards.
- [x] Provide cart interactions with quantity updates, item removal, subtotal, and a checkout CTA.

## Checkout and order tracking
- [x] Provide a checkout form UI with contact details, delivery address, order summary, and payment-method selection in a gateway-ready structure.
- [x] Provide an Account entry point and a clear support/contact destination.
- [x] Provide Track Order with order ID validation, feedback states, and a shipment-status timeline.
- [x] Keep payment integration ready for a future real gateway; do not claim a successful charge without credentials or webhook-backed fulfillment. Live provider provisioning remains a follow-up decision because the gateway provider was not specified.

## Future-ready foundations
- [x] Preserve the managed server and database configuration for future product, special-offer, customer, and order records.
- [x] Serve a synchronized `manus-routes.json` route manifest for `/`, `/track-order`, and `/404`.
