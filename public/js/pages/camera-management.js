// Camera Management Page JavaScript

let cameras = [];
let filteredCameras = [];
let currentView = 'grid';

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadCameras();
  initViewToggle();
  initFilters();
  initAddCameraModal();
});

// Load camera data
async function loadCameras() {
  try {
    // Use server-rendered data if available, otherwise use mock
    let data;
    if (window.cameraDataFromServer) {
      data = {
        cameras: window.cameraDataFromServer.cameras,
        summary: window.cameraDataFromServer.summary
      };
    } else {
      // Fallback to mock data
      const response = await fetch('/data/mock/cameras.json');
      data = await response.json();
    }

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
  document.getElementById('modalCameraFPS').textContent = camera.fps || '-';
  
  // Bitrate - prefer from camera model, fallback to health metrics
  const bitrate = camera.bitrate !== null && camera.bitrate !== undefined
    ? camera.bitrate
    : (camera.healthMetrics?.bitrateKbps !== null && camera.healthMetrics?.bitrateKbps !== undefined
        ? camera.healthMetrics.bitrateKbps
        : null);
  if (bitrate !== null && bitrate !== undefined) {
    document.getElementById('modalCameraBitrate').textContent = bitrate;
  } else {
    document.getElementById('modalCameraBitrate').textContent = '-';
  }
  
  document.getElementById('modalCameraUptime').textContent = camera.uptime.toFixed(1);
  
  // Status badge
  const statusBadge = document.getElementById('modalCameraStatus');
  statusBadge.className = 'badge';
  statusBadge.classList.add(
    camera.status === 'online' ? 'bg-success' : 
    camera.status === 'offline' ? 'bg-danger' : 'bg-warning'
  );
  statusBadge.innerHTML = `<i class="bi bi-circle-fill"></i> ${camera.status}`;
  
  // Populate edge storage data if available
  // Edge Storage Size - prefer from health metrics, fallback to camera.edgeStorageSize
  const edgeStorageSize = camera.healthMetrics?.edgeStorageSizeGb || camera.edgeStorageSize;
  if (edgeStorageSize !== null && edgeStorageSize !== undefined) {
    document.getElementById('diagEdgeStorageSize').textContent = `${edgeStorageSize} GB`;
  } else {
    document.getElementById('diagEdgeStorageSize').textContent = 'N/A';
  }
  
  // Recording Time - from health metrics
  if (camera.healthMetrics?.recordingTimeDays !== null && camera.healthMetrics?.recordingTimeDays !== undefined) {
    document.getElementById('diagRecTime').textContent = `${camera.healthMetrics.recordingTimeDays} days`;
  } else {
    document.getElementById('diagRecTime').textContent = 'N/A';
  }
  
  // Space Used - from health metrics
  if (camera.healthMetrics?.spaceUsedGb !== null && camera.healthMetrics?.spaceUsedGb !== undefined) {
    document.getElementById('diagSpaceUsed').textContent = `${camera.healthMetrics.spaceUsedGb.toFixed(0)} GB`;
  } else {
    document.getElementById('diagSpaceUsed').textContent = 'N/A';
  }
  
  // Retention - prefer from health metrics, fallback to camera.edgeStorageRetention
  let retention = null;
  
  // Check health metrics first
  if (camera.healthMetrics) {
    const healthRetention = camera.healthMetrics.retentionDays;
    if (healthRetention !== null && healthRetention !== undefined && healthRetention !== '') {
      retention = typeof healthRetention === 'number' ? healthRetention : parseInt(healthRetention);
      if (!isNaN(retention)) {
        // Use health metrics value
      }
    }
  }
  
  // Fallback to camera.edgeStorageRetention if health metrics doesn't have it
  if (retention === null || isNaN(retention)) {
    const cameraRetention = camera.edgeStorageRetention;
    if (cameraRetention !== null && cameraRetention !== undefined && cameraRetention !== '') {
      retention = typeof cameraRetention === 'number' ? cameraRetention : parseInt(cameraRetention);
    }
  }
  
  if (retention !== null && !isNaN(retention)) {
    document.getElementById('diagRetention').textContent = `${retention} days`;
  } else {
    document.getElementById('diagRetention').textContent = 'N/A';
  }
  
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

// Add Camera Modal Functions
function initAddCameraModal() {
  const addCameraBtn = document.getElementById('add-camera-btn');
  if (addCameraBtn) {
    addCameraBtn.addEventListener('click', showAddCameraModal);
  }

  const saveCameraBtn = document.getElementById('save-camera-btn');
  if (saveCameraBtn) {
    saveCameraBtn.addEventListener('click', saveCamera);
  }

  // Branch change handler to update NVR dropdown
  const branchSelect = document.getElementById('branch-id');
  if (branchSelect) {
    branchSelect.addEventListener('change', loadNVRsForBranch);
  }
}

async function showAddCameraModal() {
  try {
    // Load branches and NVRs for the dropdowns
    await loadBranchesForModal();
    await loadNVRsForModal();
    
    // Reset form
    resetAddCameraForm();
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('add-camera-modal'));
    modal.show();
    
  } catch (error) {
    console.error('Error showing add camera modal:', error);
    alert('Error loading form data. Please try again.');
  }
}

async function loadBranchesForModal() {
  try {
    const response = await fetch('/api/branches');
    if (response.ok) {
      const result = await response.json();
      const branchSelect = document.getElementById('branch-id');
      branchSelect.innerHTML = '<option value="">Select a branch...</option>';
      
      result.data.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.id;
        option.textContent = `${branch.name} (${branch.region})`;
        branchSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading branches:', error);
  }
}

async function loadNVRsForModal() {
  try {
    const response = await fetch('/api/nvrs');
    if (response.ok) {
      const result = await response.json();
      const nvrSelect = document.getElementById('nvr-id');
      nvrSelect.innerHTML = '<option value="">Select an NVR...</option>';
      
      result.data.forEach(nvr => {
        const option = document.createElement('option');
        option.value = nvr.id;
        option.textContent = `${nvr.device_name} (${nvr.branch_name}) - ${nvr.available_slots} slots available`;
        nvrSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading NVRs:', error);
  }
}

async function loadNVRsForBranch() {
  const branchId = document.getElementById('branch-id').value;
  const nvrSelect = document.getElementById('nvr-id');
  
  if (!branchId) {
    nvrSelect.innerHTML = '<option value="">Select an NVR...</option>';
    return;
  }

  try {
    const response = await fetch(`/api/nvrs/by-branch/${branchId}`);
    if (response.ok) {
      const result = await response.json();
      nvrSelect.innerHTML = '<option value="">Select an NVR...</option>';
      
      result.data.forEach(nvr => {
        const option = document.createElement('option');
        option.value = nvr.id;
        option.textContent = `${nvr.device_name} - ${nvr.available_slots} slots available`;
        nvrSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error('Error loading NVRs for branch:', error);
  }
}

function resetAddCameraForm() {
  const form = document.getElementById('add-camera-form');
  form.reset();
  
  // Reset validation classes
  form.querySelectorAll('.form-control, .form-select').forEach(input => {
    input.classList.remove('is-valid', 'is-invalid');
  });
  
  // Set default values
  document.getElementById('camera-fps').value = '25';
  document.getElementById('camera-status').value = 'offline';
  document.getElementById('camera-uptime').value = '0.00';
}

async function saveCamera(event) {
  event.preventDefault();
  
  const form = document.getElementById('add-camera-form');
  
  // Validate form
  if (!form.checkValidity()) {
    form.classList.add('was-validated');
    return;
  }

  try {
    // Show loading state
    const saveBtn = document.getElementById('save-camera-btn');
    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Adding...';
    saveBtn.disabled = true;

    // Collect form data
    const formData = new FormData(form);
    const cameraData = Object.fromEntries(formData.entries());

    // Convert numeric fields
    cameraData.fps = parseInt(cameraData.fps);
    cameraData.bitrate = cameraData.bitrate ? parseInt(cameraData.bitrate) : null;
    cameraData.edge_storage_size = cameraData.edge_storage_size ? parseInt(cameraData.edge_storage_size) : null;
    cameraData.uptime_percent = parseFloat(cameraData.uptime_percent);

    // Send to server
    const response = await fetch('/api/cameras', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cameraData)
    });

    if (response.ok) {
      // Success
      const newCamera = await response.json();
      
      // Close modal
      const modal = bootstrap.Modal.getInstance(document.getElementById('add-camera-modal'));
      modal.hide();
      
      // Show success message
      showSuccessMessage(`Camera "${newCamera.data.name}" has been added successfully!`);
      
      // Refresh data
      await loadCameras();
      
    } else {
      // Error
      const error = await response.json();
      throw new Error(error.message || 'Failed to add camera');
    }

  } catch (error) {
    console.error('Error saving camera:', error);
    showErrorMessage(error.message || 'Failed to add camera. Please try again.');
  } finally {
    // Reset button
    const saveBtn = document.getElementById('save-camera-btn');
    saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Add Camera';
    saveBtn.disabled = false;
  }
}

function showSuccessMessage(message) {
  // Create toast notification
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-success border-0';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-check-circle me-2"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove toast element after it's hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

function showErrorMessage(message) {
  // Create toast notification
  const toastContainer = document.getElementById('toast-container') || createToastContainer();
  
  const toast = document.createElement('div');
  toast.className = 'toast align-items-center text-white bg-danger border-0';
  toast.setAttribute('role', 'alert');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi bi-exclamation-triangle me-2"></i>
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;
  
  toastContainer.appendChild(toast);
  
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();
  
  // Remove toast element after it's hidden
  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}

function createToastContainer() {
  const container = document.createElement('div');
  container.id = 'toast-container';
  container.className = 'toast-container position-fixed top-0 end-0 p-3';
  container.style.zIndex = '9999';
  document.body.appendChild(container);
  return container;
}

