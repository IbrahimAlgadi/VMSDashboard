// Settings Page JavaScript

// Store original settings for reset functionality
let originalSettings = {};

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initForm();
});

// Load settings from localStorage or use defaults
function loadSettings() {
  const savedSettings = localStorage.getItem('dashboardSettings');
  
  if (savedSettings) {
    const settings = JSON.parse(savedSettings);
    applySettings(settings);
    originalSettings = { ...settings };
  } else {
    // Save current form values as original
    originalSettings = getCurrentSettings();
  }
}

// Get current form values
function getCurrentSettings() {
  return {
    language: document.getElementById('language').value,
    timezone: document.getElementById('timezone').value,
    dateFormat: document.getElementById('dateFormat').value,
    timeFormat: document.getElementById('timeFormat').value,
    itemsPerPage: document.getElementById('itemsPerPage').value,
    sessionTimeout: document.getElementById('sessionTimeout').value
  };
}

// Apply settings to form
function applySettings(settings) {
  document.getElementById('language').value = settings.language;
  document.getElementById('timezone').value = settings.timezone;
  document.getElementById('dateFormat').value = settings.dateFormat;
  document.getElementById('timeFormat').value = settings.timeFormat;
  document.getElementById('itemsPerPage').value = settings.itemsPerPage;
  document.getElementById('sessionTimeout').value = settings.sessionTimeout;
}

// Initialize form
function initForm() {
  // Save button
  document.getElementById('saveBtn').addEventListener('click', () => {
    const settings = getCurrentSettings();
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    originalSettings = { ...settings };
    
    // Show success message
    showToast('Settings saved successfully!', 'success');
  });
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      localStorage.removeItem('dashboardSettings');
      applySettings(originalSettings);
      showToast('Settings reset to defaults', 'info');
    }
  });
  
  // Form submit
  document.getElementById('settingsForm').addEventListener('submit', (e) => {
    e.preventDefault();
    document.getElementById('saveBtn').click();
  });
}

// Show toast notification
function showToast(message, type = 'info') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  toast.style.zIndex = '9999';
  toast.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  
  document.body.appendChild(toast);
  
  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.remove();
  }, 3000);
}

