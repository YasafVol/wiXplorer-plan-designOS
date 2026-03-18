# PMS Integration
<!-- id: pms-integration -->

The integration layer between Meridian's Wix site and its two external hospitality systems: Opera Cloud (the Property Management System used on-property by front desk and housekeeping staff) and SiteMinder (the channel manager that aggregates room availability and rates across all booking channels). This zone is entirely invisible to guests but underpins the accuracy of everything they see — prices, availability, and room status all flow through here. When PMS Integration degrades, Booking Flow and Staff Operations degrade with it.

## Edit History
- 2026-02-10T09:00:00Z hook — Intent zone created by agent during initial project scaffold
- 2026-02-19T12:00:00Z yasaf@wix.com — Clarified the two external systems and the cascade dependency relationship

---

## Opera Cloud Integration
<!-- id: opera-cloud-integration -->

The real-time event stream from Opera Cloud into the Wix platform. Opera Cloud is the system of record for what is actually happening on-property — check-ins, check-outs, and room status changes are all events that originate there and must be reflected in the Wix site's data in near real time. This is achieved via webhooks: Opera Cloud calls the PMS events endpoint when relevant events occur, and the endpoint propagates the changes downstream.

### pms-events-api
<!-- id: pms-events-api -->
<!-- type: api -->

Receives POST webhooks from Opera Cloud PMS. Validates the HMAC signature on every request — any request with an invalid signature is rejected with a 401 before any processing occurs. On check-in event: updates RoomStatus to occupied, reads MemberPreferences for the arriving guest and enriches the arrival record for front desk display. On check-out event: updates RoomStatus to dirty, triggers the post-stay survey email via Wix Triggered Emails, and fires the loyalty accrual logic for the completed stay. The most operationally critical inbound endpoint in the system.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T10:30:00Z dev@wix.com — Added HMAC validation detail and operational criticality note

### reconciliation-log-collection
<!-- id: reconciliation-log-collection -->
<!-- type: collection -->

An audit log of every discrepancy found between Opera Cloud's room status and the RoomStatus collection during hourly reconciliation runs. Each row records: property ID, room number, the status in Opera Cloud, the status in RoomStatus, the timestamp of the discrepancy, and whether it was auto-corrected or flagged for manual review. Housekeeping managers review this log to identify systemic issues — a room that consistently shows discrepancies may indicate a front desk workflow problem rather than a technical issue.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-18T14:00:00Z yasaf@wix.com — Added the human interpretation note about systemic vs technical issues

---

## SiteMinder Sync
<!-- id: siteminder-sync -->

The scheduled pull from SiteMinder that keeps AvailabilityCache current. SiteMinder aggregates room inventory across all of Meridian's booking channels — direct, OTA, corporate — and is the authoritative source of what rooms are actually available at what price at any moment. The sync runs on a schedule and can also receive push updates for time-sensitive changes.

### availability-cache
<!-- id: availability-cache -->
<!-- type: collection -->

Stores live room availability pulled from SiteMinder every 5 minutes. Read by the pricing widget and the booking validator. If this collection gets stale — because the sync job fails or times out — guests see outdated prices and may attempt to book rooms that are no longer available. The sync warning threshold is 6 minutes. Current status: last sync was 14 minutes ago. This node is shared with the Booking Flow / Dynamic Pricing feature cluster.

#### Edit History
- 2026-02-15T09:20:00Z hook — Description auto-generated from import graph
- 2026-02-17T11:05:00Z dev@wix.com — Clarified stale data consequence and threshold detail
- 2026-02-20T08:51:00Z hook — Status updated to warning after sync timeout

### availability-sync-job
<!-- id: availability-sync-job -->
<!-- type: job -->

Runs every 5 minutes. Calls the SiteMinder API for all 14 properties, normalizes the per-room availability response into the AvailabilityCache schema, and performs a bulk update. Reads the sync interval from SiteConfig so the ops team can adjust frequency without a code deploy. Last 3 runs timed out — this is the root cause of the current AvailabilityCache warning. This node is shared with the Booking Flow / Availability Sync feature cluster.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-20T08:00:00Z hook — Status updated to warning after 3 consecutive timeout failures

### availability-push-api
<!-- id: availability-push-api -->
<!-- type: api -->

Receives availability update pushes from SiteMinder when inventory changes outside the regular sync window — a room is sold out on a partner channel, a block is released, or a rate changes. Validates the incoming payload signature, then writes directly to AvailabilityCache, bypassing the scheduled sync. This is the fast path for time-sensitive availability changes. Also shared with the Booking Flow / Availability Sync feature cluster.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph

---

## Reconciliation
<!-- id: reconciliation -->

The hourly process that compares Opera Cloud's view of room status against the RoomStatus collection and corrects any discrepancies. Reconciliation is the safety net that catches missed webhook deliveries, processing failures, or timing gaps between Opera Cloud events and their reflection in the Wix data layer. Without it, small discrepancies accumulate into operational problems.

### pms-reconciliation-job
<!-- id: pms-reconciliation-job -->
<!-- type: job -->

Runs hourly. Calls Opera Cloud's current room status endpoint for all properties and compares the response against the RoomStatus collection row by row. Any discrepancy — a room marked clean in Opera but dirty in the collection, an occupied room not reflected, a check-out not yet processed — is auto-corrected in RoomStatus and logged as a row in ReconciliationLog. Discrepancies that cannot be auto-corrected (ambiguous state, conflicting signals) are flagged for manual review and surfaced in the PMS sync dashboard page. Designed to be idempotent.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
- 2026-02-17T11:30:00Z dev@wix.com — Added idempotency note and manual review escalation path

### room-status-collection
<!-- id: room-status-collection -->
<!-- type: collection -->

Live room status for every room across all 14 properties. Each row records: property ID, room number, current status (clean, dirty, occupied, maintenance), the timestamp of the last status change, and the ID of the staff member or system that made the change. Written by the PMS webhook handler when Opera Cloud sends events, written by housekeeping staff via the housekeeping page, and corrected by the reconciliation job. This node is shared with the Staff Operations / Housekeeping feature cluster.

#### Edit History
- 2026-02-10T09:00:00Z hook — Description auto-generated from import graph
