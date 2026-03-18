# Retail
<!-- id: retail -->

The Meridian Store — a curated e-commerce channel selling physical products that let guests bring the hotel experience home. Products are property-tagged, meaning a candle from the Lisbon property is associated with that property and earns loyalty points at a bonus rate when purchased by a Meridian Circle member. The store runs on Wix Stores for product management, cart, and checkout, with custom code handling the shipping rates integration and the post-purchase loyalty logic.

## Edit History
- 2026-02-10T09:00:00Z hook — Intent zone created by agent during initial project scaffold
- 2026-02-19T13:00:00Z yasaf@wix.com — Added property-tagging detail and clarified the split between Wix Stores and custom code

---

## Meridian Store
<!-- id: meridian-store -->

The product catalog and shopping experience. Products are managed in Wix Stores and are accessible at `/shop` and `/shop/[product-slug]`. The store is linked from the homepage and from individual property pages — guests who loved a scent from their stay can find and purchase it directly from the property page.

### site-config-collection
<!-- id: site-config-collection -->
<!-- type: collection -->

Global configuration values used across the site and backend. Acts as a lightweight remote config system — changes here take effect without a code deploy. Fields include: feature flags (per-feature on/off switches), maintenance mode per property, loyalty tier thresholds (Silver, Gold, Obsidian point boundaries), the SiteMinder sync interval in minutes, and property-level currency and tax configuration. Read by the availability sync job, the pricing action, the loyalty action, and the loyalty tier job. Any team member with CMS access can update these values, but changes to tier thresholds or sync intervals should be treated as operational decisions, not routine content edits.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-18T15:00:00Z yasaf@wix.com — Added warning about treating config changes as operational decisions

---

## Shipping
<!-- id: shipping -->

Custom shipping rate logic for the Meridian Store. Rather than using Wix Stores' built-in flat-rate shipping, Meridian integrates with a third-party courier API to provide live carrier rates at checkout. Guests see real shipping costs with estimated delivery windows rather than flat-rate estimates, which reduces checkout abandonment and post-purchase complaints about unexpected fees.

### ecom-shipping-plugin
<!-- id: ecom-shipping-plugin -->
<!-- type: service-plugin -->

Called by Wix eCommerce during cart and checkout when the guest has entered a delivery address. Calls a third-party courier API with the cart's total weight (summed from product metadata), the delivery address, and the origin address (Meridian's distribution center). Returns live carrier rate options with estimated delivery windows and costs. The guest sees these as selectable shipping options in the native Wix checkout — no custom checkout UI required. Falls back to a flat-rate option if the courier API is unavailable.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T12:00:00Z dev@wix.com — Added fallback to flat-rate on courier API failure

---

## Post-Stay
<!-- id: post-stay -->

The touchpoints that connect a completed stay to ongoing engagement with Meridian — post-stay emails, loyalty points for retail purchases, and property-tagged product recommendations. This feature turns a one-time stay into an ongoing relationship and creates a natural bridge from hospitality to retail.

### on-order-approved-event
<!-- id: on-order-approved-event -->
<!-- type: event -->

Fires when a Wix Stores order is approved. Checks whether the purchased products are tagged as property-specific in the Products collection. Property-tagged products earn loyalty points at 1.5x the base rate, reinforcing the connection between a guest's stay experience and the products from that property. Non-property-tagged products earn points at the standard rate. All accruals are appended to LoyaltyLedger. This node is shared with the Loyalty Program / Points Accrual feature cluster.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
