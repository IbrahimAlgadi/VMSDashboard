/**
 * CCTV Dashboard - Main Application
 */

(function() {
  'use strict';

  /**
   * Application object
   */
  const App = {
    /**
     * Initialize the application
     */
    init() {
      console.log('🚀 CCTV Dashboard initialized');
      this.setupEventListeners();
      this.loadTheme();
    },

    /**
     * Setup global event listeners
     */
    setupEventListeners() {
      // Page load event
      document.addEventListener('DOMContentLoaded', () => {
        console.log('✓ DOM Content Loaded');
        this.showPageLoadAnimation();
      });

      // Theme toggle (will be implemented later)
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', () => this.toggleTheme());
      }
    },

    /**
     * Show page load animation
     */
    showPageLoadAnimation() {
      document.body.classList.add('fade-in');
    },

    /**
     * Load theme from localStorage
     */
    loadTheme() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
      }
    },

    /**
     * Toggle theme
     */
    toggleTheme() {
      const isDark = document.body.classList.toggle('dark-mode');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      console.log(`Theme switched to: ${isDark ? 'dark' : 'light'}`);
    },

    /**
     * Utility: Format date
     */
    formatDate(date) {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    },

    /**
     * Utility: Format time
     */
    formatTime(date) {
      return new Date(date).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  // Initialize app
  App.init();

  // Expose App globally
  window.App = App;

})();

