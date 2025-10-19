// Camera Management Page JavaScript

let cameras = [];
let filteredCameras = [];
let currentView = 'grid';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadCameras();
  initViewToggle();
  initFilters();
});

// Load camera data
async function loadCameras() {
  try {
    const response = await fetch('/data/mock/cameras.json');
    const data = await response.json();
    cameras = data.cameras;
    filteredCameras = [...cameras];
    
    // Update statistics
    updateStatistics(data.summary);
    
    // Populate NVR filter
    populateNVRFilter();
    
    // Render cameras
    renderCameras();
  } catch (error) {
    console.error('Failed to load cameras:', error);
  }
}

// Update statistics bar
function updateStatistics(summary) {
  document.getElementById('totalCameras').textContent = summary.total;
  document.getElementById('onlineCameras').textContent = summary.online;
  document.getElementById('offlineCameras').textContent = summary.offline;
  document.getElementById('warningCameras').textContent = summary.warning || summary.maintenance || 0;
}

// Populate NVR filter dropdown
function populateNVRFilter() {
  const nvrSelect = document.getElementById('filterNVR');
  const nvrs = [...new Set(cameras.map(cam => cam.nvr))].sort();
  
  nvrs.forEach(nvr => {
    const option = document.createElement('option');
    option.value = nvr;
    option.textContent = nvr;
    nvrSelect.appendChild(option);
  });
}

// Initialize view toggle
function initViewToggle() {
  const gridBtn = document.getElementById('gridViewBtn');
  const listBtn = document.getElementById('listViewBtn');
  const gridView = document.getElementById('gridView');
  const listView = document.getElementById('listView');
  
  gridBtn.addEventListener('click', () => {
    currentView = 'grid';
    gridBtn.classList.add('active');
    listBtn.classList.remove('active');
    gridView.style.display = 'block';
    listView.style.display = 'none';
    renderCameras();
  });
  
  listBtn.addEventListener('click', () => {
    currentView = 'list';
    listBtn.classList.add('active');
    gridBtn.classList.remove('active');
    listView.style.display = 'block';
    gridView.style.display = 'none';
    renderCameras();
  });
}

// Initialize filters
function initFilters() {
  const searchInput = document.getElementById('searchCamera');
  const statusFilter = document.getElementById('filterStatus');
  const regionFilter = document.getElementById('filterRegion');
  const nvrFilter = document.getElementById('filterNVR');
  const clearBtn = document.getElementById('clearFilters');
  
  searchInput.addEventListener('input', applyFilters);
  statusFilter.addEventListener('change', applyFilters);
  regionFilter.addEventListener('change', applyFilters);
  nvrFilter.addEventListener('change', applyFilters);
  
  clearBtn.addEventListener('click', () => {
    searchInput.value = '';
    statusFilter.value = '';
    regionFilter.value = '';
    nvrFilter.value = '';
    applyFilters();
  });
}

// Apply filters
function applyFilters() {
  const searchTerm = document.getElementById('searchCamera').value.toLowerCase();
  const statusFilter = document.getElementById('filterStatus').value;
  const regionFilter = document.getElementById('filterRegion').value;
  const nvrFilter = document.getElementById('filterNVR').value;
  
  filteredCameras = cameras.filter(camera => {
    const matchesSearch = camera.name.toLowerCase().includes(searchTerm) ||
                         camera.location.toLowerCase().includes(searchTerm) ||
                         camera.position.toLowerCase().includes(searchTerm);
    const matchesStatus = !statusFilter || camera.status === statusFilter;
    const matchesRegion = !regionFilter || camera.region === regionFilter;
    const matchesNVR = !nvrFilter || camera.nvr === nvrFilter;
    
    return matchesSearch && matchesStatus && matchesRegion && matchesNVR;
  });
  
  renderCameras();
}

// Render cameras based on current view
function renderCameras() {
  if (currentView === 'grid') {
    renderGridView();
  } else {
    renderListView();
  }
}

// Render grid view
function renderGridView() {
  const gridContainer = document.getElementById('cameraGrid');
  
  if (filteredCameras.length === 0) {
    gridContainer.innerHTML = '<div class="col-12"><p class="text-center text-muted">No cameras found</p></div>';
    return;
  }
  
  gridContainer.innerHTML = filteredCameras.map(camera => `
    <div class="col">
      <div class="card camera-card">
        <div class="card-img-top">
          <i class="bi bi-camera-video-fill"></i>
          ${camera.status === 'online' ? `
            <span class="camera-status-badge status-${camera.status}">
              <i class="bi bi-circle-fill"></i> Online
            </span>
          ` : camera.status === 'offline' ? `
            <span class="camera-status-badge status-${camera.status}">
              <i class="bi bi-circle-fill"></i> Offline
            </span>
          ` : `
            <span class="camera-status-badge status-${camera.status}">
              <i class="bi bi-circle-fill"></i> Maintenance
            </span>
          `}
        </div>
        <div class="card-body">
          <h6 class="camera-name">${camera.name}</h6>
          <div class="camera-location">
            <i class="bi bi-geo-alt"></i>
            ${camera.location}
          </div>
          <div class="camera-position">
            <i class="bi bi-camera"></i> ${camera.position}
          </div>
          <div class="camera-info">
            <div class="camera-info-item">
              <i class="bi bi-display"></i>
              ${camera.resolution}
            </div>
            <div class="camera-info-item">
              <i class="bi bi-hdd"></i>
              ${camera.nvr}
            </div>
          </div>
        </div>
        <div class="card-footer">
          <div class="btn-group" role="group">
            <button class="btn btn-sm btn-outline-primary" onclick="viewCamera(${camera.id})">
              <i class="bi bi-eye"></i> View
            </button>
            <button class="btn btn-sm btn-outline-secondary" onclick="editCamera(${camera.id})">
              <i class="bi bi-pencil"></i> Edit
            </button>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

// Render list view
function renderListView() {
  const tableBody = document.getElementById('cameraTableBody');
  
  if (filteredCameras.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No cameras found</td></tr>';
    return;
  }
  
  tableBody.innerHTML = filteredCameras.map(camera => {
    const statusClass = camera.status === 'online' ? 'bg-success' : 
                       camera.status === 'offline' ? 'bg-danger' : 'bg-warning';
    const uptimeClass = camera.uptime >= 99 ? 'uptime-high' : 
                       camera.uptime >= 95 ? 'uptime-medium' : 'uptime-low';
    
    return `
      <tr>
        <td><strong>${camera.name}</strong></td>
        <td>${camera.location}</td>
        <td>${camera.position}</td>
        <td>${camera.nvr}</td>
        <td><code>${camera.ipAddress}</code></td>
        <td>
          <span class="status-badge ${statusClass}">
            <i class="bi bi-circle-fill"></i>
            ${camera.status}
          </span>
        </td>
        <td>
          <span class="uptime-indicator ${uptimeClass}">
            ${camera.uptime.toFixed(1)}%
          </span>
        </td>
        <td>
          <div class="btn-group btn-group-sm" role="group">
            <button class="btn btn-outline-primary" onclick="viewCamera(${camera.id})" title="View Details">
              <i class="bi bi-eye"></i>
            </button>
            <button class="btn btn-outline-secondary" onclick="editCamera(${camera.id})" title="Edit">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-outline-danger" onclick="deleteCamera(${camera.id})" title="Delete">
              <i class="bi bi-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// View camera details
function viewCamera(id) {
  const camera = cameras.find(c => c.id === id);
  if (camera) {
    showCameraDetail(camera);
  }
}

// Edit camera
function editCamera(id) {
  const camera = cameras.find(c => c.id === id);
  if (camera) {
    showCameraDetail(camera, true);
  }
}

// Delete camera
function deleteCamera(id) {
  const camera = cameras.find(c => c.id === id);
  if (camera) {
    if (confirm(`Are you sure you want to delete camera "${camera.name}"?`)) {
      console.log('Delete camera:', id);
      // In a real app, this would call an API
    }
  }
}

// Show camera detail modal
function showCameraDetail(camera, editMode = false) {
  const modal = new bootstrap.Modal(document.getElementById('cameraDetailModal'));
  
  // Populate modal with camera data
  document.getElementById('cameraDetailModalLabel').textContent = 
    editMode ? `Edit Camera: ${camera.name}` : `Camera Details: ${camera.name}`;
  
  // Information tab
  document.getElementById('modalCameraName').textContent = camera.name;
  document.getElementById('modalCameraLocation').textContent = camera.location;
  document.getElementById('modalCameraPosition').textContent = camera.position;
  document.getElementById('modalCameraNVR').textContent = camera.nvr;
  document.getElementById('modalCameraIP').textContent = camera.ipAddress;
  document.getElementById('modalCameraModel').textContent = camera.model;
  document.getElementById('modalCameraResolution').textContent = camera.resolution;
  document.getElementById('modalCameraFPS').textContent = camera.fps;
  document.getElementById('modalCameraUptime').textContent = camera.uptime.toFixed(1);
  
  // Status badge
  const statusBadge = document.getElementById('modalCameraStatus');
  statusBadge.className = 'badge';
  statusBadge.classList.add(
    camera.status === 'online' ? 'bg-success' : 
    camera.status === 'offline' ? 'bg-danger' : 'bg-warning'
  );
  statusBadge.innerHTML = `<i class="bi bi-circle-fill"></i> ${camera.status}`;
  
  // Edit button
  const editBtn = document.getElementById('editCameraBtn');
  if (editMode) {
    editBtn.textContent = 'Save Changes';
    editBtn.innerHTML = '<i class="bi bi-save"></i> Save Changes';
  } else {
    editBtn.textContent = 'Edit Settings';
    editBtn.innerHTML = '<i class="bi bi-pencil"></i> Edit Settings';
    editBtn.onclick = () => {
      modal.hide();
      editCamera(camera.id);
    };
  }
  
  modal.show();
}

// Export to CSV
function exportToCSV() {
  const headers = ['Camera Name', 'Location', 'Position', 'NVR', 'IP Address', 'Status', 'Recording', 'Motion', 'Uptime'];
  const rows = filteredCameras.map(camera => [
    camera.name,
    camera.location,
    camera.position,
    camera.nvr,
    camera.ipAddress,
    camera.status,
    camera.recording ? 'Yes' : 'No',
    camera.motion ? 'Yes' : 'No',
    camera.uptime.toFixed(1) + '%'
  ]);
  
  let csvContent = headers.join(',') + '\n';
  rows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(',') + '\n';
  });
  
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cameras-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  window.URL.revokeObjectURL(url);
}

