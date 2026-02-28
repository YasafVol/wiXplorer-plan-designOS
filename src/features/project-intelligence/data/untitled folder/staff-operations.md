# Staff Operations
<!-- id: staff-operations -->
Supports day-to-day hotel team workflows across arrivals, housekeeping, venue lead handling, and admin tasks.
This zone focuses on operational throughput while preserving traceability and role-based access boundaries.

## Edit History
- 2026-02-12T09:00:00Z yasaf@wix.com - Initial operations scope
- 2026-02-18T07:30:00Z dev@wix.com - Added CRM and loyalty admin responsibilities

---

## Arrivals Management
<!-- id: arrivals-management -->
Coordinates front-desk workflows for upcoming guests and same-day check-ins. The cluster centralizes
status and assignment logic to reduce handoff friction between teams.

### Arrivals Action
<!-- id: arrivals-action -->
<!-- type: action -->
Generates actionable arrivals queues and room readiness views for staff dashboards.

#### Edit History
- 2026-02-18T08:00:00Z hook - Action inferred from arrivals page calls

### Staff Auth Action
<!-- id: staff-auth-action -->
<!-- type: action -->
Resolves staff session identity and role scope before sensitive operations are executed.

#### Edit History
- 2026-02-18T08:02:00Z hook - Authentication action inferred from route guards

### Staff Router
<!-- id: staff-router -->
<!-- type: router -->
Routes staff-facing surfaces with role checks so teams only access approved operational views.

#### Edit History
- 2026-02-18T08:04:00Z hook - Router inferred from route manifest

### Staff Arrivals Page
<!-- id: staff-arrivals-page -->
<!-- type: dashboard-page -->
Primary dashboard page for front-desk arrivals triage, assignment, and guest readiness review.

#### Edit History
- 2026-02-18T08:06:00Z dev@wix.com - Added triage language

### Booking Enrichment Plugin
<!-- id: booking-enrichment-plugin -->
<!-- type: dashboard-plugin -->
Augments arrivals cards with additional guest context to support faster service decisions.

#### Edit History
- 2026-02-18T08:18:00Z dev@wix.com - Plugin flow documented

---

## Housekeeping
<!-- id: housekeeping -->
Tracks room readiness and cleaning state across properties. The cluster makes room turnover status visible
to operations teams and upstream booking flows.

### Housekeeping Page
<!-- id: housekeeping-page -->
<!-- type: dashboard-page -->
Operational board showing room status, assignment ownership, and update freshness.

#### Edit History
- 2026-02-18T08:08:00Z dev@wix.com - Added assignment ownership details

### RoomStatus
<!-- id: room-status-collection -->
<!-- type: collection -->
Shared room-state collection consumed by housekeeping and PMS integration pipelines.

#### Edit History
- 2026-02-18T08:14:00Z hook - Multi-parent relation detected

---

## Venue CRM
<!-- id: venue-crm -->
Manages leads and communications for event and venue inquiries. It enables sales teams to qualify and
follow up without losing operational context.

### Venue Inquiries Page
<!-- id: venue-inquiries-page -->
<!-- type: dashboard-page -->
Dashboard page for reviewing lead status, budget context, and conversion readiness.

#### Edit History
- 2026-02-18T08:10:00Z yasaf@wix.com - Added conversion readiness framing

### VenueInquiries
<!-- id: venue-inquiries-collection -->
<!-- type: collection -->
Stores venue inquiry records and owner assignments for CRM workflows.

#### Edit History
- 2026-02-18T08:15:00Z hook - Collection profile generated

### Venue Note Modal
<!-- id: venue-note-modal -->
<!-- type: dashboard-modal -->
Modal used to append structured notes and follow-up actions on inquiry records.

#### Edit History
- 2026-02-18T08:21:00Z hook - Modal inferred from CRM workflow

---

## Loyalty Admin
<!-- id: loyalty-admin -->
Provides staff-facing controls for loyalty policy enforcement and exception handling.
This cluster ensures support operations can intervene while preserving auditability.

### StaffRoles
<!-- id: staff-roles-collection -->
<!-- type: collection -->
Role and permission mapping dataset used by staff auth and admin editing experiences.

#### Edit History
- 2026-02-18T08:12:00Z hook - Collection profile generated

### StaffLibrary
<!-- id: staff-library -->
<!-- type: function-library -->
Shared utility functions for role formatting, policy checks, and UI-level permission logic.

#### Edit History
- 2026-02-18T08:17:00Z hook - Library role inferred

### Staff Role Edit Modal
<!-- id: staff-role-edit-modal -->
<!-- type: dashboard-modal -->
Controlled edit workflow for role changes with confirmation and audit semantics.

#### Edit History
- 2026-02-18T08:20:00Z hook - Modal inferred from admin page composition

### PMS Sync Menu Plugin
<!-- id: pms-sync-menu-plugin -->
<!-- type: menu-plugin -->
Navigation extension that exposes PMS sync and reconciliation operations to authorized admins.

#### Edit History
- 2026-02-18T08:24:00Z dev@wix.com - Added authorization context
