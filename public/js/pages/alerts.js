// Alerts Management Page JavaScript
let alertsData = null;
let filteredAlerts = [];
let currentPage = 1;
const itemsPerPage = 10;

document.addEventListener('DOMContentLoaded', () => {
  loadAlerts();
  initFilters();
  initActions();
});

async function loadAlerts() {
  try {
    // Use server-rendered data if available, otherwise use mock
    if (window.alertsDataFromServer) {
      alertsData = window.alertsDataFromServer;
    } else {
      // Fallback to mock data
      const response = await fetch('/data/mock/alerts-detailed.json');
      alertsData = await response.json();
    }
    
    filteredAlerts = [...alertsData.alerts];
    renderStats();
    renderAlerts();
  } catch (error) {
    console.error('Failed to load alerts:', error);
  }
}

function renderStats() {
  document.getElementById('criticalCount').textContent = alertsData.summary.critical;
  document.getElementById('highCount').textContent = alertsData.summary.high;
  document.getElementById('mediumCount').textContent = alertsData.summary.medium;
  document.getElementById('lowCount').textContent = alertsData.summary.low;
}

function renderAlerts() {
  const start = (currentPage - 1) * itemsPerPage;
  const end = start + itemsPerPage;
  const pageAlerts = filteredAlerts.slice(start, end);
  
  document.getElementById('alertsCount').textContent = filteredAlerts.length;
  document.getElementById('alertsList').innerHTML = pageAlerts.map(alert => `
    <div class="alert-item list-group-item ${alert.status}" onclick="showAlert(${alert.id})">
      <div class="alert-header">
        <div class="alert-title">${alert.title}</div>
        <span class="badge severity-badge ${alert.severity}">${alert.severity}</span>
      </div>
      <div class="alert-meta">
        <i class="bi bi-clock"></i> ${new Date(alert.timestamp).toLocaleString()} | 
        <i class="bi bi-tag"></i> ${alert.type} | 
        <i class="bi bi-geo-alt"></i> ${alert.location}
      </div>
      <div class="alert-description">${alert.description}</div>
      <div><span class="badge bg-secondary">${alert.status}</span></div>
    </div>
  `).join('');
  
  renderPagination();
}

function renderPagination() {
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = Array.from({length: totalPages}, (_, i) => `
    <li class="page-item ${i + 1 === currentPage ? 'active' : ''}">
      <a class="page-link" href="#" onclick="goToPage(${i + 1}); return false;">${i + 1}</a>
    </li>
  `).join('');
}

function goToPage(page) { currentPage = page; renderAlerts(); }

function showAlert(id) {
  const alert = alertsData.alerts.find(a => a.id === id);
  const modal = new bootstrap.Modal(document.getElementById('alertModal'));
  document.getElementById('alertModalTitle').textContent = alert.title;
  document.getElementById('alertModalBody').innerHTML = `
    <div class="mb-3"><span class="badge severity-badge ${alert.severity} me-2">${alert.severity}</span>
    <span class="badge bg-secondary">${alert.type}</span></div>
    <p><strong>Description:</strong><br>${alert.description}</p>
    <p><strong>Location:</strong> ${alert.location}</p>
    <p><strong>Source:</strong> ${alert.source}</p>
    <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
    <p><strong>Status:</strong> <span class="badge bg-primary">${alert.status}</span></p>
    ${alert.assignedTo ? `<p><strong>Assigned To:</strong> ${alert.assignedTo}</p>` : ''}
  `;
  document.getElementById('alertModalActions').innerHTML = alert.actions.map(action => 
    `<button class="btn btn-sm btn-outline-primary">${action}</button>`
  ).join('');
  modal.show();
}

function initFilters() {
  document.getElementById('searchAlert').addEventListener('input', applyFilters);
  document.getElementById('filterSeverity').addEventListener('change', applyFilters);
  document.getElementById('filterType').addEventListener('change', applyFilters);
  document.getElementById('filterStatus').addEventListener('change', applyFilters);
  document.getElementById('clearFilters').addEventListener('click', () => {
    document.getElementById('searchAlert').value = '';
    document.getElementById('filterSeverity').value = '';
    document.getElementById('filterType').value = '';
    document.getElementById('filterStatus').value = '';
    applyFilters();
  });
}

function applyFilters() {
  const search = document.getElementById('searchAlert').value.toLowerCase();
  const severity = document.getElementById('filterSeverity').value;
  const type = document.getElementById('filterType').value;
  const status = document.getElementById('filterStatus').value;
  
  filteredAlerts = alertsData.alerts.filter(a => 
    (!search || a.title.toLowerCase().includes(search) || a.description.toLowerCase().includes(search)) &&
    (!severity || a.severity === severity) &&
    (!type || a.type === type) &&
    (!status || a.status === status)
  );
  currentPage = 1;
  renderAlerts();
}

function initActions() {
  document.getElementById('markAllRead').addEventListener('click', () => alert('All alerts marked as read!'));
}

