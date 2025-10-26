# Map Page Database Integration Plan

## Goal
Integrate the Location Map page with live database data from branches, NVRs, and cameras.

## Required Data Structure

Each location (branch) should have:
```javascript
{
  id: branch.id,
  name: branch.name,
  region: region.name,
  address: branch.address,
  coordinates: [lat, lng],
  status: 'online' | 'offline' | 'warning' | 'maintenance',
  nvrs: number,
  cameras: number,
  branch_type: branch.branch_type,
  nvrStatus: { online: number, offline: number, warning: number },
  cameraStatus: { online: number, offline: number, warning: number }
}
```

## Implementation Steps

### 1. Update Map Controller
- Fetch all branches with their region
- For each branch, count NVRs and cameras
- Calculate overall status based on device statuses
- Aggregate device status counts

### 2. Data Transformation
- Parse coordinates from branch.coordinates (JSON string)
- Calculate overall branch status logic:
  - If any offline devices → 'offline' or 'warning'
  - If all online → 'online'
  - If mixed → 'warning'

### 3. Statistics Calculation
```javascript
summary: {
  total: number of branches,
  online: branches with all devices online,
  offline: branches with all devices offline,
  warning: branches with mixed status,
  totalNVRs: sum of all NVRs,
  totalCameras: sum of all cameras
}
```

### 4. Update View
- Pass `locations` array and `summary` to template
- Use `stringify` filter to pass data to JavaScript

### 5. Update Frontend JavaScript
- Use server-rendered data (`window.mapDataFromServer`)
- Fallback to mock data if server data unavailable

## Status Logic

For each branch:
- **online**: All NVRs and cameras are online
- **offline**: All NVRs are offline (cameras don't matter)
- **warning**: Mixed status or some devices in maintenance

## Database Query

```sql
SELECT 
  b.id, b.name, b.address, b.coordinates, b.branch_type,
  r.name as region_name,
  COUNT(DISTINCT n.id) as nvr_count,
  COUNT(DISTINCT c.id) as camera_count,
  SUM(CASE WHEN n.status = 'online' THEN 1 ELSE 0 END) as online_nvrs,
  SUM(CASE WHEN n.status = 'offline' THEN 1 ELSE 0 END) as offline_nvrs,
  SUM(CASE WHEN n.status = 'warning' THEN 1 ELSE 0 END) as warning_nvrs,
  SUM(CASE WHEN c.status = 'online' THEN 1 ELSE 0 END) as online_cameras,
  SUM(CASE WHEN c.status = 'offline' THEN 1 ELSE 0 END) as offline_cameras
FROM branches b
LEFT JOIN regions r ON b.region_id = r.id
LEFT JOIN nvrs n ON b.id = n.branch_id AND n.is_active = true
LEFT JOIN cameras c ON b.id = c.branch_id
GROUP BY b.id, r.name
```

## Testing Checklist
- [ ] All branches appear on map with correct coordinates
- [ ] Statistics show correct counts (total, online, offline, warning)
- [ ] Status colors match branch device statuses
- [ ] Filters work (region, status)
- [ ] Location list in sidebar shows all branches
- [ ] Clicking a location centers map on it
- [ ] Clicking "View NVRs" redirects with location filter
- [ ] Clicking "View Cameras" redirects with location filter
