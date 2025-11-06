/**
 * Event Bus - Decoupled event communication system
 * 
 * Provides pub/sub pattern for component communication
 */

(function() {
  'use strict';

  class EventBus {
    constructor() {
      this.listeners = new Map();
      this.eventHistory = [];
      this.maxHistorySize = 100;
    }

    /**
     * Subscribe to an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     * @returns {Function} - Unsubscribe function
     */
    on(event, callback) {
      if (typeof callback !== 'function') {
        console.error('EventBus.on: callback must be a function');
        return () => {};
      }

      if (!this.listeners.has(event)) {
        this.listeners.set(event, []);
      }

      this.listeners.get(event).push(callback);

      // Return unsubscribe function
      return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event - Event name
     * @param {Function} callback - Callback function to remove
     */
    off(event, callback) {
      if (!this.listeners.has(event)) {
        return;
      }

      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      
      if (index > -1) {
        callbacks.splice(index, 1);
      }

      // Clean up empty event arrays
      if (callbacks.length === 0) {
        this.listeners.delete(event);
      }
    }

    /**
     * Emit an event
     * @param {string} event - Event name
     * @param {*} data - Event data
     */
    emit(event, data) {
      // Add to history
      this.eventHistory.push({
        event,
        data,
        timestamp: new Date()
      });

      // Limit history size
      if (this.eventHistory.length > this.maxHistorySize) {
        this.eventHistory.shift();
      }

      // Notify listeners
      const callbacks = this.listeners.get(event) || [];
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }

    /**
     * Subscribe to an event once
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    once(event, callback) {
      const wrapper = (data) => {
        callback(data);
        this.off(event, wrapper);
      };
      this.on(event, wrapper);
    }

    /**
     * Remove all listeners for an event
     * @param {string} event - Event name (optional, removes all if not provided)
     */
    removeAllListeners(event) {
      if (event) {
        this.listeners.delete(event);
      } else {
        this.listeners.clear();
      }
    }

    /**
     * Get event history
     * @param {string} event - Filter by event name (optional)
     * @returns {Array} - Event history
     */
    getHistory(event) {
      if (event) {
        return this.eventHistory.filter(e => e.event === event);
      }
      return [...this.eventHistory];
    }

    /**
     * Clear event history
     */
    clearHistory() {
      this.eventHistory = [];
    }
  }

  // Create singleton instance
  const eventBus = new EventBus();

  // Expose globally
  window.EventBus = eventBus;

  console.log('✓ EventBus initialized');

})();

