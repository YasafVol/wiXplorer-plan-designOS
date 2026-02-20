# Project Graph Specification

## Overview
The Project Graph is the core view of wiXplorer — a hierarchical, top-down visualization of all entities in the user's Wix site. Entities (Pages, Apps, Tables, Code Files, and Analytics) are represented as color-coded nodes with icons, connected by edges that show their relationships. Users can explore the graph freely, filter layers, search for specific nodes, and open entity details.

## User Flows
- User views the full project graph with a root project node at the top, pages in the second layer, and apps/tables/code files branching below
- User single-clicks a node to highlight it and visually emphasize all its directly connected edges and neighbor nodes
- User double-clicks a node to open the Entity Detail drawer for that entity
- User toggles layer filter buttons in the toolbar to show or hide specific entity types (Pages, Apps, Tables, Code, Analytics)
- User zooms and pans the graph canvas to navigate large projects
- User types in the search input to highlight a matching node and scroll it into view
- User clicks the "fit to screen" button to auto-fit all visible nodes into the viewport
- Nodes with active monitoring alerts display a red badge; edges connected to alerted nodes are also highlighted in red

## UI Requirements
- Hierarchical top-down layout: root project node at top, pages in the next layer, dependent entities below
- Each entity type has a distinct color and icon inside the node (rounded rectangle shape)
- Entity type color legend: Page = indigo, App = cyan, Table = emerald, Code = violet, Analytics = amber
- Layer filter toolbar above the graph canvas with a pill toggle per entity type, each pill uses its entity color
- Single-click selection highlights the node and its direct connections, dims everything else
- Double-click opens the Entity Detail drawer (no navigation away from the graph)
- Zoom and pan via mouse wheel and drag
- Search input that highlights matching nodes by label
- "Fit to screen" button that resets the viewport to show all nodes
- Alert badge (red dot with count) on any node with active monitoring alerts
- Edges connected to alerted nodes are rendered in red instead of the default edge color
- Graph canvas fills the full content area inside the app shell

## Configuration
- shell: true
