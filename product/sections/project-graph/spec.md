# Project Graph Specification

## Overview
The Project Graph is the core view of wiXplorer — a hierarchical, layered visualization of all entities in the user's Wix site. Entities are represented as color-coded nodes connected by typed edges that show their relationships. The graph supports free exploration, layer filtering, search, node inspection with drill-down content, saved views, and edge annotation toggling. The layout uses a Sugiyama barycenter algorithm to minimize edge crossings across all layers.

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
