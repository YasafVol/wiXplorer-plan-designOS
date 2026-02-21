# Project Graph Specification

## Overview
wiXplorer has two complementary views of a Wix site's structure: the **Project Graph** and the **Inventory Table**. Both are accessible from the `/projects` project picker.

The **Project Graph** is a hierarchical, layered visualization of all entities and their relationships. It is optimized for understanding structure, tracing dependencies, and exploring connectivity. The layout uses a Sugiyama barycenter algorithm to minimize edge crossings across all layers.

The **Inventory Table** is a sortable, filterable table across entity types. It is optimized for auditing, bulk scanning, and management tasks — use cases where the graph's spatial layout is not the right tool. The two views are interlinked: the inventory table has a row action to open the graph focused on that node.

## Node Types
Each entity type has a distinct color, icon, and layer position:

| Type      | Color   | Layer position         | Description |
|-----------|---------|------------------------|-------------|
| project   | slate   | Root (layer 0)         | The Wix site root; everything is reachable from here |
| page      | indigo  | Layers 1…N (sub-rows)  | Pages organized in a parent→child hierarchy |
| app       | cyan    | Apps layer             | Installed Wix Dev Center apps |
| table     | emerald | Tables layer           | CMS collections (Wix Data) |
| code      | violet  | Client / Server layers | Velo code files — split by context |
| package   | fuchsia | Packages layer         | npm packages used by Velo backend code |
| analytics | amber   | Analytics layer        | Per-page traffic snapshots (30-day window) |

## Edge Types
| Type       | Meaning |
|------------|---------|
| contains   | Parent→child containment (project→page, page→sub-page) |
| hosts      | Page hosts an app |
| manages    | App manages a CMS table |
| reads      | Code file reads from a CMS table |
| depends_on | Generic dependency |
| tracks     | Analytics node tracks a page |
| imports    | Code file imports an npm package |
| triggers   | App triggers a backend code event handler |

## Layout

### Layer order (top to bottom)
1. **Root** — project node
2. **Pages** — root pages (depth 0)
3. **Page sub-rows** — child pages at increasing depth (depth 1, 2, 3…), each sub-row is a separate layer slot
4. **Apps**
5. **Tables**
6. **Client Code** — Velo files with `fileType: 'page' | 'site'`
7. **Server Code** — Velo files with `fileType: 'backend'`
8. **Packages** — npm packages
9. **Analytics**

### Page hierarchy sub-rows
Pages are not flat — they form a parent→child tree via `contains` edges. BFS from root pages assigns each page a depth. Each depth level occupies its own layer slot. Sub-row gaps are 44px (vs 88px between type boundaries) to show visual proximity within the page hierarchy. Sub-row separators are dashed lines; type-boundary separators are solid lines.

### Crossing minimization
Layout uses 4-pass alternating Sugiyama barycenter sweeps (down then up, repeated twice) to minimize edge crossings.

### Edge direction
Bezier curves adapt to relative node position:
- **Downward** (source above target): exits bottom of source card, enters top of target card
- **Upward** (source below target): exits top of source card, enters bottom of target card
- **Same layer**: arcs 40px above the midline

## User Flows

### Core exploration
- User views the full graph; the canvas auto-fits on load
- User pans by dragging the canvas background; zooms with mouse wheel; uses +/− buttons or fit-to-screen button
- User single-clicks a node to select it — highlights the node and its connections within the configured depth, dims everything else
- User adjusts the depth toggle (1° or 2°) to control how many hops of connections are highlighted
- User double-clicks a node to open the Entity Detail view (via `onNodeOpen` callback)
- User clicks the canvas background to deselect; the Inspector panel stays open showing its empty state
- User types in the search box to highlight nodes matching the label; a match count badge appears

### Layer filtering
- User toggles layer filter pills in the toolbar to show/hide entity types (Pages, Apps, Tables, Code, Package, Analytics)
- Visible layers reflow; separators and labels update to reflect active layers only

### Inspector panel
- The Inspector panel is open by default and docked to the right of the canvas
- When no node is selected, it shows an empty state (mouse pointer icon + prompt)
- When a node is selected, it shows: type badge, source system, type description, type-specific details, active alerts, and connections grouped by type
- The panel can be hidden/shown via the PanelRight toggle button in the toolbar
- Type-specific drill-down content:
  - **Table**: visual schema table with field names and colored type badges per field type (text=sky, number=violet, boolean=amber, date=teal, richtext=indigo, array=pink, object=slate)
  - **Code**: context shown as "Client" or "Server" (derived from `fileType`); shows path, line count, last modified, schedule if set, and description
  - **Package**: registered event hooks listed as fuchsia pills with a Zap icon
  - **Page**: "Page Internals" section listing what's on the page — hosted apps/client code ("On this page"), connected tables ("Data layer"), and child pages ("Sub-pages")

### Node action menu
A floating toolbar appears anchored below a selected node with four actions:
- **Go to** — navigates to the entity detail (fires `onNodeOpen`)
- **Explain** — opens/re-opens the Inspector panel
- **Explore** — zooms the canvas to fit the node's neighborhood and raises depth to 2
- **Go to Monitoring** — fires `onGoToMonitoring` for alerted nodes

### Edge annotations
- An "Edge labels" toggle button in the toolbar shows/hides edge type labels
- When enabled, each edge renders a pill at the bezier midpoint showing the relationship (hosts, manages, reads, uses, tracks, imports, triggers)
- Structural `contains` edges do not get labels (the layer hierarchy already communicates containment)
- Labels are hidden when the edge is dimmed

### Views
Views let users isolate a meaningful subset of the graph:

**Auto-generated views** (computed from graph structure):
- **Purchase Flow** — BFS-2 from the Stores app node (shop pages, cart, checkout, products table, etc.)
- **Content Discovery** — BFS-2 from the Blog app node (blog pages, articles, posts table, etc.)
- **Analytics Overview** — BFS-1 from all analytics nodes (analytics + their tracked pages)

**Custom views**:
- User saves the current highlighted neighborhood (selected node's connections, or the active view) as a named custom view
- Custom views can be deleted
- Activating any view dims all nodes/edges outside the view and zooms to fit the view nodes
- The active view name appears on the Views button; clicking it again (with null) clears the view
- Views are accessed via a dropdown from the "Views" (Layers icon) button in the toolbar

### Alerts
- Nodes with active monitoring alerts show a red badge with the alert count
- Alerted edges are rendered in red
- The Inspector panel shows alert details (severity, message) for the selected node

### Drag behavior
- Panning the canvas (mousedown + drag) does not deselect the current node
- A drag is distinguished from a click by a 4px movement threshold; only a true click (no movement) triggers deselection or selection changes

---

## Inventory Table

The inventory table is a dedicated full-screen view at `/projects/:id/inventory`. It provides a management-oriented lens over the same graph data, without the spatial layout.

### Tabs

| Tab    | Entity type | Primary use |
|--------|-------------|-------------|
| Pages  | `page`      | Audit page coverage, find orphans, check analytics gaps |
| Apps   | `app`       | Review installed apps and their scope |
| Tables | `table`     | Inspect CMS collections, row counts, schema field counts |
| Code   | `code`      | Review Velo files by context, size, modification date, schedule |

### Pages tab columns

| Column   | Description |
|----------|-------------|
| Name     | Page label with depth indentation (vertical bars showing hierarchy level) and an "orphan" badge if no inbound edges |
| URL      | Full URL path in monospace; `{slug}` patterns indicate dynamic/template pages |
| Type     | Inferred from URL: `static` (no params), `dynamic` (`:param`), `template` (`{slug}`) |
| Cluster  | Root-ancestor page label (the top-level section this page belongs to); `—` for root pages |
| Status   | Published / Draft badge |
| Traffic  | `views30d` from the linked analytics node, formatted as `184K`; "no data" if no analytics node tracks this page |
| Alerts   | Alert count badge colored by max severity (error = red, warning = amber) |
| Deps     | Count of directly connected non-page nodes (apps, tables, code, packages, analytics) |

### Filters (Pages tab)

| Filter | Behaviour |
|--------|-----------|
| `has:alerts` | Only pages with alertCount > 0; shows count in chip label |
| `orphan` | Only pages with zero inbound edges (no parent page or project contains-edge) |
| `missing:analytics` | Only pages with no analytics node tracking them |
| `type:static/dynamic/template` | Filter by inferred page type |
| `published / draft` | Filter by publication status |

All filters are combinable. A count badge shows `filtered / total`.

### Sorting
Every column header is clickable to sort ascending; click again to sort descending. Null values sort last.

### Row action: Open in graph
Hovering a row reveals a Network icon button. Clicking it navigates to the graph view (`/projects/:id`) with that node pre-selected: the graph opens with `initialSelectedNodeId` set, the node is highlighted, and the Inspector panel (already open by default) shows its details.

### Cross-navigation
- Inventory header has an "Open graph" button to switch to the graph view without focusing a specific node
- Graph page back-navigates to `/projects` (the picker), not the inventory

## UI Requirements
- Hierarchical top-down layout with sub-rows for page hierarchy
- Layer labels (Pages, Apps, Tables, Client Code, Server Code, Packages, Analytics) shown on both sides of the canvas in the lane gutter
- Toolbar contains: layer filter pills, search input, depth toggle (1°/2°), Edge labels toggle, Views dropdown, alert badge, Inspector toggle (PanelRight), zoom controls, fit-to-screen
- Node cards: rounded rectangle with left color border, icon, label, source system tag, alert badge if applicable
- Selection: highlights selected node and its connections at chosen depth; dims all others (opacity 0.12)
- Search match: ring-2 yellow outline on matching nodes
- Alert state: red edge strokes, red badge on node card
- Inspector panel: 288px wide, docked right, scrollable body, divided by section separators
- Edge annotation pills: pill-shaped rect + monospace text at bezier midpoint, colored by edge state
- Dashed separators for page sub-row boundaries; solid separators for type boundaries

## Configuration
- shell: true

## Design Rationale

### Why page hierarchy sub-rows instead of a flat page layer?
A flat page layer loses the parent→child structure that Wix pages actually have (e.g. shop→cart→checkout→thank-you). Sub-rows at reduced vertical gap (44px) communicate hierarchy without breaking the overall top-down flow. Dashed separators distinguish sub-rows from type boundaries visually.

### Why split Code into Client and Server layers?
Client code (page/site scripts) runs in the browser context alongside pages and apps. Server code (backend files, cron jobs, event handlers) runs in a different execution environment, closer to packages and data. Separating them into adjacent layers makes the execution boundary explicit without requiring a separate node type.

### Why add a Package node type?
npm packages are a first-class part of the Wix Velo dependency graph. A backend file that imports `@wix/members` and subscribes to `onMemberCreated` creates a meaningful edge to a package node. Modeling this shows which backend code depends on which Wix platform APIs, and which event hooks are registered — information that has security and observability implications.

### Why is the Inspector always visible?
Having to select a node to discover that the panel exists creates a discoverability problem. An always-open panel with an empty state guides users to click nodes and sets the expectation that selection = inspection, not selection = navigation.

### Why edge annotations as an optional toggle?
Labels on every edge create visual noise that obscures the graph topology — which is the primary information. The toggle lets users read the topology first, then overlay semantic labels when they need to understand relationship types.

### Why Views?
The full graph of a real Wix site can have 30+ nodes. Views let users isolate meaningful subgraphs (the purchase flow, the content pipeline) without losing the context of the full graph. Auto-generated views bootstrap the feature; custom saved views let users capture the views they return to repeatedly.

### Why a separate Inventory Table instead of adding filters to the graph?
Graphs are not auditing tools. For sites with 50+ pages, spatial layout becomes a scanning problem — humans cannot quickly locate a draft page, or all pages missing analytics, by looking at positions on a canvas. A table supports the mental model of "show me all X where Y is true", sorting by risk, and bulk review. The graph answers "how are these things connected?"; the inventory answers "which things exist and what state are they in?". These are different questions that need different interfaces.

### Why derive inventory data from the graph data rather than a separate store?
The graph data (nodes, edges, alerts) is already the source of truth. Deriving inventory rows at render time from that same data keeps the two views in sync automatically — there is no separate inventory data to maintain or synchronize. Computed properties (cluster, depth, dep count, page type) are pure functions of the graph structure.

### Why is the "open in graph" action on a row, not a separate navigation item?
The inventory is a starting point for investigation, not an endpoint. When a row reveals a problem (an orphaned page, a table with an alert, a backend file that hasn't been touched in months), the natural next step is to see its context in the graph. The row action makes that one click, and because the graph opens with the node pre-selected, the transition is immediate — no hunting for the node on the canvas.

---

## Clusters (Collapsible)

### Purpose
Reduce visual complexity in the project graph by aggregating related pages into cluster nodes, enabling progressive disclosure for projects with tens to hundreds of pages.

### Definitions

| Term | Definition |
|------|------------|
| **Cluster** | A synthetic node representing a root page and all its descendants |
| **Member nodes** | The page nodes contained within a cluster |
| **Boundary edges** | Aggregated edges representing connections between a collapsed cluster and external non-page nodes |
| **Bundling** | Collapsing many parallel edges into a single boundary edge with a multiplicity count |

### Clustering rule

**Root-ancestor (ROUTE_PREFIX):** each root page (depth 0, no parent) that has **3 or more total pages** (itself + 2 or more descendants) forms a cluster. A root page with fewer than 3 total pages stays as individual flat nodes.

Cluster ID = `cluster-{rootPageId}`. Membership is deterministic and reproducible for the same graph data.

### Toolbar toggle

A **Clusters** button (Folder / FolderOpen icon) in the toolbar enables and disables clustering mode. Disabling clustering resets all expanded clusters to collapsed.

### Default state (Overview)

When clustering is enabled the graph renders:
- Project root node
- Cluster nodes (collapsed) in the Pages layer
- Singleton root pages and all non-page nodes unchanged
- Boundary edges (dashed) replacing member-level connections
- Cluster summary badges: member count, alert rollup

Individual member pages are not rendered when their cluster is collapsed.

### Cluster node UI

Each cluster card displays:
- **Layers icon** + cluster name (root page label)
- **Member count** — e.g., "12 pages"
- **Alert badge** — aggregate alert count across all members (red, top-right)
- **Expand / collapse chevron** (ChevronRight = collapsed, ChevronDown = expanded)

Cluster cards use indigo styling to visually distinguish them from regular page nodes while keeping the same `NODE_W × NODE_H` dimensions.

### Expand behavior

Clicking the chevron on a cluster card expands it:
- Member pages appear at their normal depth sub-row positions (same layout as unclustered mode)
- Internal page-to-page edges between members are rendered normally
- External boundary edges are replaced by the individual member-level edges
- Expand/collapse is a view projection — underlying graph data is not modified

### Collapse behavior

Clicking the chevron on an expanded cluster collapses it:
- Member pages are removed from the canvas
- The cluster node is restored as the single aggregate card
- Member-level external edges are replaced by boundary edges
- If a member page was selected, selection is cleared

### Boundary edge aggregation

For each external node X, all edges (u → v) where u ∈ cluster(A) and v ∈ X (or vice versa) are aggregated:
- `contains` edges are omitted (structural; layer hierarchy already communicates containment)
- Remaining edges are grouped by (effectiveSource, effectiveTarget)
- The boundary edge renders: dashed stroke, indigo color, a `×N` count pill at the bezier midpoint (or the edge type label when count = 1)
- Alerted boundary edges render in red

### Selection behavior

Selecting a collapsed cluster:
- Highlights the cluster node and all its boundary edges
- Highlights all directly connected external nodes
- The depth toggle (1°/2°) extends the highlight as normal via BFS on effective edges

Selecting a member node within an expanded cluster behaves identically to selecting any regular page node.

### Inspector panel — cluster

When a cluster is selected the Inspector panel shows:

- **Alerts** — aggregate alert count with a message listing how many member pages are affected
- **Connected** — all external nodes reachable via boundary edges, grouped by type (App, Table, Code, Analytics, Package) with individual alert badges
- **Pages** — all member pages listed with a "draft" label if unpublished and an alert icon if alerted

### Search with clustering

If a search query matches a member page inside a collapsed cluster, the cluster node is highlighted (bubble-up). The match count badge reflects both direct matches and cluster bubble-ups.

### Constraints

- A cluster is only created when a root page has **≥ 2 descendants** (3+ total pages); smaller groups remain as flat nodes
- Bundling is on by default when a cluster is collapsed
- Cluster IDs are not stable across graph data changes (they embed the root page ID)
