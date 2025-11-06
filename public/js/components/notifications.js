/**
 * Notifications Component - Toast notification system
 * 
 * Provides toast notifications for status changes and alerts
 */

(function() {
  'use strict';

  const Notifications = {
    container: null,
    queue: [],
    maxNotifications: 5,
    defaultDuration: 5000,

    /**
     * Initialize notifications
     */
    init() {
      this.createContainer();
      console.log('✓ Notifications initialized');
    },

    /**
     * Create notification container
     */
    createContainer() {
      if (this.container) {
        return;
      }

      this.container = document.createElement('div');
      this.container.id = 'notifications-container';
      this.container.className = 'notifications-container';
      this.container.setAttribute('aria-live', 'polite');
      this.container.setAttribute('aria-atomic', 'true');
      document.body.appendChild(this.container);

      // Add styles
      this.addStyles();
    },

    /**
     * Add notification styles
     */
    addStyles() {
      if (document.getElementById('notifications-styles')) {
        return;
      }

      const style = document.createElement('style');
      style.id = 'notifications-styles';
      style.textContent = `
        .notifications-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-width: 400px;
          pointer-events: none;
        }

        .notification {
          background: white;
          border-radius: 8px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          display: flex;
          align-items: flex-start;
          gap: 12px;
          pointer-events: auto;
          animation: slideInRight 0.3s ease-out;
          border-left: 4px solid;
          min-width: 300px;
        }

        .notification.success {
          border-left-color: #28a745;
        }

        .notification.error {
          border-left-color: #dc3545;
        }

        .notification.warning {
          border-left-color: #ffc107;
        }

        .notification.info {
          border-left-color: #17a2b8;
        }

        .notification-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        .notification-content {
          flex: 1;
        }

        .notification-title {
          font-weight: 600;
          margin-bottom: 4px;
          font-size: 14px;
        }

        .notification-message {
          font-size: 13px;
          color: #666;
          line-height: 1.4;
        }

        .notification-close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .notification-close:hover {
          color: #333;
        }

        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes slideOutRight {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }

        .notification.removing {
          animation: slideOutRight 0.3s ease-out forwards;
        }
      `;
      document.head.appendChild(style);
    },

    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     * @param {number} duration - Duration in milliseconds
     * @param {string} title - Notification title (optional)
     */
    show(message, type = 'info', duration = this.defaultDuration, title = null) {
      this.createContainer();

      // Limit number of notifications
      if (this.container.children.length >= this.maxNotifications) {
        const oldest = this.container.firstElementChild;
        if (oldest) {
          this.remove(oldest);
        }
      }

      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      
      const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
      };

      notification.innerHTML = `
        <span class="notification-icon">${icons[type] || icons.info}</span>
        <div class="notification-content">
          ${title ? `<div class="notification-title">${this.escapeHtml(title)}</div>` : ''}
          <div class="notification-message">${this.escapeHtml(message)}</div>
        </div>
        <button class="notification-close" aria-label="Close">&times;</button>
      `;

      // Close button handler
      const closeBtn = notification.querySelector('.notification-close');
      closeBtn.addEventListener('click', () => {
        this.remove(notification);
      });

      // Auto-remove after duration
      let timeoutId = null;
      if (duration > 0) {
        timeoutId = setTimeout(() => {
          this.remove(notification);
        }, duration);
      }

      // Store timeout ID for cleanup
      notification.dataset.timeoutId = timeoutId;

      this.container.appendChild(notification);

      return notification;
    },

    /**
     * Show success notification
     * @param {string} message - Message
     * @param {string} title - Title (optional)
     * @param {number} duration - Duration (optional)
     */
    success(message, title = null, duration = this.defaultDuration) {
      return this.show(message, 'success', duration, title);
    },

    /**
     * Show error notification
     * @param {string} message - Message
     * @param {string} title - Title (optional)
     * @param {number} duration - Duration (optional)
     */
    error(message, title = null, duration = this.defaultDuration) {
      return this.show(message, 'error', duration, title);
    },

    /**
     * Show warning notification
     * @param {string} message - Message
     * @param {string} title - Title (optional)
     * @param {number} duration - Duration (optional)
     */
    warning(message, title = null, duration = this.defaultDuration) {
      return this.show(message, 'warning', duration, title);
    },

    /**
     * Show info notification
     * @param {string} message - Message
     * @param {string} title - Title (optional)
     * @param {number} duration - Duration (optional)
     */
    info(message, title = null, duration = this.defaultDuration) {
      return this.show(message, 'info', duration, title);
    },

    /**
     * Remove notification
     * @param {HTMLElement} notification - Notification element
     */
    remove(notification) {
      if (!notification || !notification.parentNode) {
        return;
      }

      // Clear timeout if exists
      if (notification.dataset.timeoutId) {
        clearTimeout(parseInt(notification.dataset.timeoutId));
      }

      // Add removing class for animation
      notification.classList.add('removing');

      // Remove after animation
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    },

    /**
     * Clear all notifications
     */
    clear() {
      if (!this.container) {
        return;
      }

      const notifications = Array.from(this.container.children);
      notifications.forEach(notification => {
        this.remove(notification);
      });
    },

    /**
     * Escape HTML
     * @param {string} text - Text to escape
     * @returns {string} - Escaped text
     */
    escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Notifications.init();
    });
  } else {
    Notifications.init();
  }

  // Expose globally
  window.Notifications = Notifications;

})();

