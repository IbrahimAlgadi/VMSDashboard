/**
 * Connection Status Component - WebSocket connection indicator
 * 
 * Shows connection status in the navbar
 */

(function() {
  'use strict';

  const ConnectionStatus = {
    element: null,
    status: 'disconnected',

    /**
     * Initialize connection status indicator
     */
    init() {
      this.createIndicator();
      this.setupEventListeners();
      console.log('✓ ConnectionStatus initialized');
    },

    /**
     * Create connection status indicator
     */
    createIndicator() {
      // Find navbar or create indicator
      const navbar = document.querySelector('.navbar');
      if (!navbar) {
        return;
      }

      // Check if indicator already exists
      this.element = document.getElementById('connection-status');
      if (this.element) {
        return;
      }

      // Create indicator
      this.element = document.createElement('div');
      this.element.id = 'connection-status';
      this.element.className = 'connection-status';
      this.element.setAttribute('title', 'WebSocket Connection Status');
      this.element.setAttribute('role', 'status');
      this.element.setAttribute('aria-live', 'polite');

      // Add to navbar (find a good spot, usually near user menu)
      const navbarNav = navbar.querySelector('.navbar-nav');
      if (navbarNav) {
        const li = document.createElement('li');
        li.className = 'nav-item';
        li.appendChild(this.element);
        navbarNav.appendChild(li);
      } else {
        navbar.appendChild(this.element);
      }

      this.addStyles();
      this.updateStatus('disconnected');
    },

    /**
     * Add styles
     */
    addStyles() {
      if (document.getElementById('connection-status-styles')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'connection-status-styles';
      style.textContent = `
        .connection-status {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 13px;
          cursor: default;
        }

        .connection-status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }

        .connection-status.connected .connection-status-dot {
          background-color: #28a745;
        }

        .connection-status.connecting .connection-status-dot {
          background-color: #ffc107;
        }

        .connection-status.reconnecting .connection-status-dot {
          background-color: #ffc107;
        }

        .connection-status.disconnected .connection-status-dot {
          background-color: #dc3545;
          animation: none;
        }

        .connection-status-text {
          font-size: 12px;
          color: #666;
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `;
      document.head.appendChild(style);
    },

    /**
     * Setup event listeners
     */
    setupEventListeners() {
      // Listen to WebSocket status changes
      EventBus.on('websocket:status:changed', (status) => {
        this.updateStatus(status);
      });
    },

    /**
     * Update connection status
     * @param {string} status - Connection status
     */
    updateStatus(status) {
      if (!this.element) {
        return;
      }

      this.status = status;

      // Remove all status classes
      this.element.classList.remove('connected', 'connecting', 'reconnecting', 'disconnected');

      // Add current status class
      this.element.classList.add(status);

      // Update text and tooltip
      const statusText = {
        connected: 'Connected',
        connecting: 'Connecting...',
        reconnecting: 'Reconnecting...',
        disconnected: 'Disconnected'
      };

      this.element.innerHTML = `
        <span class="connection-status-dot" aria-hidden="true"></span>
        <span class="connection-status-text">${statusText[status] || 'Unknown'}</span>
      `;

      this.element.setAttribute('title', `WebSocket: ${statusText[status] || 'Unknown'}`);
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ConnectionStatus.init();
    });
  } else {
    ConnectionStatus.init();
  }

  // Expose globally
  window.ConnectionStatus = ConnectionStatus;

})();

