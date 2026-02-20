# Data Shape

## Entities

### Project
The root entity representing the entire Wix site. Acts as the global node in the graph — all site-wide apps and all pages connect to it.

### Page
A single web page or route on the user's site. The primary entity in the graph, sourced from DM. Pages can host apps, connect to tables, and contain user code.

### App
An installed application on the site, sourced from Dev Center. Apps can be installed at the site level (global) or scoped to specific pages, and may manage their own data tables.

### Table
A CMS data collection with a defined schema, sourced from CMS. Tables are connected to apps that manage them and to pages that consume or display their data.

### CodeFile
A user-authored code file, sourced from Velo. Code files are associated with pages or elements, may depend on other code files, and include automations, CRON jobs, and event handlers.

### Alert
A monitoring signal or error event sourced from the Monitoring system. Alerts are attached to a specific entity (Page, App, or CodeFile) and indicate a health or runtime issue.

### AnalyticsSnapshot
A snapshot of analytics data for a page, sourced from Analytics. Represents metrics such as views, sessions, and events for a given time window.

## Relationships

- Project has many Pages
- Project has many Apps (site-level installations)
- Page hosts many Apps
- App manages many Tables
- Page connects to many Tables
- Page contains many CodeFiles
- CodeFile depends on many CodeFiles
- Alert belongs to one Page, App, or CodeFile
- AnalyticsSnapshot belongs to one Page
