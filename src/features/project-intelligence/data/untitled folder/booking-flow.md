# Booking Flow
<!-- id: booking-flow -->
Controls how guests search for rooms, see live pricing, and complete a reservation across all
14 Meridian properties. This intent zone carries the highest conversion impact in the project,
so reliability and latency in this area directly affect revenue and trust.

## Edit History
- 2026-02-10T10:00:00Z yasaf@wix.com - Initial label and business framing
- 2026-02-18T14:32:00Z yasaf@wix.com - Expanded reliability context and risk language

---

## Dynamic Pricing
<!-- id: dynamic-pricing -->
Calculates room prices in real time based on occupancy, seasonality, and loyalty tier. The cluster
balances revenue optimization with transparent pricing so guests can understand why rates change.

### pricingAction
<!-- id: pricing-action -->
<!-- type: action -->
Called from pricing widgets and search results when a guest picks dates. It composes availability and
rule multipliers into a complete price payload so the UI can present a confident quote immediately.

#### Edit History
- 2026-02-15T09:20:00Z hook - Description auto-generated from import graph
- 2026-02-17T11:05:00Z dev@wix.com - Added quote payload detail

### AvailabilityCache
<!-- id: availability-cache -->
<!-- type: collection -->
Stores room inventory snapshots imported from SiteMinder. The pricing and validation flows read this
collection for live checks, so stale entries can create false availability and downstream booking failures.

#### Edit History
- 2026-02-15T09:20:00Z hook - Description auto-generated from import graph
- 2026-02-20T08:58:00Z dev@wix.com - Added stale data consequence and incident language

### PricingRules
<!-- id: pricing-rules -->
<!-- type: collection -->
Contains seasonal and occupancy multipliers maintained by revenue teams. This dataset allows the same
pricing action to adapt across markets without requiring redeploys for business rule updates.

#### Edit History
- 2026-02-15T09:20:00Z hook - Description auto-generated from import graph

### Bookings Pricing Plugin
<!-- id: bookings-pricing-plugin -->
<!-- type: service-plugin -->
Integrates custom rate calculation into Wix Bookings checkpoints before the final quote is shown.
It ensures product-level pricing logic stays aligned with platform-level booking lifecycle events.

#### Edit History
- 2026-02-16T11:00:00Z hook - Plugin connection inferred

---

## Availability Sync
<!-- id: availability-sync -->
Synchronizes external PMS availability updates into Meridian's booking surface every few minutes.
This cluster keeps inventory freshness aligned with booking speed to reduce oversell and manual correction.

### Availability Sync Job
<!-- id: availability-sync-job -->
<!-- type: job -->
Scheduled worker that pulls new availability deltas and writes them into AvailabilityCache. Recent
timeouts place this node in warning and are the primary source of stale pricing alerts.

#### Edit History
- 2026-02-15T09:20:00Z hook - Job discovered from scheduler map
- 2026-02-20T08:59:00Z hook - Warning detail synced from latest runs

---

## Checkout Validation
<!-- id: checkout-validation -->
Runs final checks before payment authorization to prevent invalid reservations from reaching confirmation.
It protects guest trust by failing fast when inventory or policy constraints are out of date.

### Booking Validator Plugin
<!-- id: booking-validator-plugin -->
<!-- type: service-plugin -->
Validates room availability and booking constraints right before checkout commits. It catches race
conditions between quote time and payment time using the latest availability cache snapshot.

#### Edit History
- 2026-02-16T11:10:00Z hook - Validation role inferred from plugin registration

### Ecom Additional Fees Plugin
<!-- id: ecom-additional-fees-plugin -->
<!-- type: service-plugin -->
Applies mandatory fees at checkout based on property policy and booking attributes. This keeps the
price breakdown consistent between booking UI, cart totals, and final payment capture.

#### Edit History
- 2026-02-16T11:12:00Z dev@wix.com - Added billing alignment detail

---

## Booking Confirmation
<!-- id: booking-confirmation -->
Handles downstream actions after successful booking so guests receive immediate confirmation and follow-up.
The cluster ensures operational and loyalty systems are notified in a consistent, auditable flow.

### onBookingConfirmed
<!-- id: on-booking-confirmed-event -->
<!-- type: event -->
Event listener fired when a reservation is finalized. It triggers loyalty accrual and related post-booking
automations so guest benefits stay synchronized with confirmed transactions.

#### Edit History
- 2026-02-16T11:30:00Z hook - Event mapping imported from automation graph
