// Compliance Dashboard JavaScript

let complianceData = null;

document.addEventListener('DOMContentLoaded', () => {
  loadComplianceData();
  initRefresh();
});

// Load compliance data
async function loadComplianceData() {
  try {
    const response = await fetch('/data/mock/compliance-data.json');
    complianceData = await response.json();
    
    renderOverview();
    renderRequirements();
    renderRegionalCompliance();
    
  } catch (error) {
    console.error('Failed to load compliance data:', error);
  }
}

// Render overview cards
function renderOverview() {
  const { overview } = complianceData;
  
  document.getElementById('overallCompliance').textContent = `${overview.overallCompliance}%`;
  document.getElementById('totalChecks').textContent = overview.totalChecks;
  document.getElementById('passedChecks').textContent = overview.passed;
  document.getElementById('failedChecks').textContent = overview.failed;
  
  const progress = document.getElementById('overallProgress');
  progress.style.width = `${overview.overallCompliance}%`;
  progress.classList.add(
    overview.overallCompliance >= 90 ? 'bg-success' :
    overview.overallCompliance >= 70 ? 'bg-warning' : 'bg-danger'
  );
}

// Render requirements checklist
function renderRequirements() {
  const container = document.getElementById('requirementsList');
  
  container.innerHTML = complianceData.requirements.map(req => {
    const statusColor = req.compliance >= 90 ? 'success' : 
                       req.compliance >= 70 ? 'warning' : 'danger';
    
    return `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-start mb-2">
          <div class="flex-grow-1">
            <h6 class="mb-1">
              <i class="bi bi-${req.compliance >= 90 ? 'check-circle-fill text-success' : 'exclamation-circle-fill text-' + statusColor}"></i>
              ${req.name}
            </h6>
            <p class="mb-2 text-muted small">${req.description}</p>
          </div>
          <span class="badge bg-${statusColor} ms-2">${req.compliance}%</span>
        </div>
        
        <div class="row g-2 mb-2">
          <div class="col-4">
            <small class="text-muted">Passed:</small>
            <strong class="text-success d-block">${req.passed}</strong>
          </div>
          <div class="col-4">
            <small class="text-muted">Failed:</small>
            <strong class="text-danger d-block">${req.failed}</strong>
          </div>
          <div class="col-4">
            <small class="text-muted">Total:</small>
            <strong class="d-block">${req.total}</strong>
          </div>
        </div>
        
        <div class="progress" style="height: 6px;">
          <div class="progress-bar bg-${statusColor}" 
               role="progressbar" 
               style="width: ${req.compliance}%"
               aria-valuenow="${req.compliance}" 
               aria-valuemin="0" 
               aria-valuemax="100">
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render regional compliance
function renderRegionalCompliance() {
  const container = document.getElementById('regionalCompliance');
  
  container.innerHTML = complianceData.complianceByRegion.map(region => {
    const statusColor = region.compliance >= 90 ? 'success' : 
                       region.compliance >= 70 ? 'warning' : 'danger';
    
    return `
      <div class="list-group-item">
        <div class="d-flex justify-content-between align-items-center mb-2">
          <strong>${region.region}</strong>
          <span class="badge bg-${statusColor}">${region.compliance}%</span>
        </div>
        
        <div class="d-flex justify-content-between text-muted small mb-2">
          <span><i class="bi bi-hdd"></i> ${region.nvrs} NVRs</span>
          <span><i class="bi bi-camera"></i> ${region.cameras} Cameras</span>
        </div>
        
        <div class="d-flex justify-content-between text-muted small mb-2">
          <span class="text-success">✓ ${region.passed} passed</span>
          <span class="text-danger">✗ ${region.failed} failed</span>
        </div>
        
        <div class="progress" style="height: 4px;">
          <div class="progress-bar bg-${statusColor}" 
               role="progressbar" 
               style="width: ${region.compliance}%">
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Initialize refresh button
function initRefresh() {
  document.getElementById('refreshBtn')?.addEventListener('click', () => {
    location.reload();
  });
}
