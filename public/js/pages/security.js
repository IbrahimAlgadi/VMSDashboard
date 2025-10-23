// Security Monitoring Page JavaScript

let securityData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadSecurityData();
  initRefresh();
});

// Load security data
async function loadSecurityData() {
  try {
    const response = await fetch('/data/mock/security-data.json');
    securityData = await response.json();
    
    renderOverview();
    renderCameraSecurityChecks();
    renderNVRSecurityChecks();
    renderSecurityEvents();
    
  } catch (error) {
    console.error('Failed to load security data:', error);
  }
}

// Render overview cards
function renderOverview() {
  const { overview } = securityData;
  
  document.getElementById('securityScore').textContent = overview.securityScore;
  document.getElementById('threatLevel').textContent = `Threat Level: ${overview.threatLevel}`;
  document.getElementById('totalChecks').textContent = overview.totalChecks;
  document.getElementById('passedChecks').textContent = overview.passed;
  document.getElementById('failedChecks').textContent = overview.failed;
}

// Render camera security checks
function renderCameraSecurityChecks() {
  const container = document.getElementById('cameraSecurityList');
  
  container.innerHTML = securityData.cameraSecurityChecks.map(check => {
    const statusColor = getSeverityColor(check.severity);
    const iconClass = check.compliance >= 90 ? 'check-circle-fill text-success' : 
                     check.compliance >= 70 ? 'exclamation-triangle-fill text-warning' : 
                     'x-circle-fill text-danger';
    
    return `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="flex-grow-1">
            <h6 class="mb-1">
              <i class="bi bi-${iconClass}"></i>
              ${check.name}
              <span class="badge bg-${statusColor} ms-2">${check.severity}</span>
            </h6>
            <p class="mb-2 text-muted small">${check.description}</p>
          </div>
          <span class="badge ${check.compliance >= 90 ? 'bg-success' : check.compliance >= 70 ? 'bg-warning' : 'bg-danger'} ms-2">
            ${check.compliance}%
          </span>
        </div>
        
        <div class="row g-2 small mb-2">
          <div class="col-4">
            <i class="bi bi-check-circle text-success"></i> ${check.passed} passed
          </div>
          <div class="col-4">
            <i class="bi bi-x-circle text-danger"></i> ${check.failed} failed
          </div>
          <div class="col-4">
            <i class="bi bi-hash"></i> ${check.total} total
          </div>
        </div>
        
        <div class="progress" style="height: 6px;">
          <div class="progress-bar ${check.compliance >= 90 ? 'bg-success' : check.compliance >= 70 ? 'bg-warning' : 'bg-danger'}" 
               style="width: ${check.compliance}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Render NVR security checks
function renderNVRSecurityChecks() {
  const container = document.getElementById('nvrSecurityList');
  
  container.innerHTML = securityData.nvrSecurityChecks.map(check => {
    const statusColor = getSeverityColor(check.severity);
    const iconClass = check.compliance >= 90 ? 'check-circle-fill text-success' : 
                     check.compliance >= 70 ? 'exclamation-triangle-fill text-warning' : 
                     'x-circle-fill text-danger';
    
    return `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="flex-grow-1">
            <h6 class="mb-1">
              <i class="bi bi-${iconClass}"></i>
              ${check.name}
              <span class="badge bg-${statusColor} ms-2">${check.severity}</span>
            </h6>
            <p class="mb-2 text-muted small">${check.description}</p>
          </div>
          <span class="badge ${check.compliance >= 90 ? 'bg-success' : check.compliance >= 70 ? 'bg-warning' : 'bg-danger'} ms-2">
            ${check.compliance}%
          </span>
        </div>
        
        <div class="row g-2 small mb-2">
          <div class="col-4">
            <i class="bi bi-check-circle text-success"></i> ${check.passed} passed
          </div>
          <div class="col-4">
            <i class="bi bi-x-circle text-danger"></i> ${check.failed} failed
          </div>
          <div class="col-4">
            <i class="bi bi-hash"></i> ${check.total} total
          </div>
        </div>
        
        <div class="progress" style="height: 6px;">
          <div class="progress-bar ${check.compliance >= 90 ? 'bg-success' : check.compliance >= 70 ? 'bg-warning' : 'bg-danger'}" 
               style="width: ${check.compliance}%"></div>
        </div>
      </div>
    `;
  }).join('');
}

// Render security events table
function renderSecurityEvents() {
  const container = document.getElementById('securityEventsTable');
  
  container.innerHTML = securityData.recentSecurityEvents.map(event => {
    const severityColor = getSeverityColor(event.severity);
    const deviceTypeIcon = event.deviceType === 'camera' ? 'camera' : 'hdd';
    const timeAgo = getTimeAgo(event.timestamp);
    const statusBadge = event.status === 'active' ? 
      '<span class="badge bg-danger">Active</span>' : 
      '<span class="badge bg-success">Resolved</span>';
    
    return `
      <tr>
        <td>
          <span class="badge bg-${severityColor}">${event.severity}</span>
        </td>
        <td>
          <i class="bi bi-${deviceTypeIcon}"></i> ${event.device}
        </td>
        <td>${formatEventType(event.type)}</td>
        <td>${event.message}</td>
        <td><small class="text-muted">${timeAgo}</small></td>
        <td>${statusBadge}</td>
      </tr>
    `;
  }).join('');
}

// Helper functions
function getSeverityColor(severity) {
  const colors = {
    'critical': 'danger',
    'high': 'warning',
    'medium': 'info',
    'low': 'secondary'
  };
  return colors[severity] || 'secondary';
}

function formatEventType(type) {
  return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

function getTimeAgo(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

// Initialize refresh button
function initRefresh() {
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    location.reload();
  });
}
