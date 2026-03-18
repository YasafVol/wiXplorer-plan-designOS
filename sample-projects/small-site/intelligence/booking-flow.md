# Booking Flow
<!-- id: booking-flow -->

Controls how guests search for rooms, see live pricing, and complete a reservation across all 14 Meridian properties. This is the highest-traffic system on the site and the most business-critical. When something goes wrong here, guests cannot book and revenue stops. The booking flow is built on top of Wix Bookings but extends it heavily — dynamic pricing, real-time availability validation, and custom additional fees are all injected via service plugins that Wix Bookings calls automatically at the right points in the checkout flow.

## Edit History
- 2026-02-10T09:00:00Z hook — Intent zone created by agent during initial project scaffold
- 2026-02-18T14:32:00Z yasaf@wix.com — Updated description to clarify business criticality and service plugin architecture

---

## Dynamic Pricing
<!-- id: dynamic-pricing -->

Controls how room rates are calculated in real time based on occupancy, season, and the guest's loyalty tier. The pricing engine reads live availability data and applies Meridian's rate rules to return a fully broken-down price before the guest commits to a booking. The engine runs as a Wix Bookings service plugin — meaning Wix calls it automatically whenever a guest selects dates, with no custom checkout flow required.

### pricing-action
<!-- id: pricing-action -->
<!-- type: action -->

Called from the room pricing widget on `/hotels/[slug]` and the search results on `/booking/search` whenever a guest selects dates or changes room type. Receives property ID, room type, check-in and check-out dates, and the logged-in member's tier. Reads live availability from AvailabilityCache and multipliers from PricingRules, then returns a fully broken-down price object — base rate, seasonal adjustment, member discount, resort fee — that the pricing widget renders in real time as the guest selects dates.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-15T10:00:00Z dev@wix.com — Added note about member tier input

### availability-cache
<!-- id: availability-cache -->
<!-- type: collection -->

Stores live room availability pulled from SiteMinder every 5 minutes. Read by the pricing widget and the booking validator. If this collection gets stale — because the sync job fails or times out — guests see outdated prices and may attempt to book rooms that are no longer available. The sync warning threshold is 6 minutes. Current status: last sync was 14 minutes ago.

#### Edit History
- 2026-02-15T09:20:00Z hook — Description auto-generated from import graph
- 2026-02-17T11:05:00Z dev@wix.com — Clarified stale data consequence and added threshold detail

### pricing-rules
<!-- id: pricing-rules -->
<!-- type: collection -->

Seasonal multipliers, occupancy thresholds, and promotional overrides per property. Each row defines a pricing rule: a property scope (single property or all), a date range, an occupancy band, a multiplier, and optional member tier discount percentages. Managed by the ops team through the CMS dashboard. Read by the pricing action and the bookings pricing service plugin. Changing a rule takes effect on the next pricing calculation — no redeploy required.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-16T15:00:00Z yasaf@wix.com — Clarified that rule changes take effect immediately without redeploy

### bookings-pricing-plugin
<!-- id: bookings-pricing-plugin -->
<!-- type: service-plugin -->

Overrides Wix Bookings' native price calculation for every room type modeled as a bookable service. When Wix Bookings calls `calculatePrice()`, this plugin reads the current AvailabilityCache occupancy percentage for the requested dates, applies the matching seasonal multiplier from PricingRules, applies the member tier discount if the session member is logged in, and returns the final rate. This is what makes Meridian's dynamic pricing work end-to-end through the native Bookings checkout rather than a custom flow. If this plugin throws, Wix Bookings falls back to the base service price.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-18T09:30:00Z dev@wix.com — Added fallback behavior note

---

## Availability Sync
<!-- id: availability-sync -->

Keeps AvailabilityCache current by pulling from SiteMinder on a schedule and accepting push updates when inventory changes outside the sync window. This feature is the bridge between Meridian's external channel manager and the Wix site's booking logic. If this feature degrades, the pricing and validation features degrade with it.

### availability-sync-job
<!-- id: availability-sync-job -->
<!-- type: job -->

Runs every 5 minutes. Calls the SiteMinder API for all 14 properties, normalizes the per-room availability response into the AvailabilityCache schema, and performs a bulk update. Reads the sync interval from SiteConfig so the ops team can adjust frequency without a code deploy. Last 3 runs timed out — this is the root cause of the current AvailabilityCache warning.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-20T08:00:00Z hook — Status updated to warning after 3 consecutive timeout failures

### availability-push-api
<!-- id: availability-push-api -->
<!-- type: api -->

Receives availability update pushes from SiteMinder when inventory changes outside the regular sync window — a room is sold out on a partner channel, a block is released, or a rate changes. Validates the incoming payload signature, then writes directly to AvailabilityCache, bypassing the scheduled sync. This is the fast path for time-sensitive availability changes.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

---

## Checkout Validation
<!-- id: checkout-validation -->

A safety layer that runs immediately before Wix Bookings confirms a reservation. It re-validates room availability against the live SiteMinder data to catch the stale window between the 5-minute syncs, and enforces Obsidian-tier room restrictions. If validation fails, the guest sees a clear error with recovery options rather than a silent failure.

### booking-validator-plugin
<!-- id: booking-validator-plugin -->
<!-- type: service-plugin -->

Called by Wix eCommerce before checkout completes. Runs two checks: first, that the room is still available in AvailabilityCache (catching the stale cache window between syncs); second, that Obsidian-tier rooms are only accessible to Obsidian loyalty members, verified against the session member's tier. Returns a violation object with a human-readable message if either check fails. The message surfaces in the native Wix checkout UI — no custom error page required.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-16T16:00:00Z dev@wix.com — Added Obsidian tier restriction check detail

### ecom-additional-fees-plugin
<!-- id: ecom-additional-fees-plugin -->
<!-- type: service-plugin -->

Called by Wix eCommerce on every cart and checkout update. Calculates and returns Meridian's non-room-rate charges as named line items: a per-night resort fee per property (read from the Hotels collection), a late checkout fee if the selected check-out time is past noon, and a pet fee if the booking includes the pet-friendly room category. Guests see each charge labeled separately in the Wix checkout — there are no hidden fees.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

---

## Booking Confirmation
<!-- id: booking-confirmation -->

What happens the moment a booking is confirmed — loyalty points are accrued, the guest receives a confirmation email, and the booking is reflected in the staff arrivals view. This feature closes the loop between a completed transaction and the guest's ongoing relationship with Meridian.

### on-booking-confirmed-event
<!-- id: on-booking-confirmed-event -->
<!-- type: event -->

Fires when Wix Bookings confirms a reservation. Calls the loyalty accrual logic: reads the booking value and duration, applies the member tier multiplier from PricingRules, appends a credit transaction to LoyaltyLedger, updates the member's points balance custom field, and checks whether the new balance crosses a tier threshold — if it does, triggers a tier upgrade Wix Triggered Email. This event is the primary entry point for the loyalty system's post-booking processing.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T10:00:00Z yasaf@wix.com — Clarified tier upgrade trigger condition
