/**
 * Dashboard Page
 */

(function() {
  'use strict';

  const Dashboard = {
    data: null,
    refreshInterval: null,

    /**
     * Initialize dashboard
     */
    async init() {
      console.log('📊 Dashboard initializing...');
      
      await this.loadData();
      this.renderKPIs();
      this.renderQuickActions();
      this.renderSummary();
      this.renderRegionBreakdown();
      this.setupRefresh();
      this.setupInteractivity();
      
      console.log('✓ Dashboard initialized');
    },

    /**
     * Load dashboard data
     */
    async loadData() {
      try {
        const response = await fetch('/data/mock/dashboard-data.json');
        this.data = await response.json();
        return this.data;
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        this.showError();
      }
    },

    /**
     * Render KPI cards
     */
    renderKPIs() {
      if (!this.data) return;

      const { kpis } = this.data;

      // Total NVRs
      this.updateKPI('total-nvrs', {
        value: kpis.totalNVRs.value,
        change: kpis.totalNVRs.change,
        changeLabel: kpis.totalNVRs.changeLabel,
        changeType: kpis.totalNVRs.changeType
      });

      // Total Cameras
      this.updateKPI('total-cameras', {
        value: kpis.totalCameras.value,
        change: `${kpis.totalCameras.onlinePercent}% online`,
        changeLabel: `${kpis.totalCameras.online} of ${kpis.totalCameras.value}`,
        changeType: 'positive'
      });

      // Offline Cameras
      this.updateKPI('offline-cameras', {
        value: kpis.offlineCameras.value,
        change: kpis.offlineCameras.change,
        changeLabel: kpis.offlineCameras.changeLabel,
        changeType: kpis.offlineCameras.changeType === 'decrease' ? 'positive' : 'negative'
      });

      // Active Alerts
      this.updateKPI('active-alerts', {
        value: kpis.activeAlerts.value,
        change: `${kpis.activeAlerts.critical} critical`,
        changeLabel: `${kpis.activeAlerts.warning} warning`,
        changeType: kpis.activeAlerts.critical > 0 ? 'negative' : 'neutral'
      });
    },

    /**
     * Update individual KPI
     */
    updateKPI(id, data) {
      const card = document.getElementById(id);
      if (!card) return;

      const valueEl = card.querySelector('.stat-card-value');
      const changeEl = card.querySelector('.stat-card-change');
      const changeLabelEl = card.querySelector('.stat-card-change-label');

      if (valueEl) {
        this.animateValue(valueEl, 0, data.value, 1000);
      }

      if (changeEl) {
        changeEl.textContent = data.change;
        changeEl.className = `stat-card-change ${data.changeType}`;
      }

      if (changeLabelEl) {
        changeLabelEl.textContent = data.changeLabel;
      }
    },

    /**
     * Animate number counting
     */
    animateValue(element, start, end, duration) {
      const startTime = performance.now();
      
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const currentValue = Math.floor(progress * (end - start) + start);
        element.textContent = currentValue;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    },

    /**
     * Render quick actions
     */
    renderQuickActions() {
      if (!this.data) return;

      const container = document.getElementById('quick-actions-container');
      if (!container) return;

      const { quickActions } = this.data;
      
      container.innerHTML = quickActions.map(action => `
        <div class="col-md-6 col-lg-3 mb-3">
          <a href="${action.link}" class="quick-action-card card ${action.color}">
            <div class="card-body">
              <i class="bi ${action.icon} quick-action-icon"></i>
              <h6>${action.title}</h6>
              <p>${action.description}</p>
            </div>
          </a>
        </div>
      `).join('');
    },

    /**
     * Render summary section
     */
    renderSummary() {
      if (!this.data) return;

      const container = document.getElementById('dashboard-summary');
      if (!container) return;

      const { summary } = this.data;

      container.innerHTML = `
        <div class="summary-item">
          <span class="summary-label">Regions</span>
          <span class="summary-value">${summary.regions}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Branches</span>
          <span class="summary-value">${summary.branches}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Storage Used</span>
          <span class="summary-value">${summary.usedStorage} / ${summary.totalStorage}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">System Uptime</span>
          <span class="summary-value">${summary.systemUptime}%</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Avg Response Time</span>
          <span class="summary-value">${summary.avgResponseTime}</span>
        </div>
      `;
    },

    /**
     * Render region breakdown
     */
    renderRegionBreakdown() {
      if (!this.data) return;

      const container = document.getElementById('region-breakdown');
      if (!container) return;

      const { regionBreakdown } = this.data;

      container.innerHTML = regionBreakdown.map(region => `
        <div class="region-item">
          <div>
            <div class="region-name">${region.name}</div>
            <small class="text-muted">${region.nvrs} NVRs, ${region.cameras} Cameras</small>
          </div>
          <div class="region-stats">
            <div class="region-stat online">
              <i class="bi bi-check-circle-fill"></i>
              <span>${region.online}</span>
            </div>
            ${region.offline > 0 ? `
              <div class="region-stat offline">
                <i class="bi bi-x-circle-fill"></i>
                <span>${region.offline}</span>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
    },

    /**
     * Setup auto-refresh
     */
    setupRefresh() {
      // Refresh every 30 seconds
      this.refreshInterval = setInterval(() => {
        this.refresh();
      }, 30000);
    },

    /**
     * Refresh dashboard data
     */
    async refresh() {
      console.log('🔄 Refreshing dashboard...');
      await this.loadData();
      this.renderKPIs();
      this.updateLastRefreshTime();
    },

    /**
     * Update last refresh time display
     */
    updateLastRefreshTime() {
      const timeEl = document.getElementById('last-refresh-time');
      if (timeEl) {
        const now = new Date();
        timeEl.textContent = now.toLocaleTimeString();
      }
    },

    /**
     * Setup interactivity
     */
    setupInteractivity() {
      // Add click handlers for KPI cards
      document.querySelectorAll('.stat-card').forEach(card => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', (e) => {
          if (!e.target.closest('a')) {
            this.handleKPIClick(card.id);
          }
        });
      });

      // Manual refresh button
      const refreshBtn = document.getElementById('refresh-dashboard');
      if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
          this.refresh();
        });
      }
    },

    /**
     * Handle KPI card click
     */
    handleKPIClick(cardId) {
      const routes = {
        'total-nvrs': '/nvr-management',
        'total-cameras': '/camera-management',
        'offline-cameras': '/camera-management?status=offline',
        'active-alerts': '/alerts'
      };

      if (routes[cardId]) {
        window.location.href = routes[cardId];
      }
    },

    /**
     * Show error state
     */
    showError() {
      const container = document.querySelector('.kpi-cards');
      if (container) {
        container.innerHTML = `
          <div class="col-12">
            <div class="alert alert-danger" role="alert">
              <i class="bi bi-exclamation-triangle me-2"></i>
              <strong>Error:</strong> Failed to load dashboard data. Please refresh the page.
            </div>
          </div>
        `;
      }
    },

    /**
     * Cleanup
     */
    destroy() {
      if (this.refreshInterval) {
        clearInterval(this.refreshInterval);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Dashboard.init());
  } else {
    Dashboard.init();
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => Dashboard.destroy());

  // Expose globally
  window.Dashboard = Dashboard;

})();

