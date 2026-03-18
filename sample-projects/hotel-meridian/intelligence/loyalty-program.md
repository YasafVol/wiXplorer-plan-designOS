# Loyalty Program
<!-- id: loyalty-program -->

The Meridian Circle loyalty program — the system that rewards guests for stays, retail purchases, and engagement, and gives them a reason to return. The program has three tiers: Silver, Gold, and Obsidian. Points are accrued on booking confirmation and order approval, tracked in an append-only ledger, and redeemable at checkout. The dashboard gives members full visibility into their standing. The entire program runs on top of Wix Members, which handles identity and authentication, while the custom code layer handles all accrual logic, tier transitions, and the redemption flow.

## Edit History
- 2026-02-10T09:00:00Z hook — Intent zone created by agent during initial project scaffold
- 2026-02-19T10:00:00Z yasaf@wix.com — Expanded description to cover the three-tier structure and technical split with Wix Members

---

## Points Accrual
<!-- id: points-accrual -->

The rules and mechanics by which guests earn Meridian Circle points. Points are earned on confirmed bookings (scaled by stay value, duration, and member tier) and on approved Meridian Store orders (scaled by order value and whether products are property-tagged). Every accrual event is written as an immutable transaction to LoyaltyLedger before the member's balance field is updated — the ledger is the source of truth, the balance field is a derived cache.

### loyalty-action
<!-- id: loyalty-action -->
<!-- type: action -->

Called from the guest dashboard on load and from the booking confirmation page. Reads the member's LoyaltyLedger transaction history, computes the current points balance for the rolling 12-month window, calculates progress to the next tier threshold from PricingRules, and returns the full loyalty state object. Also handles redemption: when called with a redemption amount and booking reference at checkout, it writes a debit transaction to LoyaltyLedger and updates the member's balance.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T14:00:00Z dev@wix.com — Added redemption flow details

### loyalty-ledger
<!-- id: loyalty-ledger -->
<!-- type: collection -->

An append-only transaction log of every loyalty points event. Each row records: member ID, event type (booking credit, order credit, redemption, manual adjustment, tier bonus), points delta (positive or negative), the booking or order reference, the staff member ID for manual adjustments, and a timestamp. Rows are never deleted or modified — only new rows are appended. The member's displayed balance is always computed by summing the last 12 months of rows for that member, never stored directly in this collection.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-18T09:00:00Z yasaf@wix.com — Clarified append-only constraint and 12-month rolling window

### on-order-approved-event
<!-- id: on-order-approved-event -->
<!-- type: event -->

Fires when a Wix Stores order is approved. Checks whether the purchased products are tagged as property-specific in the Products collection. If so, appends a bonus points credit to LoyaltyLedger for the purchasing member — property-tagged products earn 1.5x the base points rate. Also fires the standard accrual logic for non-property-tagged products at the base rate. Reinforces the loyalty loop across both stays and retail.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

---

## Tier Management
<!-- id: tier-management -->

The rules that determine which tier a member belongs to and the process by which they move between tiers. Tier is determined by the rolling 12-month points total, evaluated nightly. Tier thresholds are defined in PricingRules and are therefore adjustable by the ops team without a code deploy. Moving up a tier triggers a congratulatory email. Moving down (which can happen if a member's 12-month window rolls and older points expire) is handled silently — no notification.

### loyalty-tier-job
<!-- id: loyalty-tier-job -->
<!-- type: job -->

Runs nightly at 2am. Iterates every member record, sums their LoyaltyLedger balance for the rolling 12-month window, compares against the tier thresholds in PricingRules, and updates any member whose tier has changed. For tier upgrades, calls the loyalty action to trigger a tier upgrade Wix Triggered Email. For tier downgrades, updates the member field silently. Designed to be idempotent — running it twice produces the same result.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T15:00:00Z dev@wix.com — Added idempotency note

---

## Member Dashboard
<!-- id: member-dashboard -->

The guest-facing view of their Meridian Circle standing — available at `/account/dashboard` for logged-in members. Shows current tier, points balance, progress to the next tier, recent transaction history, and upcoming stays. The dashboard is the primary surface where loyalty is made tangible and motivating for the guest.

### member-context
<!-- id: member-context -->
<!-- type: context -->

Bound in the Editor to all personalized UI elements across the member-facing pages. Holds the logged-in member's name, tier, points balance, and preferences. The Editor binds the greeting text on `/account/dashboard` to `member.firstName`, the tier badge component to `member.tier`, the progress bar to `member.pointsProgress`, and the personalized room recommendations repeater's filter to `member.preferences.roomType`. All personalized content on the dashboard flows from this single context object.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-16T11:00:00Z yasaf@wix.com — Listed specific Editor bindings for clarity

### loyalty-function-library
<!-- id: loyalty-function-library -->
<!-- type: function-library -->

Bound in the Editor to the loyalty UI elements on `/account/dashboard` and the `/loyalty` marketing page. Exposes `getTierLabel()` bound to the tier badge text element, `getProgressPercentage()` bound to the progress bar component's fill width, and `getPointsToNextTier()` bound to the helper text showing how many points remain until the next tier. Translates raw points numbers from the loyalty action into the display-ready values that the Editor's bound elements consume.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### loyalty-admin-page
<!-- id: loyalty-admin-page -->
<!-- type: dashboard-page -->

The back-office loyalty management screen, accessible only to staff with manager or admin role. Loads member search and displays any member's LoyaltyLedger transaction history, current balance, and tier. Managers can manually add or deduct points — both operations open the PointsAdjustmentModal requiring a reason code. Also shows which members are close to a tier threshold, allowing the ops team to run targeted promotions.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### points-adjustment-modal
<!-- id: points-adjustment-modal -->
<!-- type: dashboard-modal -->

Opened from the loyalty admin page when a manager manually adjusts a member's points. Contains a points delta input (positive for credit, negative for deduction), a required reason code dropdown (goodwill, error correction, promotion, other), and an optional notes field. On confirm, calls the loyalty action which appends the adjustment to LoyaltyLedger with the manager's staff ID as the actor. Submission is blocked until a reason code is selected — this ensures every manual adjustment is auditable.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-18T10:30:00Z yasaf@wix.com — Added auditing rationale for the required reason code

### loyalty-summary-plugin
<!-- id: loyalty-summary-plugin -->
<!-- type: dashboard-plugin -->

Slotted into the Wix Members contact card dashboard page. Receives the current member ID from the host page's slot context. Calls the loyalty action to load the member's points balance, tier, and last stay date. Renders a compact loyalty summary card directly inside the Members dashboard — staff see loyalty status without leaving the contact view and without navigating to the loyalty admin page.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### loyalty-menu-plugin
<!-- id: loyalty-menu-plugin -->
<!-- type: menu-plugin -->

Adds a "Loyalty" item to the Wix Members dashboard navigation menu. Links to the loyalty admin page. Visible only to staff members with manager or admin role, enforced by the plugin's render condition which reads the current user's StaffRoles record. Staff without the required role do not see this menu item at all.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
