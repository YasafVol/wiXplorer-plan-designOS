# Code-First Navigation and Graph Views

## Purpose

Define a code-first product surface in wiXplorer where code entities are treated as first-class citizens, not secondary details behind pages/apps/tables.

This document captures product intent, UX decisions, and implementation rules for:

- project picker behavior for code projects
- code navigation view behavior
- project graph behavior for code projects
- clustering and unpacking semantics for server-side extensions

---

## Product Goals

### Primary goals

- Let users understand extension architecture quickly (entrypoint, runtime split, data flow).
- Make execution context explicit (`Client code` vs `Server code`).
- Preserve both abstraction levels:
  - high-level grouped extension view
  - low-level file-level view (builder/handler)
- Ensure code-specific projects have a code-specific workflow.

### Non-goals

- This is not a generalized source browser.
- This does not replace implementation-level IDE navigation.
- This does not model backend business logic in depth; it models architecture and dependencies.

---

## Canonical Concepts

### Code project

A project whose display name starts with `Code:`.  
Code projects follow code-first navigation rules and do not expose Inventory view.

### Extension

A grouped backend extension unit represented by `scheduledJobGroup`.  
Builder + handler are implementation files of one extension, not separate product-level extensions.

### Metadata nodes

Nodes such as pages/apps/collections connected to the extension flow but not counted as extension units.

### Ghost node

`extensions.ts` (`extensionsRoot`) acts as a visual world anchor and context divider, not an active dependency node in Project Graph.

---

## Information Architecture

## Project Picker

### Code project cards

Code project cards show code-first stats:

- `Extension types` (derived from extension groups only)
- `Extensions` (count of grouped extension units only)

Do not derive these stats from:

- builder/handler internal files
- pages/apps/tables
- root anchor node (`extensions.ts`)

### Card actions

- Code projects: `Open in graph` + `Code navigation`
- Non-code projects: `Open in graph` + `Inventory`

### Card layout

Code projects are shown in a single horizontal row (`Code Projects` section).

---

## Navigation Rules

### Route naming

Preferred route:

- `/projects/:projectId/code-navigation`

### Inventory restrictions

Inventory is disabled for all code projects.

If user lands on inventory route for a code project, show disabled state with CTA:

- `Open code navigation`

---

## Code Navigation View (Dedicated)

### Core visual model

- `extensions.ts` is centered as world anchor.
- A single horizontal split passes through its vertical center.
- Split semantics: `Client code` above context, `Server code` below context.
- `Code` scope is the default on open.
- Canvas sizing is dynamic (content-driven + fit-to-screen), matching Project Graph canvas behavior.

### Node semantics

- `Scheduled Jobs` area groups extension execution units.
- Flow below split:
  - extension -> collection -> app -> pages
- Supports grouped and exploded job states in inspector controls.

### Interaction model

- Node select and inspector details.
- chain highlight support.
- code snapshot context.
- zoom controls: in, out, reset.
- In `Project` + `Stratified`, render additional horizontal guide bands at `±1.5h`, `±2h`, `±2.5h` around the split.

### Inspector behavior (generic)

The inspector must operate with four canonical selection levels:

- `project` level (empty selection / canvas background)
- `extensionType` level (entire subgraph/type, e.g. `CONTEXTS`)
- `extensionInstance` level (single extension unit, e.g. `custom-context-2`)
- `file` level (single member file)

For each selection level, inspector name, metadata, collapse actions, and connected entities must be computed from the active level:

- **project**
  - name: project display name
  - collapse actions: global (`expand all` / `collapse all`)
  - connected entities: project-wide selection context
- **extensionType**
  - name: type/subgraph label
  - collapse actions: type-wide (`expand type` / `collapse type`)
  - connected entities: aggregate across all instances under the selected type
- **extensionInstance**
  - name: instance label
  - collapse actions: instance-local (`expand instance` / `collapse instance`)
  - connected entities: selection context for that specific instance
- **file**
  - name: file label
  - collapse actions: parent-instance control (`expand parent` / `collapse parent`)
  - connected entities: file-level selection context

The right-panel hierarchy list is the selector source of truth:

- top-level subgraph rows select `extensionType`
- nested extension rows select `extensionInstance`
- rows are independently collapsible for scanning large projects
- canvas container clicks are valid selector entry points:
  - outer subgraph/domain container selects `extensionType`
  - inner extension-instance container selects `extensionInstance`

### Grouping pattern (canonical)

Code Navigation uses a hierarchical grouping pattern for extensions in general (not client-only):

- `extensions.ts` remains the global boundary anchor.
- Domain/subgraph container wraps sibling extension units (for example: `CONTEXTS`).
- Each extension is its own unit.
- When a unit is unpacked, its member files render inside that unit's own inner container.

This yields a stable hierarchy:

- subgraph/domain container -> extension unit -> extension member files

### Internal taxonomy knowledge base (non-UI)

This taxonomy is internal classification data.  
It must drive grouping and layout logic, but must not be exposed as raw internal labels in primary user UI.

- `server`
  - `actions`
  - `api`
  - `events`
  - `routers`
  - `jobs`
  - `service-plugins`
- `client`
  - `dashboard`
    - `menu-plugins`
    - `modals`
    - `pages`
    - `plugins`
  - `site`
    - `components`
    - `contexts`
    - `embedded-scripts`
    - `function-libraries`
    - `styles`

---

## Project Graph Behavior for Code Projects

## `extensions.ts` as ghost anchor

In Project Graph view:

- render `extensions.ts` as semi-transparent gray ghost card.
- position it centered between `Client Code` and `Server Code` lanes.
- remove all direct edges to/from `extensions.ts`.

Rationale: it defines architectural boundary, not actionable runtime dependency.

## Server extension clustering model

### Clusters ON (default)

Render one cluster-style server node for the grouped extension:

- label: grouped scheduled node label
- member count: `2 files`
- explicit inline `Unpack` control

Do not render builder/handler as separate visible nodes while collapsed.

### Unpack (while clusters ON)

When unpacking the server cluster:

- hide grouped scheduled node
- show exactly two files:
  - `my-job.extension.ts`
  - `my-job.ts`
- show file-level edge:
  - builder -> handler
- preserve data edge:
  - handler -> collection

### Clusters OFF

Behave as unpacked file-level view for server extension internals:

- grouped scheduled node hidden
- only builder + handler visible as server extension files
- same file/data edges as above

---

## Data and Counting Rules

### Extension count

Count only nodes where:

- `type === 'code'`
- `meta.kind === 'scheduledJobGroup'`

### Extension types list

List unique kinds from grouped extension nodes only.  
For current model this resolves to `Scheduled jobs`.

### Not counted as extension units

- `extensionsRoot`
- `builderFile`
- `handlerFile`
- all non-code nodes (pages/apps/tables/etc.)

---

## Interaction Requirements

### Cluster control

Clustered server node must expose direct control to unpack/repack on the node card itself (not hidden in external controls).

### Edge integrity after projection changes

Any synthetic projection that hides grouped nodes must preserve semantic connectivity:

- builder -> handler
- handler -> collection

Never leave handler disconnected from collection in file-level views.

### Visual consistency

Clustered extension should use cluster visual language (cluster card), not regular code card styling.

---

## Technical Implementation Notes

### Relevant files

- `src/components/ProjectsPage.tsx`
- `src/components/ProjectInventoryPage.tsx`
- `src/components/CodeNavigationPage.tsx`
- `src/lib/router.tsx`
- `src/projects/index.ts`
- `src/sections/project-graph/components/ProjectGraph.tsx`
- `src/sections/project-graph/components/ClusterNodeCard.tsx`
- `src/sections/project-graph/components/GraphNode.tsx`
- `src/sections/project-graph/components/clusterUtils.ts`

### Projection strategy summary

- Use derived effective node/edge sets for graph modes.
- Apply mode-specific filtering for grouped/internal code nodes.
- Introduce synthetic edges only when needed to preserve semantics in projected modes.

### Safety checks

- Keep lane/label rendering independent of clustered projection details.
- Ensure selected/connected/highlight logic uses the same projected edge set currently rendered.

---

## Acceptance Criteria

### Project picker

- Code projects show `Extension types` + `Extensions`.
- Code projects expose no Inventory action.

### Routing and access

- `/code-navigation` route is primary and works.
- Inventory route for code projects shows disabled + CTA.

### Graph visual/behavioral

- Ghost `extensions.ts` centered between client/server lanes.
- Ghost has no incoming/outgoing edges.
- With clusters ON: one server extension cluster node with visible unpack control.
- Unpacked state shows only builder + handler files.
- In unpacked/file-level state, handler connects to collection.

### UX quality

- No contradictory duplicate representations (grouped + internal files at same time in same mode).
- Cluster style is visually distinct from regular node style.
- All modified states remain selectable and inspectable.
- Code navigation canvas uses the same drawing conventions as Project Graph (full-bleed grid + transformed draw layer).
- Subgraph/domain parent container persists while extension units expand/collapse inside it.
- Unpacked extension files render inside an extension-specific inner container (not loose under the parent).
- Inspector empty state resolves to project-level selection (project name, project controls, project data).
- Inspector selection level always drives panel title, collapse behavior, metadata scope, and connected-entities scope.

### Project Intelligence inspector draft workflow

When users edit configuration or file-level content from Project Intelligence inspector, edits are staged as pending changes and require publish.

- **Draft-first edits**
  - configuration quick edits and file quick edits are recorded as pending changes
  - pending changes include node, section, field, before/after value, timestamp, and source (`inline-quick-edit` or `modal-quick-edit`)
- **Publish-required state**
  - top shell header shows a persistent `Publish required` state with pending change count whenever draft changes exist
  - header actions:
    - `View changes` opens pending-change review
    - `Publish` clears staged draft changes in phase 1 (publish backend wiring is a future phase)
- **Review-before-publish**
  - pending-change review is a modal list with before/after values
  - users can:
    - jump to changed node
    - revert individual changes
- **Two quick-edit patterns**
  - top/configuration section: tiny inline editor inside inspector row (`quick edit`, `save`, `cancel`)
  - bottom/files section: modal editor over graph for file-level quick edits
- **Connection row behavior**
  - connections are structured, full-row hyperlink-style targets
  - entity name is visibly linked
  - rows are keyboard accessible with focus-ring affordances

Relevant files:

- `src/features/project-intelligence/components/AppShell.tsx`
- `src/features/project-intelligence/components/inspector/InspectorPanel.tsx`
- `src/features/project-intelligence/components/inspector/InspectorLevel3.tsx`
- `src/features/project-intelligence/components/inspector/FileList.tsx`
- `src/features/project-intelligence/components/inspector/ConnectionList.tsx`
- `src/features/project-intelligence/components/inspector/PendingChangesReviewModal.tsx`
- `src/features/project-intelligence/components/inspector/FileQuickEditModal.tsx`
- `src/features/project-intelligence/types.ts`

### Project Intelligence graph mode decisions

- **Top-level mode toggle**
  - Project Intelligence header exposes `ICICLE` and `TREE` modes.
  - Mode is session-only and defaults to `ICICLE` on reload (no persistence to URL/localStorage).
- **TREE interaction model**
  - TREE is fully collapsible.
  - Initial TREE state is closed for nodes that have children.
  - Node selection remains inspector-driven in TREE the same way as ICICLE.
- **Shared-node projection policy**
  - TREE uses canonical single-parent projection for multi-parent graphs to prevent duplicate rendered nodes.
  - Shared nodes are explicitly marked with shared metadata (`Shared xN`).
- **Root connectivity policy**
  - TREE prepends a synthetic root hub to anchor top-level intent branches.
  - Hub is visual-only and not a selectable inspector entity.
  - Root hub title text is intentionally omitted.
- **TREE appearance policy**
  - Supported variants: `soft-card`, `balanced-default`, `focus-mode`.
  - Default TREE variant is `focus-mode`.
  - Vertical depth rails are not used.

Relevant files:

- `src/features/project-intelligence/components/AppShell.tsx`
- `src/features/project-intelligence/components/tree/TreeChart.tsx`
- `src/features/project-intelligence/components/tree/TreeNode.tsx`
- `src/features/project-intelligence/lib/displayTree.ts`

### Project Intelligence inspector visual and ergonomics decisions

- **Header structure**
  - Inspector level-3 header uses icon + title + subtle type subtitle row.
  - Redundant top type pill and duplicate standalone title are removed.
- **Status strip**
  - `Status` and `Intent source` render on one compact line.
- **Description affordance**
  - Description remains editable with explicit visible edit affordance.
- **Card grouping**
  - `Configuration`, `Connections`, and `Files` each render in separate bordered cards.
  - `Last modified` is grouped inside the `Files` card footer.
- **Connections behavior**
  - Connection rows stay hyperlink-like and keyboard accessible.
  - Secondary "Jump to connected entity" helper text is removed.
  - Collection connections expose a collapsible `View schema` quick action.
- **Files behavior**
  - Path is shown once in the files section header area.
  - Per-file rows show basename only (not full path duplication).
- **Inspector chrome ergonomics**
  - Inspector pane is horizontally resizable with maximum width capped at `33%`.
  - Inspector pane is vertically scrollable when content exceeds viewport.
  - Bottom-most inspector action bar omits redundant `Open in IDE` action.

Relevant files:

- `src/features/project-intelligence/components/AppShell.tsx`
- `src/features/project-intelligence/components/inspector/InspectorLevel3.tsx`
- `src/features/project-intelligence/components/inspector/FileList.tsx`
- `src/features/project-intelligence/components/inspector/ConnectionList.tsx`

### Product baseline decisions reflected here (repo-wide anchors)

This document remains the canonical decision log for navigation/graph/inspector behavior.  
Broader product decisions are also represented here as baseline anchors and sourced from:

- `product/product-overview.md` (product problems/solutions and key features)
- `product/product-roadmap.md` (section prioritization and sequence)
- `product/data-shape/data-shape.md` (entity vocabulary and relationships)
- `product/shell/spec.md` (navigation shell and responsive layout decisions)
- `product/sections/project-graph/spec.md` (graph interaction, inspector, and clustering decisions)

## Decision Coverage Ledger

| Decision area | Status | Source of truth |
| --- | --- | --- |
| Code-first navigation and graph behavior | covered | `docs/code-first-nav-and-graph-views.md` |
| Project Intelligence draft/publish workflow | covered | `src/features/project-intelligence/components/AppShell.tsx`, `src/features/project-intelligence/components/inspector/*`, `src/features/project-intelligence/types.ts` |
| Project Intelligence TREE mode (toggle, canonical projection, root hub, variants) | expanded | `src/features/project-intelligence/components/tree/*`, `src/features/project-intelligence/lib/displayTree.ts`, `src/features/project-intelligence/components/AppShell.tsx` |
| Project Intelligence inspector visual layout and ergonomics | newly-added | `src/features/project-intelligence/components/inspector/*`, `src/features/project-intelligence/components/AppShell.tsx` |
| Product overview and roadmap anchors | newly-added | `product/product-overview.md`, `product/product-roadmap.md` |
| Data shape anchors | newly-added | `product/data-shape/data-shape.md` |
| Shell behavior anchors | newly-added | `product/shell/spec.md` |
| Project graph section spec anchors | newly-added | `product/sections/project-graph/spec.md` |

---

## Open Follow-Ups

- Add explicit label in inspector for projected/synthetic edges (optional transparency feature).
- Add per-code-project cluster policy settings (future scalability).
- Consider dedicated `code cluster` visual variant distinct from page clusters if domain complexity grows.
