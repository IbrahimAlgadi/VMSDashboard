// Map Page JavaScript

let mapComponent;
let locations = [];
let filteredLocations = [];
let sidebar;
let nvrToBranchMap = {}; // Map NVR ID to branch ID
let cameraToBranchMap = {}; // Map Camera ID to branch ID

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSidebar();
  initControls();
  loadLocations();
  initRealtimeUpdates();
});

// Initialize map
function initMap() {
  mapComponent = new MapComponent('map', {
    center: [24.7136, 46.6753], // Riyadh center
    zoom: 6
  });

  mapComponent.init();

  // Override marker click handler
  mapComponent.onMarkerClick = (location) => {
    highlightLocationInList(location.id);
  };
}

// Initialize sidebar
function initSidebar() {
  sidebar = new bootstrap.Offcanvas(document.getElementById('mapSidebar'));

  // Toggle sidebar button
  document.getElementById('toggleSidebar').addEventListener('click', () => {
    sidebar.toggle();
  });

  // Filters
  document.getElementById('searchLocations').addEventListener('input', applyFilters);
  document.getElementById('filterRegion').addEventListener('change', applyFilters);
  document.getElementById('filterStatus').addEventListener('change', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', clearFilters);
}

// Initialize controls
function initControls() {
  // Layer buttons
  document.querySelectorAll('[data-layer]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const layer = e.currentTarget.dataset.layer;
      switchLayer(layer);
      
      // Update active state
      document.querySelectorAll('[data-layer]').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });

  // Center map button
  document.getElementById('centerMap').addEventListener('click', () => {
    mapComponent.fitBounds();
  });
}

// Load locations data
async function loadLocations() {
  try {
    // Use server-rendered data if available, otherwise use mock
    let data;
    if (window.mapDataFromServer) {
      data = {
        locations: window.mapDataFromServer.locations,
        summary: window.mapDataFromServer.summary
      };
    } else {
      // Fallback to mock data
      const response = await fetch('/data/mock/locations.json');
      data = await response.json();
    }

    locations = data.locations;
    filteredLocations = [...locations];

    // Build NVR and Camera to Branch mapping (async, don't wait)
    buildLocationMappings();

    // Update statistics
    updateStatistics(data.summary);

    // Clear existing markers before adding new ones (prevents duplicates on reload)
    if (mapComponent && typeof mapComponent.clearMarkers === 'function') {
      mapComponent.clearMarkers();
    }

    // Add markers to map
    locations.forEach(location => {
      mapComponent.addMarker(location);
    });

    // Fit bounds to show all markers
    mapComponent.fitBounds();

    // Render location list
    renderLocationList();

  } catch (error) {
    console.error('Failed to load locations:', error);
  }
}

// Update statistics
function updateStatistics(summary) {
  document.getElementById('totalLocations').textContent = summary.total;
  document.getElementById('onlineLocations').textContent = summary.online;
  document.getElementById('offlineLocations').textContent = summary.offline;
  document.getElementById('warningLocations').textContent = summary.warning || summary.maintenance || 0;
}

// Switch map layer
function switchLayer(layerName) {
  mapComponent.switchLayer(layerName);
}

// Apply filters
function applyFilters() {
  const searchTerm = document.getElementById('searchLocations').value.toLowerCase();
  const regionFilter = document.getElementById('filterRegion').value;
  const statusFilter = document.getElementById('filterStatus').value;

  filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm) ||
                         location.address.toLowerCase().includes(searchTerm);
    const matchesRegion = !regionFilter || location.region === regionFilter;
    const matchesStatus = !statusFilter || location.status === statusFilter;

    return matchesSearch && matchesRegion && matchesStatus;
  });

  renderLocationList();
}

// Clear filters
function clearFilters() {
  document.getElementById('searchLocations').value = '';
  document.getElementById('filterRegion').value = '';
  document.getElementById('filterStatus').value = '';
  applyFilters();
}

// Render location list in sidebar
function renderLocationList() {
  const listContainer = document.getElementById('locationList');

  if (filteredLocations.length === 0) {
    listContainer.innerHTML = `
      <div class="location-list-empty">
        <i class="bi bi-inbox"></i>
        <p>No locations found</p>
      </div>
    `;
    return;
  }

  listContainer.innerHTML = filteredLocations.map(location => {
    const statusColors = {
      online: 'success',
      offline: 'danger',
      warning: 'warning',
      maintenance: 'warning'
    };

    return `
      <div class="location-item" data-location-id="${location.id}" onclick="selectLocation(${location.id})">
        <div class="location-header">
          <h6 class="location-name">${location.name}</h6>
          <div class="location-status">
            <i class="bi bi-circle-fill text-${statusColors[location.status]}"></i>
            <span>${location.status}</span>
          </div>
        </div>
        <div class="location-info">
          <div><i class="bi bi-geo-alt"></i>${location.region} - ${location.branch_type}</div>
          <div><i class="bi bi-building"></i>${location.address}</div>
        </div>
        <div class="location-stats">
          <div class="stat">
            <i class="bi bi-hdd"></i>
            <span>NVRs: <strong>${location.nvrs}</strong></span>
          </div>
          <div class="stat">
            <i class="bi bi-camera-video"></i>
            <span>Cameras: <strong>${location.cameras}</strong></span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Select location from list
function selectLocation(locationId) {
  const location = locations.find(l => l.id === locationId);
  if (location) {
    // Center map on location and open popup
    mapComponent.openMarker(locationId);
    
    // Highlight in list
    highlightLocationInList(locationId);

    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      sidebar.hide();
    }
  }
}

// Highlight location in list
function highlightLocationInList(locationId) {
  document.querySelectorAll('.location-item').forEach(item => {
    item.classList.remove('active');
  });

  const item = document.querySelector(`[data-location-id="${locationId}"]`);
  if (item) {
    item.classList.add('active');
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// View location details (called from popup)
function viewLocationDetails(locationId) {
  const location = locations.find(l => l.id === locationId);
  if (location) {
    // Navigate to location details page or show modal
    window.location.href = `/nvr-management?location=${location.name}`;
  }
}

// View location cameras (called from popup)
function viewLocationCameras(locationId) {
  const location = locations.find(l => l.id === locationId);
  if (location) {
    // Navigate to cameras page filtered by location
    window.location.href = `/camera-management?location=${location.name}`;
  }
}

// Handle window resize
window.addEventListener('resize', () => {
  if (mapComponent) {
    mapComponent.resize();
  }
});

// Build mappings from NVR/Camera IDs to branch IDs
async function buildLocationMappings() {
  nvrToBranchMap = {};
  cameraToBranchMap = {};
  
  try {
    // Fetch NVR and camera data to build mappings
    const [nvrsResponse, camerasResponse] = await Promise.all([
      fetch('/api/nvrs').catch(() => ({ json: () => ({ nvrs: [] }) })),
      fetch('/api/cameras').catch(() => ({ json: () => ({ cameras: [] }) }))
    ]);

    const nvrsData = await nvrsResponse.json();
    const camerasData = await camerasResponse.json();
    
    const nvrs = nvrsData.data || nvrsData.nvrs || [];
    const cameras = camerasData.data || camerasData.cameras || [];

    // Build NVR to branch mapping
    nvrs.forEach(nvr => {
      if (nvr.branch_id) {
        nvrToBranchMap[nvr.id] = nvr.branch_id;
      }
    });

    // Build Camera to branch mapping
    cameras.forEach(camera => {
      if (camera.branch_id) {
        cameraToBranchMap[camera.id] = camera.branch_id;
      }
    });

    console.log('🗺️ Built location mappings:', {
      nvrs: Object.keys(nvrToBranchMap).length,
      cameras: Object.keys(cameraToBranchMap).length
    });
  } catch (error) {
    console.error('Error building location mappings:', error);
  }
}

// Initialize real-time updates
function initRealtimeUpdates() {
  // Wait for RealtimeManager to be ready
  if (typeof RealtimeManager === 'undefined') {
    setTimeout(initRealtimeUpdates, 100);
    return;
  }

  // Reload data when WebSocket reconnects
  EventBus.on('websocket:registered', () => {
    console.log('🔄 WebSocket reconnected, reloading map data...');
    loadLocations();
  });

  // Subscribe to NVR status changes
  RealtimeManager.on('nvr:status:changed', (data) => {
    handleNVRStatusChange(data);
  });

  // Subscribe to camera status changes
  RealtimeManager.on('camera:status:changed', (data) => {
    handleCameraStatusChange(data);
  });

  // Subscribe to stats updates
  RealtimeManager.on('stats:updated', (summary) => {
    // Could update overall statistics if needed
  });

  console.log('✓ Map real-time updates initialized');
}

// Handle NVR status change
function handleNVRStatusChange(data) {
  if (!data) return;
  
  const nvrId = data.nvrId || data.nvr_id;
  if (!nvrId) return;

  console.log('🗺️ NVR status change on map:', nvrId, data.status || data.new_status);

  // Try to get branch_id from message data first
  let branchId = data.branch_id || null;

  // Try to get branch_id from StateManager
  if (!branchId && typeof StateManager !== 'undefined') {
    const nvr = StateManager.getNVR(nvrId);
    if (nvr && nvr.branch_id) {
      branchId = nvr.branch_id;
    }
  }

  // Fallback to mapping
  if (!branchId) {
    branchId = nvrToBranchMap[nvrId];
  }

  if (branchId) {
    // Update only the affected location
    updateLocationStatus(branchId);
  } else {
    // If mapping not found, try to rebuild mappings and update all locations (fallback)
    console.warn('NVR to branch mapping not found, rebuilding mappings...');
    buildLocationMappings().then(() => {
      const newBranchId = nvrToBranchMap[nvrId];
      if (newBranchId) {
        updateLocationStatus(newBranchId);
      } else {
        updateLocationStatuses();
      }
    });
  }
}

// Handle camera status change
function handleCameraStatusChange(data) {
  if (!data) return;
  
  const cameraId = data.cameraId || data.camera_id;
  if (!cameraId) return;

  console.log('🗺️ Camera status change on map:', cameraId, data.newStatus);

  // Try to get branch_id from message data first
  let branchId = data.branch_id || null;

  // Try to get branch_id from StateManager
  if (!branchId && typeof StateManager !== 'undefined') {
    const camera = StateManager.getCamera(cameraId);
    if (camera && camera.branch_id) {
      branchId = camera.branch_id;
    }
  }

  // Fallback to mapping
  if (!branchId) {
    branchId = cameraToBranchMap[cameraId];
  }

  if (branchId) {
    // Update only the affected location
    updateLocationStatus(branchId);
  } else {
    // If mapping not found, try to rebuild mappings and update all locations (fallback)
    console.warn('Camera to branch mapping not found, rebuilding mappings...');
    buildLocationMappings().then(() => {
      const newBranchId = cameraToBranchMap[cameraId];
      if (newBranchId) {
        updateLocationStatus(newBranchId);
      } else {
        updateLocationStatuses();
      }
    });
  }
}

// Update status for a specific location
async function updateLocationStatus(branchId) {
  try {
    const location = locations.find(l => l.id === branchId);
    if (!location) {
      console.warn('Location not found for branch ID:', branchId);
      return;
    }

    // Fetch NVRs and cameras for this branch
    const [nvrsResponse, camerasResponse] = await Promise.all([
      fetch(`/api/nvrs?branch_id=${branchId}`).catch(() => ({ json: () => ({ data: [] }) })),
      fetch(`/api/cameras?branch_id=${branchId}`).catch(() => ({ json: () => ({ data: [] }) }))
    ]);

    const nvrsData = await nvrsResponse.json();
    const camerasData = await camerasResponse.json();
    
    const locationNVRs = nvrsData.data || nvrsData.nvrs || [];
    const locationCameras = camerasData.data || camerasData.cameras || [];

    // Calculate NVR status counts
    const nvrStatus = {
      online: locationNVRs.filter(n => n.status === 'online').length,
      offline: locationNVRs.filter(n => n.status === 'offline').length,
      warning: locationNVRs.filter(n => n.status === 'warning').length
    };

    // Calculate Camera status counts
    const cameraStatus = {
      online: locationCameras.filter(c => c.status === 'online').length,
      offline: locationCameras.filter(c => c.status === 'offline').length,
      warning: locationCameras.filter(c => c.status === 'warning').length
    };

    // Determine overall branch status
    let newStatus = 'online';
    if (nvrStatus.offline === locationNVRs.length && locationNVRs.length > 0) {
      newStatus = 'offline';
    } else if (nvrStatus.warning > 0 || cameraStatus.offline > 0) {
      newStatus = 'warning';
    }

    // Update location
    const oldStatus = location.status;
    location.status = newStatus;
    location.nvrStatus = nvrStatus;
    location.cameraStatus = cameraStatus;
    location.nvrs = locationNVRs.length;
    location.cameras = locationCameras.length;

    if (oldStatus !== newStatus) {
      console.log(`🗺️ Location ${location.name} status: ${oldStatus} → ${newStatus}`);
      updateLocationMarker(location);
      updateLocationInList(location);
    } else {
      // Update counts even if status didn't change
      updateLocationMarkerPopup(location);
      updateLocationInList(location);
    }

    // Recalculate and update statistics
    const summary = {
      total: locations.length,
      online: locations.filter(l => l.status === 'online').length,
      offline: locations.filter(l => l.status === 'offline').length,
      warning: locations.filter(l => l.status === 'warning').length
    };
    updateStatistics(summary);

  } catch (error) {
    console.error('Error updating location status:', error);
  }
}

// Update location statuses based on current NVR and camera data
async function updateLocationStatuses() {
  try {
    // Fetch current NVR and camera data from API
    const [nvrsResponse, camerasResponse] = await Promise.all([
      fetch('/api/nvrs').catch(() => ({ json: () => ({ nvrs: [] }) })),
      fetch('/api/cameras').catch(() => ({ json: () => ({ cameras: [] }) }))
    ]);

    const nvrsData = await nvrsResponse.json();
    const camerasData = await camerasResponse.json();
    
    const nvrs = nvrsData.data || nvrsData.nvrs || [];
    const cameras = camerasData.data || camerasData.cameras || [];

    // Group NVRs and cameras by branch_id
    const branchNVRs = {};
    const branchCameras = {};

    nvrs.forEach(nvr => {
      if (nvr.branch_id) {
        if (!branchNVRs[nvr.branch_id]) {
          branchNVRs[nvr.branch_id] = [];
        }
        branchNVRs[nvr.branch_id].push(nvr);
      }
    });

    cameras.forEach(camera => {
      if (camera.branch_id) {
        if (!branchCameras[camera.branch_id]) {
          branchCameras[camera.branch_id] = [];
        }
        branchCameras[camera.branch_id].push(camera);
      }
    });

    // Update each location
    locations.forEach(location => {
      const branchId = location.id;
      const locationNVRs = branchNVRs[branchId] || [];
      const locationCameras = branchCameras[branchId] || [];

      // Calculate NVR status counts
      const nvrStatus = {
        online: locationNVRs.filter(n => n.status === 'online').length,
        offline: locationNVRs.filter(n => n.status === 'offline').length,
        warning: locationNVRs.filter(n => n.status === 'warning').length
      };

      // Calculate Camera status counts
      const cameraStatus = {
        online: locationCameras.filter(c => c.status === 'online').length,
        offline: locationCameras.filter(c => c.status === 'offline').length,
        warning: locationCameras.filter(c => c.status === 'warning').length
      };

      // Determine overall branch status
      let newStatus = 'online';
      if (nvrStatus.offline === locationNVRs.length && locationNVRs.length > 0) {
        newStatus = 'offline';
      } else if (nvrStatus.warning > 0 || cameraStatus.offline > 0) {
        newStatus = 'warning';
      }

      // Update location if status changed
      if (location.status !== newStatus) {
        const oldStatus = location.status;
        location.status = newStatus;
        location.nvrStatus = nvrStatus;
        location.cameraStatus = cameraStatus;
        location.nvrs = locationNVRs.length;
        location.cameras = locationCameras.length;

        console.log(`🗺️ Location ${location.name} status: ${oldStatus} → ${newStatus}`);

        // Update marker
        updateLocationMarker(location);

        // Update location list
        updateLocationInList(location);
      } else {
        // Update counts even if status didn't change
        location.nvrStatus = nvrStatus;
        location.cameraStatus = cameraStatus;
        location.nvrs = locationNVRs.length;
        location.cameras = locationCameras.length;

        // Update marker popup
        updateLocationMarkerPopup(location);
      }
    });

    // Recalculate and update statistics
    const summary = {
      total: locations.length,
      online: locations.filter(l => l.status === 'online').length,
      offline: locations.filter(l => l.status === 'offline').length,
      warning: locations.filter(l => l.status === 'warning').length
    };
    updateStatistics(summary);

  } catch (error) {
    console.error('Error updating location statuses:', error);
  }
}

// Update location marker on map
function updateLocationMarker(location) {
  if (!mapComponent || !mapComponent.markers) return;

  const marker = mapComponent.markers[location.id];
  if (!marker) {
    console.warn('Marker not found for location:', location.id);
    return;
  }

  // Update marker icon
  const newIcon = mapComponent.createMarkerIcon(location.status);
  marker.setIcon(newIcon);

  // Update popup content
  mapComponent.updateMarkerPopup(location.id, location);

  // Update layers (remove from old layer, add to new layer)
  const oldStatus = marker._oldStatus || location.status;
  if (oldStatus !== location.status) {
    // Remove from old status layer
    if (mapComponent.layers[oldStatus]) {
      mapComponent.layers[oldStatus].removeLayer(marker);
    }
    
    // Add to new status layer
    if (mapComponent.layers[location.status]) {
      mapComponent.layers[location.status].addLayer(marker);
    }
    
    // Update stored status
    marker._oldStatus = location.status;
    
    // If current layer is filtered, update cluster group
    if (mapComponent.currentLayer !== 'all') {
      mapComponent.switchLayer(mapComponent.currentLayer);
    }
  }

  console.log('✅ Updated marker for location:', location.name);
}

// Update location marker popup only
function updateLocationMarkerPopup(location) {
  if (!mapComponent) return;
  mapComponent.updateMarkerPopup(location.id, location);
}

// Update location in sidebar list
function updateLocationInList(location) {
  const locationItem = document.querySelector(`[data-location-id="${location.id}"]`);
  if (!locationItem) return;

  const statusColors = {
    online: 'success',
    offline: 'danger',
    warning: 'warning',
    maintenance: 'warning'
  };

  // Update status indicator
  const statusIndicator = locationItem.querySelector('.location-status');
  if (statusIndicator) {
    statusIndicator.innerHTML = `
      <i class="bi bi-circle-fill text-${statusColors[location.status]}"></i>
      <span>${location.status}</span>
    `;
  }

  // Update stats
  const statsContainer = locationItem.querySelector('.location-stats');
  if (statsContainer) {
    statsContainer.innerHTML = `
      <div class="stat">
        <i class="bi bi-hdd"></i>
        <span>NVRs: <strong>${location.nvrs}</strong></span>
      </div>
      <div class="stat">
        <i class="bi bi-camera-video"></i>
        <span>Cameras: <strong>${location.cameras}</strong></span>
      </div>
    `;
  }

  // Add animation
  locationItem.classList.add('status-updated');
  setTimeout(() => {
    locationItem.classList.remove('status-updated');
  }, 1000);
}

