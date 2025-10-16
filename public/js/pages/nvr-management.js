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

        const response = await fetch('/data/mock/nvrs.json');
        const result = await response.json();
        this.data = result;
        this.filteredData = result.nvrs;
        
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
                <span class="online">${nvr.camerasOnline}</span>
                /
                <span>${nvr.cameras}</span>
                <i class="bi bi-camera-video text-muted"></i>
              </div>
            </td>
            <td>
              <div class="storage-progress">
                <div class="storage-info">
                  <span>${nvr.storage.used}</span>
                  <span>${nvr.storage.percent}%</span>
                </div>
                <div class="progress">
                  <div class="progress-bar bg-${storageClass}" role="progressbar" 
                       style="width: ${nvr.storage.percent}%" 
                       aria-valuenow="${nvr.storage.percent}" 
                       aria-valuemin="0" 
                       aria-valuemax="100">
                  </div>
                </div>
              </div>
            </td>
            <td>
              <span class="uptime-value ${uptimeClass}">${nvr.uptime}%</span>
            </td>
            <td>
              <small class="last-seen">${timeAgo}</small>
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
      alert('Add NVR form will be implemented in next task');
    },

    /**
     * Export to CSV
     */
    exportToCSV() {
      if (!this.filteredData || this.filteredData.length === 0) {
        alert('No data to export');
        return;
      }

      const headers = ['Name', 'Location', 'IP Address', 'Status', 'Cameras Online', 'Total Cameras', 'Storage Used', 'Storage Total', 'Uptime', 'Firmware', 'Last Seen'];
      
      const csvContent = [
        headers.join(','),
        ...this.filteredData.map(nvr => [
          nvr.name,
          `"${nvr.location}"`,
          nvr.ipAddress,
          nvr.status,
          nvr.camerasOnline,
          nvr.cameras,
          `"${nvr.storage.used}"`,
          `"${nvr.storage.total}"`,
          nvr.uptime,
          nvr.firmware,
          nvr.lastSeen
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

