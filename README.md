# wiXplorer

**Project Graph Explorer** — an interactive tool for visualizing and navigating the structure of web projects as graphs.

## What it does

wiXplorer lets you load a web project and explore its pages, apps, tables, and code as an interactive graph. You can:

- **Graph view** — Visualize project structure as nodes and edges, with layer filtering, search, and node selection
- **Inventory view** — Browse project assets in a tabular format with multi-tab filtering (Pages, Apps, Tables, Code) and sorting
- **Clusters** — Automatically groups related pages into collapsible clusters for easier navigation

## Getting started

```bash
npm install
npm run dev
```

The app opens at `http://localhost:5173/`. Select a sample project from the landing page to start exploring.

## Routes

| Path | Description |
|------|-------------|
| `/` | Projects hub — pick a project to explore |
| `/projects/:projectId` | Interactive graph view |
| `/projects/:projectId/inventory` | Tabular inventory view |

## Built with

- React 19 + TypeScript
- Tailwind CSS v4
- React Router v7
- Vite

## Design OS

This project was designed and planned using [Design OS](https://buildermethods.com/design-os). The Design OS planning interface is available at `/design-os` within the running app.
