/**
 * NVR Management Page
 */

(function() {
  'use strict';

  const NVRManagement = {
    data: null,
    filteredData: null,

    /**
     * Initialize NVR management
     */
    async init() {
      console.log('📡 NVR Management initializing...');
      
      await this.loadData();
      this.renderStatistics();
      this.renderTable();
      this.setupFilters();
      this.setupEventListeners();
      
      console.log('✓ NVR Management initialized');
    },

    /**
     * Load NVR data
     */
    async loadData() {
      try {
        document.getElementById('loading-state').style.display = 'block';
        document.getElementById('nvr-table-container').style.display = 'none';
        document.getElementById('empty-state').style.display = 'none';

        // Use server-rendered data if available, otherwise use mock
        if (window.nvrDataFromServer) {
          this.data = {
            nvrs: window.nvrDataFromServer.nvrs,
            summary: window.nvrDataFromServer.summary
          };
        } else {
          // Fallback to mock data
          const response = await fetch('/data/mock/nvrs.json');
          this.data = await response.json();
        }

        this.filteredData = this.data.nvrs;
        
        return this.data;
      } catch (error) {
        console.error('Error loading NVR data:', error);
        this.showError();
      } finally {
        document.getElementById('loading-state').style.display = 'none';
      }
    },

    /**
     * Render statistics
     */
    renderStatistics() {
      if (!this.data) return;

      const { summary } = this.data;

      document.getElementById('total-nvrs-count').textContent = summary.total;
      document.getElementById('online-nvrs-count').textContent = summary.online;
      document.getElementById('offline-nvrs-count').textContent = summary.offline;
      document.getElementById('warning-nvrs-count').textContent = summary.warning;
    },

    /**
     * Render NVR table
     */
    renderTable() {
      if (!this.filteredData || this.filteredData.length === 0) {
        document.getElementById('nvr-table-container').style.display = 'none';
        document.getElementById('empty-state').style.display = 'block';
        return;
      }

      document.getElementById('nvr-table-container').style.display = 'block';
      document.getElementById('empty-state').style.display = 'none';

      const tbody = document.getElementById('nvr-table-body');
      
      tbody.innerHTML = this.filteredData.map(nvr => {
        const statusClass = nvr.status;
        const uptimeClass = nvr.uptime >= 99 ? 'high' : nvr.uptime >= 95 ? 'medium' : 'low';
        const storageClass = nvr.storage.percent >= 80 ? 'danger' : nvr.storage.percent >= 60 ? 'warning' : 'success';
        const timeAgo = this.getTimeAgo(nvr.lastSeen);

        return `
          <tr data-nvr-id="${nvr.id}">
            <td>
              <strong>${nvr.name}</strong>
            </td>
            <td>
              <div class="text-truncate" style="max-width: 200px;" title="${nvr.location}">
                <i class="bi bi-geo-alt text-muted me-1"></i>
                ${nvr.location}
              </div>
            </td>
            <td>
              <code class="text-muted">${nvr.ipAddress}</code>
            </td>
            <td>
              <span class="status-badge ${statusClass}">
                <span class="status-dot"></span>
                ${statusClass.charAt(0).toUpperCase() + statusClass.slice(1)}
                           </span>
             </td>
             <td>
               <div class="camera-count">
                 <span class="online">${nvr.cameras.current || nvr.camerasOnline || 0}</span>
                 /
                 <span>${nvr.cameras.max || nvr.cameras || 0}</span>
                 <i class="bi bi-camera-video text-muted"></i>
               </div>
             </td>
             <td>
               <span class="uptime-value ${uptimeClass}">${nvr.uptime}%</span>
             </td>
             <td>
              <div class="action-buttons">
                <button class="btn btn-sm btn-outline-primary action-btn" 
                        onclick="NVRManagement.viewDetails(${nvr.id})" 
                        title="View Details">
                  <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-secondary action-btn" 
                        onclick="NVRManagement.editNVR(${nvr.id})" 
                        title="Edit">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger action-btn" 
                        onclick="NVRManagement.deleteNVR(${nvr.id})" 
                        title="Delete">
                  <i class="bi bi-trash"></i>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
    },

    /**
     * Setup filters
     */
    setupFilters() {
      const form = document.getElementById('nvr-filters');
      
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        this.applyFilters();
      });

      // Real-time search
      const searchInput = document.getElementById('search-nvr');
      let searchTimeout;
      searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          this.applyFilters();
        }, 300);
      });

      // Filter changes
      document.querySelectorAll('#nvr-filters select').forEach(select => {
        select.addEventListener('change', () => {
          this.applyFilters();
        });
      });
    },

    /**
     * Apply filters
     */
    applyFilters() {
      if (!this.data) return;

      const searchTerm = document.getElementById('search-nvr').value.toLowerCase();
      const statusFilter = document.getElementById('filter-status').value;
      const regionFilter = document.getElementById('filter-region').value;
      const branchFilter = document.getElementById('filter-branch').value;

      this.filteredData = this.data.nvrs.filter(nvr => {
        const matchesSearch = searchTerm === '' || 
          nvr.name.toLowerCase().includes(searchTerm) ||
          nvr.location.toLowerCase().includes(searchTerm) ||
          nvr.ipAddress.includes(searchTerm);
        
        const matchesStatus = statusFilter === '' || nvr.status === statusFilter;
        const matchesRegion = regionFilter === '' || nvr.region === regionFilter;
        const matchesBranch = branchFilter === '' || nvr.branch === branchFilter;

        return matchesSearch && matchesStatus && matchesRegion && matchesBranch;
      });

      this.renderTable();
    },

    /**
     * Reset filters
     */
    resetFilters() {
      document.getElementById('nvr-filters').reset();
      this.applyFilters();
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Reset filters
      document.getElementById('reset-filters').addEventListener('click', () => {
        this.resetFilters();
      });

      // Clear filters from empty state
      const clearFiltersBtn = document.getElementById('clear-filters-empty');
      if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', () => {
          this.resetFilters();
        });
      }

      // Refresh list
      document.getElementById('refresh-list').addEventListener('click', () => {
        this.loadData().then(() => {
          this.renderStatistics();
          this.renderTable();
        });
      });

      // Export CSV
      document.getElementById('export-csv').addEventListener('click', () => {
        this.exportToCSV();
      });

      // Add NVR
      document.getElementById('add-nvr-btn').addEventListener('click', () => {
        this.addNVR();
      });

      // Save NVR
      document.getElementById('save-nvr-btn').addEventListener('click', () => {
        this.saveNVR();
      });
    },

    /**
     * View NVR details
     */
    viewDetails(id) {
      const nvr = this.data.nvrs.find(n => n.id === id);
      if (nvr) {
        console.log('View details for:', nvr);
        Modal.showNVRDetail(nvr);
      }
    },

    /**
     * Edit NVR
     */
    editNVR(id) {
      const nvr = this.data.nvrs.find(n => n.id === id);
      if (nvr) {
        console.log('Edit NVR:', nvr);
        Modal.showNVRDetail(nvr);
        // Switch to edit mode after a brief delay
        setTimeout(() => {
          document.getElementById('edit-nvr-btn').click();
        }, 100);
      }
    },

    /**
     * Delete NVR
     */
    deleteNVR(id) {
      const nvr = this.data.nvrs.find(n => n.id === id);
      if (nvr) {
        if (confirm(`Are you sure you want to delete ${nvr.name}?`)) {
          console.log('Delete NVR:', nvr);
          alert('NVR deleted (demo only)');
        }
      }
    },

    /**
     * Add NVR
     */
    addNVR() {
      this.showAddNVRModal();
    },

    /**
     * Show Add NVR Modal
     */
    async showAddNVRModal() {
      try {
        // Load branches for the dropdown
        await this.loadBranchesForModal();
        
        // Reset form
        this.resetAddNVRForm();
        
        // Show modal
        const modal = new bootstrap.Modal(document.getElementById('add-nvr-modal'));
        modal.show();
        
      } catch (error) {
        console.error('Error showing add NVR modal:', error);
        alert('Error loading form data. Please try again.');
      }
    },

    /**
     * Load branches for the modal dropdown
     */
    async loadBranchesForModal() {
      try {
        // Get branches from the existing data or fetch from server
        const branches = this.data?.nvrs?.map(nvr => nvr.branch).filter((branch, index, self) => 
          index === self.findIndex(b => b.id === branch.id)
        ) || [];

        const branchSelect = document.getElementById('branch-id');
        branchSelect.innerHTML = '<option value="">Select a branch...</option>';
        
        branches.forEach(branch => {
          const option = document.createElement('option');
          option.value = branch.id;
          option.textContent = branch.name;
          branchSelect.appendChild(option);
        });

        // If no branches from data, try to fetch from server
        if (branches.length === 0) {
          const response = await fetch('/api/branches');
          if (response.ok) {
            const serverBranches = await response.json();
            serverBranches.forEach(branch => {
              const option = document.createElement('option');
              option.value = branch.id;
              option.textContent = branch.name;
              branchSelect.appendChild(option);
            });
          }
        }
      } catch (error) {
        console.error('Error loading branches:', error);
      }
    },

    /**
     * Reset Add NVR Form
     */
    resetAddNVRForm() {
      const form = document.getElementById('add-nvr-form');
      form.reset();
      
      // Reset validation classes
      form.querySelectorAll('.form-control, .form-select').forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
      });
      
      // Set default values
      document.getElementById('max-cameras').value = '16';
      document.getElementById('current-cameras').value = '0';
      document.getElementById('maintenance-period-days').value = '90';
      document.getElementById('uptime-percent').value = '0.00';
      document.getElementById('status').value = 'offline';
    },

    /**
     * Save NVR
     */
    async saveNVR() {
      const form = document.getElementById('add-nvr-form');
      
      // Validate form
      if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
      }

      try {
        // Show loading state
        const saveBtn = document.getElementById('save-nvr-btn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="bi bi-hourglass-split me-1"></i> Adding...';
        saveBtn.disabled = true;

        // Collect form data
        const formData = new FormData(form);
        const nvrData = Object.fromEntries(formData.entries());

        // Convert numeric fields
        nvrData.max_cameras = parseInt(nvrData.max_cameras);
        nvrData.current_cameras = parseInt(nvrData.current_cameras);
        nvrData.maintenance_period_days = parseInt(nvrData.maintenance_period_days);
        nvrData.uptime_percent = parseFloat(nvrData.uptime_percent);

        // Validate and clean date fields
        const dateFields = ['installation_date', 'warranty_expiry', 'previous_maintenance_date', 'next_maintenance_date'];
        dateFields.forEach(field => {
          if (nvrData[field] && nvrData[field] !== '') {
            const date = new Date(nvrData[field]);
            if (isNaN(date.getTime())) {
              nvrData[field] = null; // Set to null if invalid date
            }
          } else {
            nvrData[field] = null; // Set to null if empty
          }
        });

        // Send to server
        const response = await fetch('/api/nvrs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(nvrData)
        });

        if (response.ok) {
          // Success
          const newNVR = await response.json();
          
          // Close modal
          const modal = bootstrap.Modal.getInstance(document.getElementById('add-nvr-modal'));
          modal.hide();
          
          // Show success message
          this.showSuccessMessage(`NVR "${newNVR.device_name}" has been added successfully!`);
          
          // Refresh data
          await this.loadData();
          this.renderStatistics();
          this.renderTable();
          
        } else {
          // Error
          const error = await response.json();
          throw new Error(error.message || 'Failed to add NVR');
        }

      } catch (error) {
        console.error('Error saving NVR:', error);
        this.showErrorMessage(`Error adding NVR: ${error.message}`);
      } finally {
        // Reset button
        const saveBtn = document.getElementById('save-nvr-btn');
        saveBtn.innerHTML = '<i class="bi bi-check-circle me-1"></i> Add NVR';
        saveBtn.disabled = false;
      }
    },

    /**
     * Show success message
     */
    showSuccessMessage(message) {
      // Create toast notification
      const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
      
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
    },

    /**
     * Show error message
     */
    showErrorMessage(message) {
      // Create toast notification
      const toastContainer = document.getElementById('toast-container') || this.createToastContainer();
      
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
    },

    /**
     * Create toast container
     */
    createToastContainer() {
      const container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container position-fixed top-0 end-0 p-3';
      container.style.zIndex = '9999';
      document.body.appendChild(container);
      return container;
    },

    /**
     * Export to CSV
     */
    exportToCSV() {
      if (!this.filteredData || this.filteredData.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = ['Name', 'Location', 'IP Address', 'Status', 'Cameras Online', 'Total Cameras', 'Storage Used', 'Storage Total', 'Uptime', 'Last Seen'];
      
      const csvContent = [
        headers.join(','),
        ...this.filteredData.map(nvr => [
          nvr.name,
          `"${nvr.location}"`,
          nvr.ipAddress,
          nvr.status,
          nvr.cameras?.current || nvr.camerasOnline || 0,
          nvr.cameras?.max || nvr.cameras || 0,
          `"${nvr.storage.used}"`,
          `"${nvr.storage.total}"`,
          nvr.uptime || 0,
          nvr.lastSeen || 'N/A'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `nvr-list-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    },

    /**
     * Get time ago string
     */
    getTimeAgo(timestamp) {
      const now = new Date();
      const time = new Date(timestamp);
      const diff = Math.floor((now - time) / 1000);

      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      return `${Math.floor(diff / 86400)} days ago`;
    },

    /**
     * Show error
     */
    showError() {
      const container = document.getElementById('nvr-table-container');
      if (container) {
        container.innerHTML = `
          <div class="alert alert-danger" role="alert">
            <i class="bi bi-exclamation-triangle me-2"></i>
            <strong>Error:</strong> Failed to load NVR data. Please refresh the page.
          </div>
        `;
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => NVRManagement.init());
  } else {
    NVRManagement.init();
  }

  // Expose globally
  window.NVRManagement = NVRManagement;

})();

