# Loyalty Program
<!-- id: loyalty-program -->
Defines how Meridian rewards guest behavior and keeps benefits visible across booking and account surfaces.
This intent zone ties long-term retention metrics to operationally reliable member experiences.

## Edit History
- 2026-02-11T13:00:00Z yasaf@wix.com - Initial retention scope
- 2026-02-17T10:30:00Z dev@wix.com - Added dashboard and tier operations coverage

---

## Points Accrual
<!-- id: points-accrual -->
Captures points-earning events from bookings and eligible transactions. It ensures point balances update
promptly so members trust what they see immediately after conversion.

### Loyalty Action
<!-- id: loyalty-action -->
<!-- type: action -->
Computes points accrual outcomes for booking and adjustment events and writes transactions to the ledger.

#### Edit History
- 2026-02-17T11:10:00Z hook - Action role inferred from server handlers

### LoyaltyLedger
<!-- id: loyalty-ledger -->
<!-- type: collection -->
Canonical transaction ledger for all point debits and credits. Shared across accrual and tier management.

#### Edit History
- 2026-02-17T11:12:00Z dev@wix.com - Clarified canonical ledger responsibility

---

## Tier Management
<!-- id: tier-management -->
Evaluates member progress and determines tier upgrades or downgrades on scheduled cadence.
The cluster translates engagement data into visible loyalty status and benefits.

### Loyalty Tier Job
<!-- id: loyalty-tier-job -->
<!-- type: job -->
Nightly worker that recalculates member tier state from ledger activity and configured thresholds.

#### Edit History
- 2026-02-17T11:15:00Z hook - Scheduler mapping imported

### LoyaltyLedger
<!-- id: loyalty-ledger -->
<!-- type: collection -->
Shared ledger reused here for tier recomputation, preserving one source of truth for member transactions.

#### Edit History
- 2026-02-17T11:16:00Z dev@wix.com - Added multi-parent explanation

---

## Member Dashboard
<!-- id: member-dashboard -->
Delivers member-facing and operator-facing loyalty visibility. It surfaces balances, tiers, and controls
that support support-team interventions without breaking policy consistency.

### LoyaltyLibrary
<!-- id: loyalty-function-library -->
<!-- type: function-library -->
Client-side utility set that formats points, perks, and tier messaging for dashboard surfaces.

#### Edit History
- 2026-02-17T11:18:00Z hook - Utility role inferred from usage graph

### MemberContext
<!-- id: member-context -->
<!-- type: context -->
Context container for member identity, current tier, and points summary used by dashboard widgets.

#### Edit History
- 2026-02-17T11:20:00Z dev@wix.com - Added state-shape summary

### Loyalty Admin Page
<!-- id: loyalty-admin-page -->
<!-- type: dashboard-page -->
Operational page for support teams to inspect member loyalty status and trigger approved adjustments.

#### Edit History
- 2026-02-17T11:22:00Z yasaf@wix.com - Added operator workflow context

### Points Adjustment Modal
<!-- id: points-adjustment-modal -->
<!-- type: dashboard-modal -->
Modal workflow used by authorized roles to submit audited manual point adjustments.

#### Edit History
- 2026-02-17T11:25:00Z hook - Modal inferred from dashboard manifest

### Loyalty Summary Plugin
<!-- id: loyalty-summary-plugin -->
<!-- type: dashboard-plugin -->
Dashboard plugin that renders quick loyalty KPIs and trend summaries for support teams.

#### Edit History
- 2026-02-17T11:27:00Z hook - Plugin role inferred

### Loyalty Menu Plugin
<!-- id: loyalty-menu-plugin -->
<!-- type: menu-plugin -->
Adds loyalty entry points into dashboard navigation based on role and entitlement checks.

#### Edit History
- 2026-02-17T11:29:00Z dev@wix.com - Added navigation visibility detail
