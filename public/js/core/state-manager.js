/**
 * State Manager - Centralized state store for NVRs and cameras
 * 
 * Manages application state and provides subscription mechanism for updates
 */

(function() {
  'use strict';

  class StateManager {
    constructor() {
      this.state = {
        nvrs: {},
        cameras: {},
        summary: {
          totalNVRs: 0,
          onlineNVRs: 0,
          offlineNVRs: 0,
          warningNVRs: 0,
          totalCameras: 0,
          onlineCameras: 0,
          offlineCameras: 0,
          warningCameras: 0
        }
      };
      this.subscribers = new Map();
      this.updateQueue = [];
      this.updateTimer = null;
      this.batchDelay = 100; // Batch updates for 100ms
    }

    /**
     * Set NVR data
     * @param {number} nvrId - NVR ID
     * @param {Object} nvrData - NVR data
     */
    setNVR(nvrId, nvrData) {
      const oldData = this.state.nvrs[nvrId];
      this.state.nvrs[nvrId] = { ...nvrData };

      // Check if status changed
      if (oldData && oldData.status !== nvrData.status) {
        this.queueUpdate('nvr:status:changed', {
          nvrId,
          oldStatus: oldData.status,
          newStatus: nvrData.status,
          nvrData: this.state.nvrs[nvrId]
        });
      }

      // Always update summary when NVR changes
      this.updateSummary();
    }

    /**
     * Get NVR data
     * @param {number} nvrId - NVR ID
     * @returns {Object|null} - NVR data
     */
    getNVR(nvrId) {
      return this.state.nvrs[nvrId] || null;
    }

    /**
     * Get all NVRs
     * @returns {Object} - All NVRs
     */
    getAllNVRs() {
      return { ...this.state.nvrs };
    }

    /**
     * Get NVRs as array
     * @returns {Array} - Array of NVRs
     */
    getNVRsArray() {
      return Object.values(this.state.nvrs);
    }

    /**
     * Set camera data
     * @param {number} cameraId - Camera ID
     * @param {Object} cameraData - Camera data
     */
    setCamera(cameraId, cameraData) {
      const oldData = this.state.cameras[cameraId];
      this.state.cameras[cameraId] = { ...cameraData };

      // Check if status changed
      if (oldData && oldData.status !== cameraData.status) {
        this.queueUpdate('camera:status:changed', {
          cameraId,
          oldStatus: oldData.status,
          newStatus: cameraData.status,
          cameraData: this.state.cameras[cameraId]
        });
      }

      // Always update summary when camera changes
      this.updateSummary();
    }

    /**
     * Get camera data
     * @param {number} cameraId - Camera ID
     * @returns {Object|null} - Camera data
     */
    getCamera(cameraId) {
      return this.state.cameras[cameraId] || null;
    }

    /**
     * Get all cameras
     * @returns {Object} - All cameras
     */
    getAllCameras() {
      return { ...this.state.cameras };
    }

    /**
     * Get cameras as array
     * @returns {Array} - Array of cameras
     */
    getCamerasArray() {
      return Object.values(this.state.cameras);
    }

    /**
     * Get cameras by NVR ID
     * @param {number} nvrId - NVR ID
     * @returns {Array} - Array of cameras
     */
    getCamerasByNVR(nvrId) {
      return Object.values(this.state.cameras).filter(camera => camera.nvr_id === nvrId);
    }

    /**
     * Update multiple NVRs at once
     * @param {Array} nvrs - Array of NVR data
     */
    setNVRs(nvrs) {
      nvrs.forEach(nvr => {
        this.setNVR(nvr.id, nvr);
      });
    }

    /**
     * Update multiple cameras at once
     * @param {Array} cameras - Array of camera data
     */
    setCameras(cameras) {
      cameras.forEach(camera => {
        this.setCamera(camera.id, camera);
      });
    }

    /**
     * Update from server data
     * @param {Object} data - Server data with nvrs and cameras
     */
    updateFromServer(data) {
      if (data.nvrs) {
        this.setNVRs(data.nvrs);
      }
      if (data.cameras) {
        this.setCameras(data.cameras);
      }
      if (data.summary) {
        this.state.summary = { ...data.summary };
        this.notify('stats:updated', this.state.summary);
      }
    }

    /**
     * Update summary statistics
     */
    updateSummary() {
      const nvrs = Object.values(this.state.nvrs);
      const cameras = Object.values(this.state.cameras);

      this.state.summary = {
        totalNVRs: nvrs.length,
        onlineNVRs: nvrs.filter(n => n.status === 'online').length,
        offlineNVRs: nvrs.filter(n => n.status === 'offline').length,
        warningNVRs: nvrs.filter(n => n.status === 'warning').length,
        totalCameras: cameras.length,
        onlineCameras: cameras.filter(c => c.status === 'online').length,
        offlineCameras: cameras.filter(c => c.status === 'offline').length,
        warningCameras: cameras.filter(c => c.status === 'warning').length
      };

      // Notify subscribers
      this.queueUpdate('stats:updated', this.state.summary);
    }

    /**
     * Get summary statistics
     * @returns {Object} - Summary statistics
     */
    getSummary() {
      return { ...this.state.summary };
    }

    /**
     * Subscribe to state changes
     * @param {string} key - Event key
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    subscribe(key, callback) {
      if (!this.subscribers.has(key)) {
        this.subscribers.set(key, []);
      }

      this.subscribers.get(key).push(callback);

      // Return unsubscribe function
      return () => {
        const callbacks = this.subscribers.get(key) || [];
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      };
    }

    /**
     * Unsubscribe from state changes
     * @param {string} key - Event key
     * @param {Function} callback - Callback function
     */
    unsubscribe(key, callback) {
      if (!this.subscribers.has(key)) {
        return;
      }

      const callbacks = this.subscribers.get(key);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }

    /**
     * Queue update for batching
     * @param {string} key - Event key
     * @param {*} data - Event data
     */
    queueUpdate(key, data) {
      this.updateQueue.push({ key, data });

      if (!this.updateTimer) {
        this.updateTimer = setTimeout(() => {
          this.processUpdateQueue();
        }, this.batchDelay);
      }
    }

    /**
     * Process queued updates
     */
    processUpdateQueue() {
      // Group updates by key
      const updates = new Map();
      
      this.updateQueue.forEach(({ key, data }) => {
        if (!updates.has(key)) {
          updates.set(key, []);
        }
        updates.get(key).push(data);
      });

      // Notify subscribers
      updates.forEach((dataArray, key) => {
        // For batched updates, send the latest data
        const latestData = dataArray[dataArray.length - 1];
        this.notify(key, latestData);
      });

      // Clear queue
      this.updateQueue = [];
      this.updateTimer = null;
    }

    /**
     * Notify subscribers
     * @param {string} key - Event key
     * @param {*} data - Event data
     */
    notify(key, data) {
      const callbacks = this.subscribers.get(key) || [];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in StateManager subscriber for ${key}:`, error);
        }
      });

      // Also emit to EventBus for global access
      EventBus.emit(key, data);
    }

    /**
     * Clear all state
     */
    clear() {
      this.state = {
        nvrs: {},
        cameras: {},
        summary: {
          totalNVRs: 0,
          onlineNVRs: 0,
          offlineNVRs: 0,
          warningNVRs: 0,
          totalCameras: 0,
          onlineCameras: 0,
          offlineCameras: 0,
          warningCameras: 0
        }
      };
    }

    /**
     * Get full state
     * @returns {Object} - Full state
     */
    getState() {
      return {
        nvrs: { ...this.state.nvrs },
        cameras: { ...this.state.cameras },
        summary: { ...this.state.summary }
      };
    }
  }

  // Create singleton instance
  const stateManager = new StateManager();

  // Expose globally
  window.StateManager = stateManager;

  console.log('✓ StateManager initialized');

})();

