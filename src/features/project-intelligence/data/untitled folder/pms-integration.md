# PMS Integration
<!-- id: pms-integration -->
Connects Meridian's platform with external PMS providers for inventory and operational state alignment.
This zone is integration-critical and drives warning rollups when freshness thresholds are breached.

## Edit History
- 2026-02-12T15:00:00Z yasaf@wix.com - Defined PMS boundary and ownership
- 2026-02-20T09:01:00Z hook - Updated warning context from sync telemetry

---

## Opera Cloud Integration
<!-- id: opera-cloud-integration -->
Handles ingestion of operational events from Opera Cloud and maps them to internal schemas.
It keeps room-state changes and operational updates synchronized with staff dashboards.

### PMS Events API
<!-- id: pms-events-api -->
<!-- type: api -->
Inbound API endpoint receiving PMS lifecycle events that update operational datasets.

#### Edit History
- 2026-02-20T08:50:00Z hook - API route and payload role inferred

### RoomStatus
<!-- id: room-status-collection -->
<!-- type: collection -->
Shared collection consumed by housekeeping and integration jobs for room-state consistency.

#### Edit History
- 2026-02-20T08:54:00Z hook - Added integration-side ownership context

---

## SiteMinder Sync
<!-- id: siteminder-sync -->
Maintains inventory parity between SiteMinder and Meridian booking systems. This cluster is currently
in warning because cache freshness has drifted outside the expected sync threshold.

### Availability Push API
<!-- id: availability-push-api -->
<!-- type: api -->
Endpoint receiving SiteMinder availability pushes and staging updates for cache persistence.

#### Edit History
- 2026-02-20T08:51:00Z hook - API flow imported from integration map

### AvailabilityCache
<!-- id: availability-cache -->
<!-- type: collection -->
Shared availability cache referenced by booking and PMS workflows. Its stale window is the source
of current warning state and requires sync job recovery.

#### Edit History
- 2026-02-20T08:58:00Z dev@wix.com - Updated warning narrative for operations demo

---

## Reconciliation
<!-- id: reconciliation -->
Verifies that external PMS state and internal booking state remain aligned over time. The cluster provides
auditability and repair workflows when mismatches are detected.

### PMS Reconciliation Job
<!-- id: pms-reconciliation-job -->
<!-- type: job -->
Scheduled job that compares PMS and internal snapshots, then records mismatch metrics.

#### Edit History
- 2026-02-20T08:44:00Z hook - Scheduler role inferred

### ReconciliationLog
<!-- id: reconciliation-log-collection -->
<!-- type: collection -->
Collection of reconciliation outcomes used for monitoring, incident review, and trend analysis.

#### Edit History
- 2026-02-20T08:43:00Z hook - Collection profile generated
