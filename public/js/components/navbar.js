/**
 * Navbar Component
 */

(function() {
  'use strict';

  const Navbar = {
    /**
     * Initialize navbar
     */
    init() {
      this.setupThemeToggle();
      this.setupSearch();
      this.setupNotifications();
      this.updateActiveNavItem();
      console.log('✓ Navbar component initialized');
    },

    /**
     * Setup theme toggle functionality
     */
    setupThemeToggle() {
      const themeToggle = document.getElementById('theme-toggle');
      const themeIcon = document.getElementById('theme-icon');
      
      if (!themeToggle || !themeIcon) return;

      // Set initial icon
      this.updateThemeIcon();

      // Toggle theme on click
      themeToggle.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        this.updateThemeIcon();
        
        // Dispatch custom event for other components
        document.dispatchEvent(new CustomEvent('themeChanged', { 
          detail: { theme: isDark ? 'dark' : 'light' } 
        }));
      });
    },

    /**
     * Update theme icon based on current theme
     */
    updateThemeIcon() {
      const themeIcon = document.getElementById('theme-icon');
      if (!themeIcon) return;

      const isDark = document.body.classList.contains('dark-mode');
      themeIcon.className = isDark ? 'bi bi-moon-fill' : 'bi bi-sun-fill';
    },

    /**
     * Setup search functionality
     */
    setupSearch() {
      const searchInput = document.getElementById('navbar-search');
      if (!searchInput) return;

      // Keyboard shortcut: Ctrl/Cmd + K
      document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          searchInput.focus();
        }
      });

      // Search input handler
      let searchTimeout;
      searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const query = e.target.value.trim();
          if (query.length > 2) {
            this.performSearch(query);
          }
        }, 300);
      });

      // Submit handler
      searchInput.closest('form').addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        if (query) {
          this.performSearch(query);
        }
      });
    },

    /**
     * Perform search (placeholder for now)
     */
    performSearch(query) {
      console.log('Searching for:', query);
      // TODO: Implement actual search functionality
      // This would typically call an API or filter local data
    },

    /**
     * Setup notifications
     */
    setupNotifications() {
      const notificationBadge = document.getElementById('notification-badge');
      const notificationItems = document.querySelectorAll('.notification-item.unread');

      // Mark notification as read on click
      notificationItems.forEach(item => {
        item.addEventListener('click', (e) => {
          item.classList.remove('unread');
          this.updateNotificationCount();
        });
      });

      // Mark all as read button (if exists)
      const markAllBtn = document.getElementById('mark-all-read');
      if (markAllBtn) {
        markAllBtn.addEventListener('click', () => {
          notificationItems.forEach(item => item.classList.remove('unread'));
          this.updateNotificationCount();
        });
      }
    },

    /**
     * Update notification count badge
     */
    updateNotificationCount() {
      const notificationBadge = document.getElementById('notification-badge');
      const unreadItems = document.querySelectorAll('.notification-item.unread');
      const count = unreadItems.length;

      if (notificationBadge) {
        if (count > 0) {
          notificationBadge.textContent = count;
          notificationBadge.style.display = '';
        } else {
          notificationBadge.style.display = 'none';
        }
      }
    },

    /**
     * Update active nav item based on current page
     */
    updateActiveNavItem() {
      const currentPath = window.location.pathname;
      const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
      
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.startsWith(href) && href !== '/') {
          link.classList.add('active');
        } else if (href === '/' && currentPath === '/') {
          link.classList.add('active');
        }
      });
    },

    /**
     * Add notification programmatically
     */
    addNotification(notification) {
      const { type, title, message, time } = notification;
      
      const icons = {
        success: 'bi-check-circle-fill text-success',
        warning: 'bi-exclamation-triangle-fill text-warning',
        danger: 'bi-x-circle-fill text-danger',
        info: 'bi-info-circle-fill text-info'
      };

      const iconClass = icons[type] || icons.info;

      // Create notification HTML
      const notificationHTML = `
        <li>
          <a class="dropdown-item notification-item unread" href="#">
            <div class="d-flex">
              <div class="flex-shrink-0">
                <i class="bi ${iconClass} fs-4"></i>
              </div>
              <div class="flex-grow-1 ms-3">
                <div class="fw-semibold">${title}</div>
                <div class="small text-muted">${message}</div>
                <div class="small text-muted">${time || 'Just now'}</div>
              </div>
            </div>
          </a>
        </li>
        <li><hr class="dropdown-divider"></li>
      `;

      // Find notification dropdown
      const dropdown = document.querySelector('.notification-dropdown');
      if (dropdown) {
        const firstItem = dropdown.querySelector('li:nth-child(3)');
        if (firstItem) {
          firstItem.insertAdjacentHTML('beforebegin', notificationHTML);
          this.updateNotificationCount();
        }
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Navbar.init());
  } else {
    Navbar.init();
  }

  // Expose globally
  window.Navbar = Navbar;

})();

