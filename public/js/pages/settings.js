// Settings Page JavaScript

// Store original settings for reset functionality
let originalSettings = {};

document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  initButtons();
  initToggleButtons();
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
    // General
    language: document.getElementById('language').value,
    timezone: document.getElementById('timezone').value,
    dateFormat: document.getElementById('dateFormat').value,
    timeFormat: document.getElementById('timeFormat').value,
    sessionTimeout: document.getElementById('sessionTimeout').value,
    
    // Notifications
    emailAlerts: document.getElementById('emailAlerts').checked,
    pushAlerts: document.getElementById('pushAlerts').checked,
    smsAlerts: document.getElementById('smsAlerts').checked,
    criticalAlerts: document.getElementById('criticalAlerts').checked,
    systemAlerts: document.getElementById('systemAlerts').checked,
    maintenanceAlerts: document.getElementById('maintenanceAlerts').checked,
    quietStart: document.getElementById('quietStart').value,
    quietEnd: document.getElementById('quietEnd').value,
    
    // Display
    theme: document.querySelector('input[name="themeOption"]:checked').value,
    tableDensity: document.getElementById('tableDensity').value,
    itemsPerPage: document.getElementById('itemsPerPage').value,
    showBreadcrumbs: document.getElementById('showBreadcrumbs').checked,
    compactSidebar: document.getElementById('compactSidebar').checked,
    
    // Advanced
    apiKey: document.getElementById('apiKey').value,
    webhookUrl: document.getElementById('webhookUrl').value,
    dataRetention: document.getElementById('dataRetention').value,
    enableDebug: document.getElementById('enableDebug').checked,
    autoBackup: document.getElementById('autoBackup').checked
  };
}

// Apply settings to form
function applySettings(settings) {
  // General
  document.getElementById('language').value = settings.language;
  document.getElementById('timezone').value = settings.timezone;
  document.getElementById('dateFormat').value = settings.dateFormat;
  document.getElementById('timeFormat').value = settings.timeFormat;
  document.getElementById('sessionTimeout').value = settings.sessionTimeout;
  
  // Notifications
  document.getElementById('emailAlerts').checked = settings.emailAlerts;
  document.getElementById('pushAlerts').checked = settings.pushAlerts;
  document.getElementById('smsAlerts').checked = settings.smsAlerts;
  document.getElementById('criticalAlerts').checked = settings.criticalAlerts;
  document.getElementById('systemAlerts').checked = settings.systemAlerts;
  document.getElementById('maintenanceAlerts').checked = settings.maintenanceAlerts;
  document.getElementById('quietStart').value = settings.quietStart;
  document.getElementById('quietEnd').value = settings.quietEnd;
  
  // Display
  document.querySelector(`input[value="${settings.theme}"]`).checked = true;
  document.getElementById('tableDensity').value = settings.tableDensity;
  document.getElementById('itemsPerPage').value = settings.itemsPerPage;
  document.getElementById('showBreadcrumbs').checked = settings.showBreadcrumbs;
  document.getElementById('compactSidebar').checked = settings.compactSidebar;
  
  // Advanced
  document.getElementById('apiKey').value = settings.apiKey;
  document.getElementById('webhookUrl').value = settings.webhookUrl;
  document.getElementById('dataRetention').value = settings.dataRetention;
  document.getElementById('enableDebug').checked = settings.enableDebug;
  document.getElementById('autoBackup').checked = settings.autoBackup;
}

// Initialize buttons
function initButtons() {
  // Save button
  document.getElementById('saveBtn').addEventListener('click', () => {
    const settings = getCurrentSettings();
    localStorage.setItem('dashboardSettings', JSON.stringify(settings));
    originalSettings = { ...settings };
    
    // Show success message
    showToast('Settings saved successfully!', 'success');
    
    // Apply theme change if needed
    if (settings.theme !== 'auto') {
      applyTheme(settings.theme);
    }
  });
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      localStorage.removeItem('dashboardSettings');
      applySettings(originalSettings);
      showToast('Settings reset to defaults', 'info');
    }
  });
}

// Initialize toggle buttons
function initToggleButtons() {
  // API Key visibility toggle
  document.getElementById('toggleApiKey').addEventListener('click', function() {
    const apiKeyInput = document.getElementById('apiKey');
    const icon = this.querySelector('i');
    
    if (apiKeyInput.type === 'password') {
      apiKeyInput.type = 'text';
      icon.classList.remove('bi-eye');
      icon.classList.add('bi-eye-slash');
    } else {
      apiKeyInput.type = 'password';
      icon.classList.remove('bi-eye-slash');
      icon.classList.add('bi-eye');
    }
  });
}

// Apply theme
function applyTheme(theme) {
  const themeLink = document.getElementById('theme-css');
  themeLink.href = `/css/themes/${theme}.css`;
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

