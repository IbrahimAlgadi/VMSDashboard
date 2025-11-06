/**
 * Real-Time Manager - Main interface for real-time updates
 * 
 * Coordinates WebSocket, State Manager, and Event Bus for real-time updates
 */

(function() {
  'use strict';

  class RealtimeManager {
    constructor() {
      this.initialized = false;
      this.listeners = new Map();
    }

    /**
     * Initialize real-time manager
     */
    init() {
      if (this.initialized) {
        console.warn('RealtimeManager already initialized');
        return;
      }

      // Wait for dependencies
      if (typeof EventBus === 'undefined' || typeof StateManager === 'undefined' || typeof WebSocketClient === 'undefined') {
        console.error('RealtimeManager: Dependencies not loaded. Make sure EventBus, StateManager, and WebSocketClient are loaded first.');
        return;
      }

      this.setupWebSocketHandlers();
      this.setupStateHandlers();
      this.initialized = true;

      console.log('✓ RealtimeManager initialized');
    }

    /**
     * Setup WebSocket message handlers
     */
    setupWebSocketHandlers() {
      // Handle NVR online
      EventBus.on('nvr:online', (message) => {
        this.handleNVROnline(message);
      });

      // Handle NVR offline
      EventBus.on('nvr:offline', (message) => {
        this.handleNVROffline(message);
      });

      // Handle NVR status update
      EventBus.on('nvr:status:changed', (message) => {
        this.handleNVRStatusChange(message);
      });

      // Handle camera status update
      EventBus.on('camera:status:changed', (message) => {
        this.handleCameraStatusChange(message);
      });

      // Handle WebSocket connection status
      EventBus.on('websocket:connected', () => {
        console.log('✅ Real-time updates connected');
        Notifications.info('Real-time updates connected', 'Connection', 3000);
      });

      EventBus.on('websocket:disconnected', () => {
        console.log('🔌 Real-time updates disconnected');
        Notifications.warning('Real-time updates disconnected', 'Connection', 3000);
      });

      EventBus.on('websocket:reconnecting', (data) => {
        console.log(`🔄 Reconnecting... (${data.attempt}/${data.maxAttempts})`);
      });
    }

    /**
     * Setup state change handlers
     */
    setupStateHandlers() {
      // Subscribe to state changes for notifications
      StateManager.subscribe('nvr:status:changed', (data) => {
        this.handleNVRStateChange(data);
      });

      StateManager.subscribe('camera:status:changed', (data) => {
        this.handleCameraStateChange(data);
      });

      StateManager.subscribe('stats:updated', (summary) => {
        // Emit global stats update event
        EventBus.emit('realtime:stats:updated', summary);
      });
    }

    /**
     * Handle NVR online event
     * @param {Object} message - NVR online message
     */
    handleNVROnline(message) {
      // Fetch full NVR data from server if needed
      // For now, update state with available data
      if (message.nvr_id) {
        // State will be updated when we get the full data
        // For now, just emit event
        EventBus.emit('realtime:nvr:online', message);
      }
    }

    /**
     * Handle NVR offline event
     * @param {Object} message - NVR offline message
     */
    handleNVROffline(message) {
      if (message.nvr_id) {
        const nvr = StateManager.getNVR(message.nvr_id);
        if (nvr) {
          StateManager.setNVR(message.nvr_id, {
            ...nvr,
            status: 'offline',
            last_seen: new Date().toISOString()
          });
        }

        // Mark all cameras offline
        const cameras = StateManager.getCamerasByNVR(message.nvr_id);
        cameras.forEach(camera => {
          StateManager.setCamera(camera.id, {
            ...camera,
            status: 'offline'
          });
        });

        EventBus.emit('realtime:nvr:offline', message);
      }
    }

    /**
     * Handle NVR status change from WebSocket
     * @param {Object} message - Status change message
     */
    handleNVRStatusChange(message) {
      if (message.nvr_id) {
        // Update NVR in state
        const nvr = StateManager.getNVR(message.nvr_id);
        if (nvr) {
          StateManager.setNVR(message.nvr_id, {
            ...nvr,
            status: message.status || nvr.status,
            last_seen: message.timestamp || new Date().toISOString()
          });
        } else {
          // NVR not in state yet, might need to fetch
          console.log('NVR not in state, may need to fetch:', message.nvr_id);
        }

        // Handle camera updates if provided
        if (message.cameras_updated && message.cameras_updated > 0) {
          // Cameras were updated, but we don't have the details
          // The server should send camera_status_update separately
        }
      }
    }

    /**
     * Handle NVR state change (from StateManager)
     * @param {Object} data - State change data
     */
    handleNVRStateChange(data) {
      const { nvrId, oldStatus, newStatus, nvrData } = data;

      // Show notification for status changes
      if (oldStatus !== newStatus && nvrData) {
        const statusMessages = {
          online: `NVR ${nvrData.device_name || nvrData.hostname} is now online`,
          offline: `NVR ${nvrData.device_name || nvrData.hostname} went offline`,
          warning: `NVR ${nvrData.device_name || nvrData.hostname} has warnings`
        };

        const notificationType = newStatus === 'online' ? 'success' : 
                                 newStatus === 'offline' ? 'error' : 'warning';

        if (statusMessages[newStatus]) {
          Notifications[notificationType](
            statusMessages[newStatus],
            'NVR Status Change',
            5000
          );
        }
      }

      // Emit event for page handlers
      EventBus.emit('realtime:nvr:status:changed', data);
    }

    /**
     * Handle camera status change from WebSocket
     * @param {Object} message - Camera status change message
     */
    handleCameraStatusChange(message) {
      if (message.camera_id) {
        console.log('📹 Camera status update received:', message);
        
        // Update camera in state (create if doesn't exist)
        const camera = StateManager.getCamera(message.camera_id);
        if (camera) {
          StateManager.setCamera(message.camera_id, {
            ...camera,
            status: message.new_status || camera.status
          });
        } else {
          // Camera not in state yet, create it with minimal data
          StateManager.setCamera(message.camera_id, {
            id: message.camera_id,
            name: message.camera_name || `Camera ${message.camera_id}`,
            nvr_id: message.nvr_id,
            status: message.new_status || 'offline'
          });
          console.log('📹 Created camera in state:', message.camera_id);
        }

        // Emit event for page handlers with proper format
        EventBus.emit('realtime:camera:status:changed', {
          cameraId: message.camera_id,
          camera_id: message.camera_id, // Keep both for compatibility
          oldStatus: message.old_status,
          newStatus: message.new_status,
          cameraData: {
            id: message.camera_id,
            name: message.camera_name,
            nvr_id: message.nvr_id,
            status: message.new_status
          }
        });
      }
    }

    /**
     * Handle camera state change (from StateManager)
     * @param {Object} data - State change data
     */
    handleCameraStateChange(data) {
      const { cameraId, oldStatus, newStatus, cameraData } = data;

      // Show notification for status changes (optional, might be too noisy)
      // Uncomment if you want camera notifications
      /*
      if (oldStatus !== newStatus && cameraData) {
        const statusMessages = {
          online: `Camera ${cameraData.name} is now online`,
          offline: `Camera ${cameraData.name} went offline`,
          warning: `Camera ${cameraData.name} has warnings`
        };

        const notificationType = newStatus === 'online' ? 'success' : 
                                 newStatus === 'offline' ? 'error' : 'warning';

        if (statusMessages[newStatus]) {
          Notifications[notificationType](
            statusMessages[newStatus],
            'Camera Status Change',
            3000
          );
        }
      }
      */

      // Emit event for page handlers
      EventBus.emit('realtime:camera:status:changed', data);
    }

    /**
     * Subscribe to real-time events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    on(event, callback) {
      return EventBus.on(`realtime:${event}`, callback);
    }

    /**
     * Unsubscribe from real-time events
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(event, callback) {
      EventBus.off(`realtime:${event}`, callback);
    }

    /**
     * Get connection status
     * @returns {string} - Connection status
     */
    getConnectionStatus() {
      return WebSocketClient ? WebSocketClient.getConnectionStatus() : 'disconnected';
    }

    /**
     * Check if connected
     * @returns {boolean} - True if connected
     */
    isConnected() {
      return WebSocketClient ? WebSocketClient.isConnected() : false;
    }

    /**
     * Get state manager instance
     * @returns {StateManager} - State manager
     */
    getStateManager() {
      return StateManager;
    }
  }

  // Create singleton instance
  const realtimeManager = new RealtimeManager();

  // Auto-initialize when dependencies are ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait a bit for other scripts to load
      setTimeout(() => {
        realtimeManager.init();
      }, 100);
    });
  } else {
    setTimeout(() => {
      realtimeManager.init();
    }, 100);
  }

  // Expose globally
  window.RealtimeManager = realtimeManager;

})();

