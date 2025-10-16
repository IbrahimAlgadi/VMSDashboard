# CCTV Dashboard UI Tasks

Tasks split into manageable JSON files organized by feature groups.

## File Structure

| File | Tasks | Description |
|------|-------|-------------|
| `00-project-info.json` | - | Project metadata & execution order |
| `01-foundation.json` | task-01 | Express + Nunjucks setup, base layout |
| `02-layout-components.json` | task-02 to 04 | Navbar, sidebar, footer |
| `03-dashboard.json` | task-05 to 07 | Main dashboard with KPIs, charts, alerts |
| `04-nvr-management.json` | task-08 to 10 | NVR management pages & modals |
| `05-camera-management.json` | task-11 to 12 | Camera management pages |
| `06-map.json` | task-13 to 14 | Leaflet map integration |
| `07-monitoring-dashboards.json` | task-15 to 17 | Compliance, security, analytics |
| `08-alerts-reports.json` | task-18 to 19 | Alerts & reports pages |
| `09-settings-profile.json` | task-20 to 22 | Settings & user profile |
| `10-authentication.json` | task-23 | Login page |
| `11-enhancements.json` | task-24 to 27 | Theme, responsive, loading, toasts |
| `12-final-touches.json` | task-28 to 30 | Error pages, docs, automation tests |

## Execution Order

1. **Foundation** → task-01
2. **Layout Components** → task-02, 03, 04 (parallel)
3. **Dashboard** → task-05 → 06 → 07 (sequential)
4. **NVR Management** → task-08 → 09 → 10 (sequential)
5. **Camera Management** → task-11 → 12 (sequential)
6. **Map** → task-13 → 14 (sequential)
7. **Monitoring Dashboards** → task-15, 16, 17 (parallel)
8. **Management Pages** → task-18, 19 (parallel)
9. **Settings & Profile** → task-20 → 21, task-22 (parallel)
10. **Authentication** → task-23
11. **Enhancements** → task-24, 25, 26, 27 (parallel)
12. **Final Touches** → task-28, 29 (parallel) → task-30

## Quick Start

```bash
# View project info
cat tasks/00-project-info.json | jq

# View specific task group
cat tasks/03-dashboard.json | jq

# Extract specific task
cat tasks/03-dashboard.json | jq '.tasks["task-05"]'
```

## Notes

- All tasks use mock JSON data (no APIs)
- Express + Nunjucks for templating
- Bootstrap 5.3 + vanilla JS
- Playwright for browser automation
- UI/UX focus only

