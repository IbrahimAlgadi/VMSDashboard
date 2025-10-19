// Compliance Page JavaScript

let complianceData = null;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
  loadComplianceData();
  initExportButton();
});

// Load compliance data
async function loadComplianceData() {
  try {
    const response = await fetch('/data/mock/compliance-data.json');
    complianceData = await response.json();
    
    renderOverview();
    renderCategories();
    renderRegionalCompliance();
    renderRequirements();
    
  } catch (error) {
    console.error('Failed to load compliance data:', error);
  }
}

// Render overview section
function renderOverview() {
  const { overview } = complianceData;
  
  // Overall compliance circle
  const percentage = overview.overallCompliance;
  const circle = document.getElementById('complianceProgressCircle');
  const circumference = 2 * Math.PI * 45; // radius = 45
  const offset = circumference - (percentage / 100) * circumference;
  
  setTimeout(() => {
    circle.style.strokeDashoffset = offset;
    
    // Change color based on percentage
    if (percentage >= 85) {
      circle.classList.add('success');
    } else if (percentage >= 70) {
      circle.classList.add('warning');
    } else {
      circle.classList.add('danger');
    }
  }, 100);
  
  // Animate number
  animateValue('overallCompliance', 0, percentage, 1500, '%');
  
  // Statistics
  animateValue('metRequirements', 0, overview.metRequirements, 1000);
  animateValue('partialRequirements', 0, overview.partialRequirements, 1000);
  animateValue('notMetRequirements', 0, overview.notMetRequirements, 1000);
  
  // Audit dates
  document.getElementById('lastAudit').textContent = formatDate(overview.lastAudit);
  document.getElementById('nextAudit').textContent = formatDate(overview.nextAudit);
}

// Render categories
function renderCategories() {
  const container = document.getElementById('categoriesContainer');
  
  container.innerHTML = complianceData.categories.map(category => {
    const progressClass = category.compliance >= 85 ? 'bg-success' :
                         category.compliance >= 70 ? 'bg-warning' : 'bg-danger';
    const scoreClass = category.compliance >= 85 ? '' :
                      category.compliance >= 70 ? 'warning' : 'danger';
    
    return `
      <div class="category-item">
        <div class="category-header">
          <h6 class="category-name">${category.name}</h6>
          <div class="category-score ${scoreClass}">${category.compliance}%</div>
        </div>
        <div class="category-meta">
          <span class="text-success"><i class="bi bi-check-circle-fill"></i> ${category.met} Met</span>
          <span class="ms-3 text-warning"><i class="bi bi-exclamation-triangle-fill"></i> ${category.partial} Partial</span>
          <span class="ms-3 text-danger"><i class="bi bi-x-circle-fill"></i> ${category.notMet} Not Met</span>
          <span class="ms-3 text-muted">Total: ${category.requirements}</span>
        </div>
        <div class="progress">
          <div class="progress-bar progress-bar-striped progress-bar-animated ${progressClass}" 
               role="progressbar" 
               style="width: 0%"
               data-width="${category.compliance}%">
          </div>
        </div>
      </div>
    `;
  }).join('');
  
  // Animate progress bars
  setTimeout(() => {
    document.querySelectorAll('.progress-bar').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 100);
}

// Render regional compliance table
function renderRegionalCompliance() {
  const tbody = document.getElementById('regionalTableBody');
  
  tbody.innerHTML = complianceData.regionCompliance.map(region => {
    const statusClass = region.status === 'compliant' ? 'compliant' : 
                       region.status === 'warning' ? 'warning' : 'critical';
    const progressClass = region.compliance >= 85 ? 'bg-success' :
                         region.compliance >= 70 ? 'bg-warning' : 'bg-danger';
    
    return `
      <tr>
        <td><strong>${region.region}</strong></td>
        <td>${region.branches} ${region.branches === 1 ? 'Branch' : 'Branches'}</td>
        <td><strong>${region.compliance}%</strong></td>
        <td>
          <div class="regional-status">
            <span class="status-dot ${statusClass}"></span>
            <span class="text-capitalize">${region.status}</span>
          </div>
        </td>
        <td>
          <div class="progress" style="width: 200px;">
            <div class="progress-bar ${progressClass}" 
                 role="progressbar" 
                 style="width: 0%"
                 data-width="${region.compliance}%">
            </div>
          </div>
        </td>
      </tr>
    `;
  }).join('');
  
  // Animate progress bars
  setTimeout(() => {
    tbody.querySelectorAll('.progress-bar').forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 100);
}

// Render requirements accordion
function renderRequirements() {
  const accordion = document.getElementById('requirementsAccordion');
  
  // Group requirements by category
  const grouped = {};
  complianceData.requirements.forEach(req => {
    if (!grouped[req.category]) {
      grouped[req.category] = [];
    }
    grouped[req.category].push(req);
  });
  
  accordion.innerHTML = Object.entries(grouped).map(([category, reqs], index) => {
    const categoryData = complianceData.categories.find(c => c.name === category);
    const accordionId = `accordion-${index}`;
    
    return `
      <div class="accordion-item">
        <h2 class="accordion-header">
          <button class="accordion-button ${index === 0 ? '' : 'collapsed'}" 
                  type="button" 
                  data-bs-toggle="collapse" 
                  data-bs-target="#${accordionId}">
            ${category}
            <span class="ms-auto me-3">
              <span class="badge bg-success">${categoryData.met}</span>
              <span class="badge bg-warning">${categoryData.partial}</span>
              <span class="badge bg-danger">${categoryData.notMet}</span>
            </span>
          </button>
        </h2>
        <div id="${accordionId}" class="accordion-collapse collapse ${index === 0 ? 'show' : ''}">
          <div class="accordion-body p-0">
            ${reqs.map(req => renderRequirement(req)).join('')}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render individual requirement
function renderRequirement(req) {
  const statusIcons = {
    'met': '<i class="bi bi-check-circle-fill text-success"></i>',
    'partial': '<i class="bi bi-exclamation-triangle-fill text-warning"></i>',
    'not-met': '<i class="bi bi-x-circle-fill text-danger"></i>'
  };
  
  return `
    <div class="requirement-item">
      <div class="requirement-info">
        <div class="requirement-title">
          ${statusIcons[req.status]}
          ${req.title}
        </div>
        <div class="requirement-description">${req.description}</div>
        <div class="requirement-evidence">
          <strong>Evidence:</strong> ${req.evidence}
        </div>
        <div class="requirement-meta">
          Last checked: ${formatDate(req.lastChecked)}
        </div>
      </div>
      <div class="requirement-status">
        <div class="status-badge ${req.status}">
          ${req.status === 'met' ? 'Compliant' : 
            req.status === 'partial' ? 'Partial' : 'Non-Compliant'}
        </div>
      </div>
    </div>
  `;
}

// Initialize export button
function initExportButton() {
  document.getElementById('exportReport').addEventListener('click', () => {
    // In a real app, this would generate and download a PDF
    alert('Generating compliance report...\n\nThis would export a detailed PDF report with all compliance data.');
    console.log('Export compliance report', complianceData);
  });
}

// Utility: Animate number
function animateValue(elementId, start, end, duration, suffix = '') {
  const element = document.getElementById(elementId);
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    element.textContent = Math.round(current) + suffix;
  }, 16);
}

// Utility: Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

