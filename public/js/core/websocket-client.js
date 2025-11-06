/**
 * WebSocket Client - Connection manager for real-time updates
 * 
 * Handles WebSocket connection, auto-reconnection, and message routing
 */

(function() {
  'use strict';

  class WebSocketClient {
    constructor() {
      this.ws = null;
      this.reconnectAttempts = 0;
      this.maxReconnectAttempts = 10;
      this.reconnectDelay = 1000;
      this.maxReconnectDelay = 30000;
      this.reconnectTimer = null;
      this.isManualClose = false;
      this.connectionStatus = 'disconnected'; // disconnected, connecting, connected, reconnecting
      this.messageQueue = [];
      this.heartbeatInterval = null;
      this.heartbeatTimeout = null;
      this.heartbeatDelay = 30000; // 30 seconds
    }

    /**
     * Connect to WebSocket server
     */
    connect() {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected');
        return;
      }

      this.isManualClose = false;
      this.setConnectionStatus('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected');
          this.setConnectionStatus('connected');
          this.reconnectAttempts = 0;
          
          // Register as dashboard client
          this.send({ type: 'dashboard' });
          
          // Process queued messages
          this.processMessageQueue();
          
          // Start heartbeat detection
          this.startHeartbeat();
          
          // Emit connected event
          EventBus.emit('websocket:connected');
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket disconnected', event.code, event.reason);
          this.setConnectionStatus('disconnected');
          this.stopHeartbeat();
          
          // Emit disconnected event
          EventBus.emit('websocket:disconnected', { code: event.code, reason: event.reason });
          
          // Attempt reconnect if not manual close
          if (!this.isManualClose) {
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.setConnectionStatus('disconnected');
          EventBus.emit('websocket:error', error);
        };

      } catch (error) {
        console.error('Error creating WebSocket:', error);
        this.setConnectionStatus('disconnected');
        EventBus.emit('websocket:error', error);
        this.attemptReconnect();
      }
    }

    /**
     * Disconnect from WebSocket server
     */
    disconnect() {
      this.isManualClose = true;
      this.stopHeartbeat();
      
      if (this.reconnectTimer) {
        clearTimeout(this.reconnectTimer);
        this.reconnectTimer = null;
      }

      if (this.ws) {
        this.ws.close();
        this.ws = null;
      }

      this.setConnectionStatus('disconnected');
    }

    /**
     * Send message through WebSocket
     * @param {Object} message - Message to send
     */
    send(message) {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        try {
          this.ws.send(JSON.stringify(message));
        } catch (error) {
          console.error('Error sending WebSocket message:', error);
        }
      } else {
        // Queue message for later
        this.messageQueue.push(message);
        console.log('WebSocket not connected, message queued');
      }
    }

    /**
     * Handle incoming WebSocket message
     * @param {Object} message - Received message
     */
    handleMessage(message) {
      // Reset heartbeat timeout
      this.resetHeartbeat();

      // Log all messages for debugging
      console.log('🔌 WebSocket message received:', message.type, message);

      // Route message to appropriate handlers
      switch (message.type) {
        case 'dashboard_ok':
          console.log('✅ Dashboard client registered');
          EventBus.emit('websocket:registered');
          break;

        case 'nvr_online':
          EventBus.emit('nvr:online', message);
          EventBus.emit('nvr:status:changed', {
            ...message,
            status: 'online'
          });
          break;

        case 'nvr_offline':
          EventBus.emit('nvr:offline', message);
          EventBus.emit('nvr:status:changed', {
            ...message,
            status: 'offline'
          });
          break;

        case 'nvr_status_update':
          EventBus.emit('nvr:status:changed', message);
          break;

        case 'camera_status_update':
          EventBus.emit('camera:status:changed', message);
          break;

        default:
          // Emit generic message event
          EventBus.emit('websocket:message', message);
      }
    }

    /**
     * Attempt to reconnect with exponential backoff
     */
    attemptReconnect() {
      if (this.isManualClose || this.reconnectAttempts >= this.maxReconnectAttempts) {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('Max reconnection attempts reached');
          EventBus.emit('websocket:max_reconnect_attempts');
        }
        return;
      }

      this.reconnectAttempts++;
      this.setConnectionStatus('reconnecting');

      const delay = Math.min(
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1),
        this.maxReconnectDelay
      );

      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);
      
      EventBus.emit('websocket:reconnecting', {
        attempt: this.reconnectAttempts,
        maxAttempts: this.maxReconnectAttempts,
        delay
      });

      this.reconnectTimer = setTimeout(() => {
        this.connect();
      }, delay);
    }

    /**
     * Process queued messages
     */
    processMessageQueue() {
      while (this.messageQueue.length > 0) {
        const message = this.messageQueue.shift();
        this.send(message);
      }
    }

    /**
     * Start heartbeat detection
     */
    startHeartbeat() {
      this.resetHeartbeat();
    }

    /**
     * Reset heartbeat timeout
     */
    resetHeartbeat() {
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
      }

      this.heartbeatTimeout = setTimeout(() => {
        console.warn('⚠️ WebSocket heartbeat timeout');
        EventBus.emit('websocket:heartbeat_timeout');
        // Connection might be dead, try to reconnect
        if (this.ws) {
          this.ws.close();
        }
      }, this.heartbeatDelay * 2);
    }

    /**
     * Stop heartbeat detection
     */
    stopHeartbeat() {
      if (this.heartbeatTimeout) {
        clearTimeout(this.heartbeatTimeout);
        this.heartbeatTimeout = null;
      }
    }

    /**
     * Set connection status and emit event
     * @param {string} status - Connection status
     */
    setConnectionStatus(status) {
      if (this.connectionStatus !== status) {
        this.connectionStatus = status;
        EventBus.emit('websocket:status:changed', status);
      }
    }

    /**
     * Get connection status
     * @returns {string} - Connection status
     */
    getConnectionStatus() {
      return this.connectionStatus;
    }

    /**
     * Check if connected
     * @returns {boolean} - True if connected
     */
    isConnected() {
      return this.ws && this.ws.readyState === WebSocket.OPEN;
    }
  }

  // Create singleton instance
  const wsClient = new WebSocketClient();

  // Auto-connect on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      wsClient.connect();
    });
  } else {
    wsClient.connect();
  }

  // Reconnect on page visibility change
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && !wsClient.isConnected()) {
      console.log('Page visible, reconnecting WebSocket...');
      wsClient.connect();
    }
  });

  // Expose globally
  window.WebSocketClient = wsClient;

  console.log('✓ WebSocketClient initialized');

})();

