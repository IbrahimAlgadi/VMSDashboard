/**
 * Modal Component
 */

(function() {
  'use strict';

  const Modal = {
    instances: {},

    /**
     * Initialize modal
     */
    init() {
      console.log('✓ Modal component initialized');
    },

    /**
     * Show NVR detail modal
     */
    showNVRDetail(nvrData) {
      const modal = new bootstrap.Modal(document.getElementById('nvr-detail-modal'));
      
      // Populate header
      document.getElementById('modal-nvr-name').textContent = nvrData.name;
      document.getElementById('modal-nvr-location').textContent = nvrData.location;

      // Populate Information tab
      document.getElementById('info-name').textContent = nvrData.name;
      document.getElementById('info-location').textContent = nvrData.location;
      document.getElementById('info-region').textContent = nvrData.region;
      document.getElementById('info-ip').textContent = nvrData.ipAddress;
      document.getElementById('info-firmware').textContent = nvrData.firmware;
      document.getElementById('info-cameras').textContent = `${nvrData.camerasOnline} / ${nvrData.cameras}`;
      document.getElementById('info-uptime').textContent = `${nvrData.uptime}%`;
      document.getElementById('info-last-seen').textContent = this.formatDate(nvrData.lastSeen);

      // Status badge
      const statusHtml = `
        <span class="status-badge ${nvrData.status}">
          <span class="status-dot"></span>
          ${nvrData.status.charAt(0).toUpperCase() + nvrData.status.slice(1)}
        </span>
      `;
      document.getElementById('info-status').innerHTML = statusHtml;

      // Storage
      document.getElementById('info-storage-text').textContent = 
        `${nvrData.storage.used} / ${nvrData.storage.total} (${nvrData.storage.percent}%)`;
      
      const storageBar = document.getElementById('info-storage-bar');
      storageBar.style.width = `${nvrData.storage.percent}%`;
      storageBar.className = 'progress-bar';
      if (nvrData.storage.percent >= 80) {
        storageBar.classList.add('bg-danger');
      } else if (nvrData.storage.percent >= 60) {
        storageBar.classList.add('bg-warning');
      } else {
        storageBar.classList.add('bg-success');
      }

      // Populate Cameras tab
      this.populateCameras(nvrData);

      // Populate Status tab
      this.populateStatus(nvrData);

      // Setup edit button
      document.getElementById('edit-nvr-btn').onclick = () => {
        modal.hide();
        this.editNVR(nvrData);
      };

      // Show modal
      modal.show();
    },

    /**
     * Populate cameras tab
     */
    populateCameras(nvrData) {
      const container = document.getElementById('cameras-list');
      document.getElementById('cameras-count-badge').textContent = nvrData.cameras;

      // Generate mock camera data
      const cameras = [];
      for (let i = 1; i <= nvrData.cameras; i++) {
        const isOnline = i <= nvrData.camerasOnline;
        cameras.push({
          id: i,
          name: `Camera ${i}`,
          location: `Position ${i}`,
          status: isOnline ? 'online' : 'offline',
          resolution: '1920x1080',
          fps: 25
        });
      }

      container.innerHTML = cameras.map(camera => `
        <div class="camera-list-item">
          <div class="camera-info">
            <div class="camera-icon ${camera.status}">
              <i class="bi bi-camera-video"></i>
            </div>
            <div class="camera-details">
              <div class="camera-name">${camera.name}</div>
              <div class="camera-meta">
                <i class="bi bi-geo-alt"></i> ${camera.location} &bull; 
                ${camera.resolution} @ ${camera.fps} FPS
              </div>
            </div>
          </div>
          <span class="status-badge ${camera.status}">
            <span class="status-dot"></span>
            ${camera.status}
          </span>
        </div>
      `).join('');
    },

    /**
     * Populate status tab
     */
    populateStatus(nvrData) {
      const healthMetrics = nvrData.healthMetrics;

      // Connection status
      const connectionStatus = healthMetrics?.connectionStatus || (nvrData.status === 'online' ? 'connected' : 'disconnected');
      const connectionStatusText = connectionStatus === 'connected' ? 'Connected' : 
                                  connectionStatus === 'unstable' ? 'Unstable' : 'Disconnected';
      const connectionHtml = `
        <span class="status-indicator ${connectionStatus}">
          <i class="bi bi-${connectionStatus === 'connected' ? 'check-circle' : 
                            connectionStatus === 'unstable' ? 'exclamation-triangle' : 'x-circle'}"></i>
          ${connectionStatusText}
        </span>
      `;
      document.getElementById('status-connection').innerHTML = connectionHtml;

      // Recording status
      const recordingStatus = healthMetrics?.recordingStatus || 'stopped';
      const recordingStatusText = recordingStatus === 'recording' ? 'Recording' :
                                 recordingStatus === 'paused' ? 'Paused' :
                                 recordingStatus === 'error' ? 'Error' : 'Stopped';
      const recordingHtml = `
        <span class="status-indicator ${recordingStatus === 'recording' ? 'online' : 'offline'}">
          <i class="bi bi-record-circle"></i>
          ${recordingStatusText}
        </span>
      `;
      document.getElementById('status-recording').innerHTML = recordingHtml;

      // System health (real data or fallback to offline values)
      const cpu = healthMetrics ? Math.round(healthMetrics.cpuUsage) : 0;
      const memory = healthMetrics ? Math.round(healthMetrics.memoryUsage) : 0;
      const disk = healthMetrics ? Math.round(healthMetrics.diskIO) : 0;

      document.getElementById('status-cpu').textContent = `${cpu}%`;
      document.getElementById('status-cpu-bar').style.width = `${cpu}%`;

      document.getElementById('status-memory').textContent = `${memory}%`;
      document.getElementById('status-memory-bar').style.width = `${memory}%`;

      document.getElementById('status-disk').textContent = `${disk}%`;
      document.getElementById('status-disk-bar').style.width = `${disk}%`;

      // Network statistics (real data or fallback to offline values)
      const bandwidthIn = healthMetrics ? Math.round(healthMetrics.bandwidthIn) : 0;
      const bandwidthOut = healthMetrics ? Math.round(healthMetrics.bandwidthOut) : 0;
      const packetsSent = healthMetrics ? healthMetrics.packetsSent : 0;
      const packetsReceived = healthMetrics ? healthMetrics.packetsReceived : 0;

      document.getElementById('status-bandwidth-in').textContent = `${bandwidthIn} Mbps`;
      document.getElementById('status-bandwidth-out').textContent = `${bandwidthOut} Mbps`;
      document.getElementById('status-packets-sent').textContent = packetsSent.toLocaleString();
      document.getElementById('status-packets-received').textContent = packetsReceived.toLocaleString();
    },

    /**
     * Edit NVR
     */
    editNVR(nvrData) {
      alert(`Edit form for ${nvrData.name} will be shown here`);
    },

    /**
     * Format date
     */
    formatDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diff = Math.floor((now - date) / 1000);

      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Initialize
  Modal.init();

  // Expose globally
  window.Modal = Modal;

})();

