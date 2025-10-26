// Map Page JavaScript

let mapComponent;
let locations = [];
let filteredLocations = [];
let sidebar;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initMap();
  initSidebar();
  initControls();
  loadLocations();
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

    // Update statistics
    updateStatistics(data.summary);

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

