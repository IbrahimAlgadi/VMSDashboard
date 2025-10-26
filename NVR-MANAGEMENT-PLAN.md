# NVR Management Page - Database Integration Plan

## Overview
Integrate the NVR Management page with the live PostgreSQL database to display real NVR data instead of mock data.

## Current Status
- ✅ Controller is already using Sequelize queries with fallback to mock data
- ❌ Frontend JavaScript is loading data from `/data/mock/nvrs.json`
- ❌ Server data is not being passed to frontend
- ❌ Frontend expects different data structure than database provides

## Issues to Fix

### 1. Data Structure Mismatch
**Problem:** Database returns Sequelize objects with fields like `device_name`, but frontend expects:
```javascript
{
  id, name, location, ipAddress, status, uptime, cameras, storage, lastSeen, branch
}
```

**Database fields:** `device_name`, `ip_address`, `status`, `uptime_percent`, `current_cameras`, etc.

### 2. Server-to-Client Data Transfer
**Problem:** Frontend loads from `/data/mock/nvrs.json` instead of server-rendered data.

**Solution:** Pass NVR data through Nunjucks template like we did for dashboard:
```nunjucks
{% block extra_js %}
<script>
  window.nvrDataFromServer = {{ nvrs | stringify | safe }};
</script>
<script src="/js/pages/nvr-management.js"></script>
{% endblock %}
```

### 3. Statistics Calculation
**Problem:** Frontend expects pre-calculated statistics in `summary` object.

**Solution:** Calculate in controller or calculate on frontend from NVR array.

### 4. Missing Fields
**Problem:** Database doesn't have all fields frontend expects:
- `storage` (percent, used, total)
- `lastSeen` → `last_seen` (exists but may need formatting)
- `location` → need to get from `branch.name`

## Implementation Plan

### Step 1: Update Controller to Transform Data
Transform database results to match frontend expectations:

```javascript
// In nvr.controller.js
async showNVRManagement(req, res) {
  try {
    const nvrs = await NVR.findAll({
      include: [{ model: Branch, as: 'branch', attributes: ['id', 'name'] }],
      where: { is_active: true },
      order: [['device_name', 'ASC']]
    }).catch(() => []);

    // Transform database results to frontend format
    const transformedNVRs = nvrs.map(nvr => ({
      id: nvr.id,
      name: nvr.device_name,
      location: nvr.branch?.name || 'Unknown',
      ipAddress: nvr.ip_address,
      status: nvr.status || 'offline',
      uptime: parseFloat(nvr.uptime_percent) || 0,
      cameras: {
        current: nvr.current_cameras || 0,
        max: nvr.max_cameras || 16
      },
      storage: {
        percent: 0, // TODO: Calculate from actual storage data
        used: '0 GB',
        total: '0 GB'
      },
      lastSeen: nvr.last_seen ? new Date(nvr.last_seen).toISOString() : null,
      branch: {
        id: nvr.branch_id,
        name: nvr.branch?.name || 'Unknown'
      }
    }));

    // Calculate statistics
    const summary = {
      total: transformedNVRs.length,
      online: transformedNVRs.filter(n => n.status === 'online').length,
      offline: transformedNVRs.filter(n => n.status === 'offline').length,
      warning: transformedNVRs.filter(n => n.status === 'warning').length
    };

    res.render('nvr-management', {
      title: 'NVR Management',
      currentPage: 'nvr-management',
      nvrs: transformedNVRs,
      summary: summary
    });
  } catch (error) {
    console.error('Error loading NVRs:', error);
    res.render('nvr-management', {
      title: 'NVR Management',
      currentPage: 'nvr-management',
      nvrs: MOCK_DATA.nvrs.nvrs || [],
      summary: MOCK_DATA.nvrs.summary || { total: 0, online: 0, offline: 0, warning: 0 }
    });
  }
}
```

### Step 2: Update Nunjucks Template
Add server-side data passing:

```nunjucks
{% block extra_js %}
<script>
  // Pass server-rendered data to JavaScript
  window.nvrDataFromServer = {
    nvrs: {{ nvrs | stringify | safe }},
    summary: {{ summary | stringify | safe }}
  };
</script>
<script src="/js/pages/nvr-management.js"></script>
{% endblock %}
```

### Step 3: Update Frontend JavaScript
Modify to use server data:

```javascript
async loadData() {
  try {
    document.getElementById('loading-state').style.display = 'block';
    
    // Use server-rendered data if available, otherwise use mock
    if (window.nvrDataFromServer) {
      this.data = {
        nvrs: window.nvrDataFromServer.nvrs,
        summary: window.nvrDataFromServer.summary
      };
    } else {
      // Fallback to mock data
      const response = await fetch('/data/mock/nvrs.json');
      this.data = await response.json();
    }
    
    this.filteredData = this.data.nvrs;
    return this.data;
  } catch (error) {
    console.error('Error loading NVR data:', error);
    this.showError();
  } finally {
    document.getElementById('loading-state').style.display = 'none';
  }
}
```

## Expected Results

After implementation:
- ✅ NVR table displays all 41 NVRs from database
- ✅ Statistics show correct counts (online, offline, warning)
- ✅ Search and filters work with database data
- ✅ NVR details show real information from database
- ✅ Modal popup shows correct NVR information

## Testing Checklist

- [ ] Load NVR management page
- [ ] Verify statistics match database counts
- [ ] Verify table shows all NVRs
- [ ] Test search functionality
- [ ] Test status filter
- [ ] Test location/branch filter
- [ ] Click on NVR to view details modal
- [ ] Verify all NVR information displays correctly

## Next Steps After NVR Management

1. Camera Management page (similar approach)
2. Map page (load branch/camera locations)
3. Alerts page (load real alerts from database)
4. Compliance, Security, Analytics pages
