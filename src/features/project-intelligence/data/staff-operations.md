# Staff Operations
<!-- id: staff-operations -->

The back-office layer that gives Meridian's front desk, housekeeping, and sales staff the tools they need to run the hotel day-to-day. Everything in Staff Operations is invisible to guests — it lives in the Wix Dashboard and in gated `/staff/*` routes that require a valid StaffRoles record to access. The system covers four operational domains: arrivals management for front desk, room status for housekeeping, venue inquiry tracking for the sales team, and loyalty administration for ops managers.

## Edit History
- 2026-02-10T09:00:00Z hook — Intent zone created by agent during initial project scaffold
- 2026-02-19T11:00:00Z yasaf@wix.com — Expanded description to name the four operational domains explicitly

---

## Arrivals Management
<!-- id: arrivals-management -->

The daily operational hub for front desk staff. Shows today's expected arrivals enriched with guest preferences, enables check-in confirmation, and gives staff the context they need to deliver a personalized welcome without asking the guest to repeat themselves.

### arrivals-action
<!-- id: arrivals-action -->
<!-- type: action -->

Called from the staff arrivals page on load and every 30 seconds via polling. Reads today's Wix Bookings reservations scoped to the staff member's property (resolved from StaffRoles), enriches each arrival record with the guest's dietary requirements, pillow preference, and room temperature from MemberPreferences, and returns a sorted arrival list ready for front desk display. If the session member has no StaffRoles record, the action throws an authorization error before any data is fetched.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T09:00:00Z dev@wix.com — Added authorization check detail

### staff-auth-action
<!-- id: staff-auth-action -->
<!-- type: action -->

Called at the top of every staff page load and imported by every other staff-facing action. Reads the current session member ID, looks up the StaffRoles collection, and returns the staff member's role and assigned property scope. If no role record exists for the session member, throws an authorization error that causes the calling page to redirect to `/account/dashboard`. This is the single enforcement point for all staff access control — every staff action calls it first.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-16T14:00:00Z yasaf@wix.com — Clarified that this is the single enforcement point, not per-page logic

### staff-arrivals-page
<!-- id: staff-arrivals-page -->
<!-- type: dashboard-page -->

The daily arrivals dashboard for front desk staff. Renders today's arrivals as a card list: guest name, room number, tier badge, check-in time, and a collapsible preferences summary. Refreshes every 30 seconds via the arrivals action. Each card has a "Check In" button that updates the booking status in Wix Bookings and marks the room as occupied in RoomStatus. Scoped to the logged-in staff member's assigned property — a staff member at the Lisbon property sees only Lisbon arrivals.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### staff-router
<!-- id: staff-router -->
<!-- type: router -->

Intercepts all `/staff/*` routes. Before any page renders, calls the staff auth action to verify the session member has a valid StaffRoles record. If not, redirects immediately to `/account/dashboard` — the unauthorized user never sees a flash of any staff UI. If authorized, passes the staff member's role and property scope as route data so every staff page knows its context without re-fetching it on load.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-15T16:00:00Z dev@wix.com — Emphasized no-flash redirect behavior as a security property

---

## Housekeeping
<!-- id: housekeeping -->

The room status board that housekeeping staff use to track which rooms are clean, dirty, occupied, or under maintenance. Updated in real time as staff mark rooms done and as the PMS integration receives check-in and check-out events from Opera Cloud.

### housekeeping-page
<!-- id: housekeeping-page -->
<!-- type: dashboard-page -->

A live room status board organized by floor. Each room cell shows its current status from RoomStatus — clean, dirty, occupied, or maintenance — color-coded for fast scanning. Housekeeping staff tap a cell to cycle the status. Changes write back via an action that updates RoomStatus and logs the change with a timestamp and the staff member's ID. Scoped to the logged-in staff member's assigned property.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### room-status-collection
<!-- id: room-status-collection -->
<!-- type: collection -->

Live room status for every room across all 14 properties. Each row records: property ID, room number, current status (clean, dirty, occupied, maintenance), the timestamp of the last status change, and the ID of the staff member or system that made the change. Written by housekeeping staff via the housekeeping page and by the PMS webhook handler when Opera Cloud sends check-in and check-out events. Read by the housekeeping page and the staff arrivals enrichment logic.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### staff-library
<!-- id: staff-library -->
<!-- type: function-library -->

Bound in the Editor to the staff portal page elements. Exposes `getRoomStatusColor()` bound to the background color of each room cell on the housekeeping board, `formatArrivalTime()` bound to time display elements on the arrivals page, and `getInquiryStatusLabel()` bound to the status badge on each venue inquiry card. Translates raw status values and timestamps from the data layer into the display-ready format that the Editor's bound elements consume.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

---

## Venue CRM
<!-- id: venue-crm -->

The sales pipeline for event and wedding inquiries. When a prospective client submits an inquiry form on a venue page, that submission flows through Wix Automations into the VenueInquiries collection as an enriched CRM record. The sales team manages the pipeline from initial contact through proposal and close entirely within this dashboard view.

### venue-inquiries-page
<!-- id: venue-inquiries-page -->
<!-- type: dashboard-page -->

The venue inquiry CRM for the sales team. Loads all open VenueInquiries for the staff member's property, displays them as a pipeline with CRM status columns: new, contacted, proposal sent, closed won, closed lost. Each card shows the client name, event type, event date, and last contact date. Opening a card shows the full inquiry detail and the contact history. Status updates, notes, and follow-up scheduling all happen from this view.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### venue-inquiries-collection
<!-- id: venue-inquiries-collection -->
<!-- type: collection -->

Enriched venue inquiry records. Each row is one inquiry with: the original form submission data (client name, email, event type, preferred date, guest count, catering requirements), the assigned sales staff member, the current CRM status, a contact history log (array of note objects with timestamp, author, and method), and the next follow-up date. Created by the Wix Automation that fires on form submission, then enriched by the venue inquiry enricher. Updated by the sales team through the venue inquiries page.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-18T11:00:00Z yasaf@wix.com — Added contact history log field detail

### staff-roles-collection
<!-- id: staff-roles-collection -->
<!-- type: collection -->

The hand-rolled RBAC system for staff access control. Each row maps a Wix Members email address to a role (frontdesk, housekeeping, sales, manager, admin) and a property scope (a property ID or "all"). Managed by property managers through the staff role edit modal. Read by the staff auth action on every staff page load. This collection is the single source of truth for who can access what in the staff portal — if a staff member's record is missing or incorrect here, they cannot access any staff features.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-16T15:30:00Z yasaf@wix.com — Emphasized that this is the single source of truth for all staff access

### venue-note-modal
<!-- id: venue-note-modal -->
<!-- type: dashboard-modal -->

Opened from the venue inquiries page when a sales staff member logs a contact note. Free text input for the note content, a contact method selector (call, email, in-person), and an optional next follow-up date picker. On confirm, appends the note with timestamp and staff ID to the VenueInquiries record's contact history array and updates the next follow-up date. All fields except the note text are optional — the only requirement is that something was logged.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### staff-role-edit-modal
<!-- id: staff-role-edit-modal -->
<!-- type: dashboard-modal -->

Opened from the staff management settings screen accessible to property managers. Allows editing a staff member's role and property scope in the StaffRoles collection. Includes a confirmation step when downgrading a role or removing property access, since the change takes effect on the staff member's next login. Prevents self-demotion — a manager cannot downgrade their own role.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T16:00:00Z dev@wix.com — Added self-demotion prevention note

---

## Loyalty Admin
<!-- id: loyalty-admin -->

The staff-facing tools for managing the Meridian Circle loyalty program — manual point adjustments, member lookup, and access to the full transaction ledger. Separate from the member-facing dashboard, this is the back-office view that ops managers use to handle exceptions, run promotions, and resolve disputes.

### booking-enrichment-plugin
<!-- id: booking-enrichment-plugin -->
<!-- type: dashboard-plugin -->

Slotted into the Wix Bookings individual booking detail page. Receives the booking ID from the slot context. Loads the corresponding MemberPreferences record and any open reconciliation log flags for the booked room. Renders guest preferences (dietary, pillow, temperature) and room status notes directly inside the native Wix Bookings booking detail view — staff see everything they need without leaving the booking.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

### pms-sync-menu-plugin
<!-- id: pms-sync-menu-plugin -->
<!-- type: menu-plugin -->

Adds a "PMS Sync" item to the Wix Bookings dashboard navigation menu. Links to a dedicated sync status page showing the full reconciliation log history, per-property sync health, and a manual re-sync trigger. Visible to all staff roles — sync health is operationally relevant to front desk and housekeeping, not just managers.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
