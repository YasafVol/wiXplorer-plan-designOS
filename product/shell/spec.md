# Application Shell Specification

## Overview
wiXplorer uses a persistent left sidebar layout. The sidebar provides the primary navigation, site context, and user identity at all times. The main content area to the right fills the remaining viewport and renders whichever section is active.

## Navigation Structure
- **Project Graph** → `/graph` (default/home view)
- **List Explorer** → `/list`
- **Health Monitor** → `/health` (shows alert badge with active issue count)
- **Page Notebook** → `/notebook`

## Site Selector
Located at the top of the sidebar, below the logo. Displays the currently active Wix site name and a chevron to open a dropdown for switching between projects.

## User Menu
Located at the bottom of the sidebar. Shows user avatar (or initials fallback), display name, and a dropdown with account settings and logout.

## Layout Pattern
Fixed-width left sidebar (240px desktop) with a scrollable main content area. The sidebar is fixed/sticky — it does not scroll with content.

## Responsive Behavior
- **Desktop (lg+):** Full sidebar visible with labels, 240px wide
- **Tablet (md):** Icon-only sidebar, 64px wide — labels hidden, tooltips on hover
- **Mobile (sm and below):** Sidebar hidden by default; a hamburger button in a top bar reveals a full-width drawer overlay

## Design Notes
- Active nav item: indigo-600 text + indigo-100 background (light) / indigo-500 text + indigo-900/50 background (dark)
- Health Monitor nav item shows a red badge with active alert count when alerts > 0
- Site selector uses a subtle card style — site name bold, domain subdued below it
- Sidebar background: white (light) / slate-900 (dark)
- Border: 1px slate-200 (light) / slate-800 (dark) on the right edge
- Typography: Space Grotesk for nav labels and logo, Inter for metadata text
