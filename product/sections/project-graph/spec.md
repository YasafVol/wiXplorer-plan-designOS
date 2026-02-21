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
Reduce visual complexity in the project graph by aggregating related nodes into container entities ("clusters"), enabling progressive disclosure, stable navigation, and readable overviews for projects with tens to hundreds of pages.

### Definitions

| Term | Definition |
|------|------------|
| **Cluster** | A container entity representing a set of member nodes grouped by a deterministic rule |
| **Member nodes** | Graph nodes contained within a cluster (typically Pages; optionally other types) |
| **Cluster rule** | The grouping function that assigns nodes to clusters (e.g., route prefix, feature area, owner, template type) |
| **Boundary edges** | Aggregated edges representing connections between a cluster and external nodes or other clusters |
| **Bundling** | Representing many parallel edges as a single boundary edge with a count and optional type rollup |

### Inputs

**Graph data:**
- Node set N with typed nodes (Page, App, Table, Code, Analytics, Package, etc.)
- Edge set E with directed, typed edges

**Cluster rule configuration:**
- Rule type: `ROUTE_PREFIX` | `FEATURE` | `OWNER` | `TEMPLATE` | `SYSTEM`
- Rule parameters (e.g., prefix depth for route-based grouping, owner mapping for team-based grouping)

**Overlay signals (optional):**
- Alert counts and severity per member node
- Traffic metrics (views30d)
- Change timestamps (for "recently modified" rollup)

### Outputs
- Cluster nodes C replacing member nodes in the canvas
- Membership mapping M: N → C
- Aggregated boundary edges E_agg between clusters and/or external singleton nodes
- Cluster summaries: member counts, alert rollups, traffic signals, change indicators

### Default state (Overview)

When clustering is enabled, the initial graph renders:
- Root / global node(s)
- Cluster nodes in collapsed state
- Boundary edges only (bundled)
- Cluster summary badges (member count, alert count, traffic indicator)

Individual member nodes are not rendered in Overview unless explicitly pinned or surfaced via selection.

### Cluster node UI contract

Each cluster node displays:
- Cluster name (derived from the active rule)
- Member count (e.g., "24 pages")
- Optional badges:
  - **Alerts** — aggregate count and max severity across all members
  - **Traffic** — aggregate views or top-rank indicator
  - **Changes** — count of members modified recently
- Expand / collapse control
- Optional "Focus cluster" action

### Expand behavior

Expanding a cluster:
- Renders member nodes within a bounded region associated with the cluster
- Applies a deterministic internal layout for members (grid or hierarchical) independent of the global layout
- Internal edges (between members) are rendered subject to current edge filters
- External connections remain bundled at the cluster boundary unless a specific member is selected
- Does not alter the underlying graph data — expand/collapse is a view projection only

### Collapse behavior

Collapsing a cluster:
- Removes member nodes from the canvas
- Restores the cluster node as a single aggregate representation
- Replaces member-level external edges with boundary edges
- If a member was selected, selection is cleared or re-scoped to the cluster

### Boundary edge aggregation

For each external node or cluster X, all edges (u → v) where u ∈ cluster(A) and v ∈ X are aggregated, grouped by:
- Direction (inbound / outbound)
- Edge type (`hosts`, `reads`, `manages`, etc.)

The boundary edge renders:
- Edge type label (optional, subject to the edge labels toggle)
- Multiplicity count (number of underlying edges)
- Optional rollup metadata (e.g., "reads: 8, writes: 3")

### Selection behavior

Selecting a collapsed cluster highlights:
- Its boundary edges
- Its top external dependencies (ranked by edge multiplicity or signal strength)

Selecting a member node within an expanded cluster:
- Highlights the member's direct neighborhood
- Temporarily unbundles boundary edges relevant to that specific member

### Focus mode

A "Focus cluster" action:
- Zooms and centers the canvas on the cluster region
- Dims all non-cluster content
- Shows a navigation breadcrumb (e.g., Root › Blog)
- Provides a clear exit action ("Back to Overview")

Focus mode is a view state; it does not modify cluster membership.

### Rule switching

Users may switch the active cluster rule (e.g., Route Prefix → Feature Area). On rule switch:
- Cluster nodes and membership mapping are recomputed
- The view attempts to preserve: selected node (by stable node id), pinned nodes/views, camera position (best-effort)
- Saved views reference underlying node ids, not cluster ids, so they remain stable across rule changes

### Constraints

- Maximum **12 clusters** in Overview; excess clusters collapse into an "Other" cluster or require user filtering
- Maximum **2 nesting levels** (cluster → subcluster) to prevent deep hierarchy complexity
- Bundling is on by default to prevent edge explosion on large clusters
- Cluster membership must be deterministic and reproducible for the same rule and graph data
