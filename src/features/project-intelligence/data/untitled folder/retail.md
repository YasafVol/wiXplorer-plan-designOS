# Retail
<!-- id: retail -->
Defines post-booking commerce and merchandising workflows for Meridian's store-oriented experiences.
This zone connects fulfillment operations with loyalty-aware customer engagement.

## Edit History
- 2026-02-13T10:00:00Z yasaf@wix.com - Added retail surface scope
- 2026-02-16T12:10:00Z dev@wix.com - Clarified shipping and post-stay lifecycle boundaries

---

## Meridian Store
<!-- id: meridian-store -->
Captures core store configuration and merchandising controls used across eCommerce touchpoints.

### SiteConfig
<!-- id: site-config-collection -->
<!-- type: collection -->
Central configuration record controlling store-wide defaults such as shipping origin and support contact.

#### Edit History
- 2026-02-16T12:20:00Z hook - Configuration collection identified

---

## Shipping
<!-- id: shipping -->
Executes fulfillment policy logic before orders enter downstream carrier workflows.

### Ecom Shipping Plugin
<!-- id: ecom-shipping-plugin -->
<!-- type: service-plugin -->
Injects Meridian shipping rules into Wix eCommerce checkout and label-purchase steps.

#### Edit History
- 2026-02-16T12:22:00Z hook - Plugin role inferred from checkout hooks

---

## Post Stay
<!-- id: post-stay -->
Runs post-order automation hooks that connect commerce outcomes with guest engagement strategies.

### onOrderApproved
<!-- id: on-order-approved-event -->
<!-- type: event -->
Event listener fired on approved orders to trigger loyalty and retention workflows.

#### Edit History
- 2026-02-16T12:25:00Z hook - Event inferred from automation bindings
