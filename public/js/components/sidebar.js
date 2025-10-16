/**
 * Sidebar Component
 */

(function() {
  'use strict';

  const Sidebar = {
    /**
     * Initialize sidebar
     */
    init() {
      this.setupMobileToggle();
      this.setupActiveLinks();
      this.setupCollapse();
      this.updateSystemStatus();
      console.log('✓ Sidebar component initialized');
    },

    /**
     * Setup mobile sidebar toggle
     */
    setupMobileToggle() {
      const sidebar = document.getElementById('sidebar');
      const sidebarToggle = document.getElementById('sidebar-toggle');
      const sidebarOverlay = document.getElementById('sidebar-overlay');

      if (!sidebar) return;

      // Create mobile menu button in navbar (if doesn't exist)
      this.createMobileMenuButton();

      // Toggle sidebar
      const toggleSidebar = () => {
        sidebar.classList.toggle('show');
        if (sidebarOverlay) {
          sidebarOverlay.classList.toggle('show');
        }
      };

      // Mobile menu button click
      const mobileMenuBtn = document.getElementById('mobile-menu-btn');
      if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
      }

      // Sidebar toggle button click
      if (sidebarToggle) {
        sidebarToggle.addEventListener('click', toggleSidebar);
      }

      // Overlay click to close
      if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', () => {
          sidebar.classList.remove('show');
          sidebarOverlay.classList.remove('show');
        });
      }

      // Close sidebar on link click (mobile)
      const sidebarLinks = sidebar.querySelectorAll('.nav-link');
      sidebarLinks.forEach(link => {
        link.addEventListener('click', () => {
          if (window.innerWidth < 992) {
            sidebar.classList.remove('show');
            if (sidebarOverlay) {
              sidebarOverlay.classList.remove('show');
            }
          }
        });
      });
    },

    /**
     * Create mobile menu button in navbar
     */
    createMobileMenuButton() {
      const navbar = document.querySelector('.navbar');
      if (!navbar) return;

      // Check if button already exists
      if (document.getElementById('mobile-menu-btn')) return;

      // Create button
      const button = document.createElement('button');
      button.id = 'mobile-menu-btn';
      button.className = 'btn btn-link nav-link d-lg-none order-first';
      button.setAttribute('aria-label', 'Toggle sidebar');
      button.innerHTML = '<i class="bi bi-list fs-4"></i>';

      // Insert as first item in navbar
      const navbarBrand = navbar.querySelector('.navbar-brand');
      if (navbarBrand) {
        navbarBrand.parentNode.insertBefore(button, navbarBrand);
      }
    },

    /**
     * Setup active link highlighting
     */
    setupActiveLinks() {
      const currentPath = window.location.pathname;
      const navLinks = document.querySelectorAll('.sidebar .nav-link');

      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        
        // Exact match for home
        if (href === '/' && currentPath === '/') {
          link.classList.add('active');
        }
        // Match for other pages
        else if (href !== '/' && currentPath.startsWith(href)) {
          link.classList.add('active');
        }
      });
    },

    /**
     * Setup collapsible menu groups (if needed)
     */
    setupCollapse() {
      // Placeholder for future collapsible groups
      // Can be implemented when we have nested navigation
    },

    /**
     * Update system status in sidebar footer
     */
    updateSystemStatus() {
      // This would typically fetch real data
      // For now, it's static content
      
      // Update every 30 seconds
      setInterval(() => {
        this.fetchSystemStatus();
      }, 30000);
    },

    /**
     * Fetch system status (mock for now)
     */
    async fetchSystemStatus() {
      // TODO: Replace with actual API call
      const mockStatus = {
        online: true,
        uptime: 99.8,
        storage: 65
      };

      // Update UI
      const uptimeEl = document.querySelector('.sidebar-footer .fw-semibold');
      if (uptimeEl) {
        // Updates would happen here
      }
    },

    /**
     * Toggle sidebar collapse (for future desktop collapse feature)
     */
    toggleCollapse() {
      const sidebar = document.getElementById('sidebar');
      const mainContent = document.querySelector('.main-content');
      
      if (sidebar) {
        sidebar.classList.toggle('collapsed');
      }
      
      if (mainContent) {
        mainContent.classList.toggle('sidebar-collapsed');
      }

      // Save preference
      const isCollapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('sidebarCollapsed', isCollapsed);
    },

    /**
     * Get sidebar state
     */
    getState() {
      const sidebar = document.getElementById('sidebar');
      return {
        visible: sidebar?.classList.contains('show'),
        collapsed: sidebar?.classList.contains('collapsed')
      };
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Sidebar.init());
  } else {
    Sidebar.init();
  }

  // Expose globally
  window.Sidebar = Sidebar;

})();

