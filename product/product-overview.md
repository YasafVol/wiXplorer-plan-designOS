# wiXplorer

## Description
wiXplorer is a layered project exploration tool for Wix sites that visualizes the relationships between pages, installed apps, data tables, and user code in a unified interactive graph. It gives developers and internal teams a complete, navigable map of a project's structure — from the page layer down through apps, data, and code.

## Problems & Solutions

### Problem 1: No unified view of a project's complexity
Wix projects span multiple systems — DM, Dev Center, CMS, Velo — with no single place to see how they connect. wiXplorer aggregates all layers into one graph, making the full structure visible at a glance.

### Problem 2: Hard to trace relationships across layers
It's difficult to know which apps a page hosts, which tables feed which apps, or which code files depend on each other. wiXplorer draws these connections explicitly so developers can trace any entity's relationships instantly.

### Problem 3: Monitoring issues are disconnected from context
Errors and alerts surface in isolation, without showing which page, app, or code file they belong to. wiXplorer surfaces monitoring signals directly on the relevant nodes in the graph.

### Problem 4: No page-level narrative or summary
There's no easy way to generate a plain-language summary of what a page does — its apps, data, code, and flows. wiXplorer's Page Notebook creates structured, readable summaries per page.

## Key Features
- Interactive layered graph with color-coded entity nodes (Pages, Apps, Tables, Code, Analytics, Monitoring)
- Root/global project node connecting all site-wide entities
- Entity detail drawer with source-specific metadata for each node
- List/table view for browsing entities by type
- Layer filter controls to show/hide entity types in the graph
- Health monitor dashboard surfacing alerts and errors in context
- Page Notebook — per-page summaries with optional text-to-speech readout
