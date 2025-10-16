const { test, expect } = require('@playwright/test');

/**
 * Sidebar & Footer Components Tests - Tasks 03 & 04
 */

test.describe('Sidebar Component - Task 03', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display sidebar with navigation menu', async ({ page }) => {
    const sidebar = page.locator('.sidebar');
    await expect(sidebar).toBeVisible();
  });

  test('should have all main navigation links', async ({ page }) => {
    const navLinks = [
      { href: '/', text: 'Dashboard' },
      { href: '/nvr-management', text: 'NVR Management' },
      { href: '/camera-management', text: 'Camera Management' },
      { href: '/map', text: 'Location Map' },
      { href: '/analytics', text: 'Analytics' },
      { href: '/compliance', text: 'Compliance' },
      { href: '/security', text: 'Security Monitoring' },
      { href: '/alerts', text: 'Alerts' },
      { href: '/reports', text: 'Reports' },
      { href: '/settings', text: 'Settings' }
    ];

    for (const link of navLinks) {
      const navLink = page.locator(`.sidebar a[href="${link.href}"]`);
      await expect(navLink).toBeVisible();
      await expect(navLink).toContainText(link.text);
    }
  });

  test('should have icons for all navigation items', async ({ page }) => {
    const navItems = page.locator('.sidebar .nav-link');
    const count = await navItems.count();
    
    for (let i = 0; i < count; i++) {
      const icon = navItems.nth(i).locator('i.bi');
      await expect(icon).toBeVisible();
    }
  });

  test('should highlight active page', async ({ page }) => {
    const activeLink = page.locator('.sidebar .nav-link.active');
    await expect(activeLink).toBeVisible();
    await expect(activeLink).toHaveAttribute('href', '/');
  });

  test('should navigate to different pages', async ({ page }) => {
    // Click on NVR Management
    await page.locator('.sidebar a[href="/nvr-management"]').click();
    await expect(page).toHaveURL('/nvr-management');
    
    // Check if the link is now active
    const activeLink = page.locator('.sidebar .nav-link.active');
    await expect(activeLink).toContainText('NVR Management');
  });

  test('should display section titles', async ({ page }) => {
    const sectionTitles = ['MONITORING', 'ANALYTICS', 'MANAGEMENT', 'SYSTEM'];
    
    for (const title of sectionTitles) {
      const section = page.locator('.nav-section-title', { hasText: title });
      await expect(section).toBeVisible();
    }
  });

  test('should show alerts badge', async ({ page }) => {
    const alertsLink = page.locator('.sidebar a[href="/alerts"]');
    const badge = alertsLink.locator('.badge');
    
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('3');
    await expect(badge).toHaveClass(/bg-danger/);
  });

  test('should display system status widget', async ({ page }) => {
    const statusWidget = page.locator('.sidebar-footer');
    await expect(statusWidget).toBeVisible();
    
    // Check for status indicator
    const statusIndicator = statusWidget.locator('.status-indicator');
    await expect(statusIndicator).toBeVisible();
    
    // Check for metrics
    await expect(statusWidget).toContainText('Uptime');
    await expect(statusWidget).toContainText('Storage');
  });

  test('should be hidden on mobile by default', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const sidebar = page.locator('.sidebar');
    
    // Check if sidebar is transformed off-screen
    const transform = await sidebar.evaluate(el => 
      window.getComputedStyle(el).transform
    );
    
    expect(transform).toContain('matrix'); // Has transform applied
  });

  test('should show mobile menu button', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    await expect(mobileMenuBtn).toBeVisible();
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const sidebar = page.locator('.sidebar');
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    
    // Click to show sidebar
    await mobileMenuBtn.click();
    await page.waitForTimeout(400);
    await expect(sidebar).toHaveClass(/show/);
    
    // Click overlay to hide
    const overlay = page.locator('.sidebar-overlay');
    await overlay.click();
    await page.waitForTimeout(400);
    await expect(sidebar).not.toHaveClass(/show/);
  });

  test('should show overlay when sidebar is open on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const mobileMenuBtn = page.locator('#mobile-menu-btn');
    const overlay = page.locator('.sidebar-overlay');
    
    // Open sidebar
    await mobileMenuBtn.click();
    await page.waitForTimeout(200);
    
    await expect(overlay).toHaveClass(/show/);
  });

});

test.describe('Footer Component - Task 04', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display footer', async ({ page }) => {
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
  });

  test('should show copyright text', async ({ page }) => {
    const copyright = page.locator('.footer', { hasText: '© 2024 CCTV Dashboard' });
    await expect(copyright).toBeVisible();
  });

  test('should have quick links', async ({ page }) => {
    const links = [
      { href: '/help', text: 'Help' },
      { href: '/docs', text: 'Documentation' },
      { href: '/contact', text: 'Contact' },
      { href: '/privacy', text: 'Privacy' }
    ];

    for (const link of links) {
      const footerLink = page.locator(`.footer a[href="${link.href}"]`);
      await expect(footerLink).toBeVisible();
      await expect(footerLink).toContainText(link.text);
    }
  });

  test('should display version number', async ({ page }) => {
    const version = page.locator('.footer', { hasText: 'Version 1.0.0' });
    await expect(version).toBeVisible();
  });

  test('should show online status badge', async ({ page }) => {
    const statusBadge = page.locator('.footer .badge.bg-success');
    await expect(statusBadge).toBeVisible();
    await expect(statusBadge).toContainText('Online');
  });

  test('should be positioned at bottom', async ({ page }) => {
    const footer = page.locator('.footer');
    
    // Check if footer has mt-auto class (Bootstrap flex utility)
    await expect(footer).toHaveClass(/mt-auto/);
  });

  test('should adapt to main content margin', async ({ page }) => {
    const footer = page.locator('.footer');
    
    // On desktop, footer should have left margin for sidebar
    const marginLeft = await footer.evaluate(el => 
      window.getComputedStyle(el).marginLeft
    );
    
    // Should have margin (converted from 260px sidebar width)
    expect(parseInt(marginLeft)).toBeGreaterThan(0);
  });

  test('should not have sidebar margin on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const footer = page.locator('.footer');
    const marginLeft = await footer.evaluate(el => 
      window.getComputedStyle(el).marginLeft
    );
    
    expect(parseInt(marginLeft)).toBe(0);
  });

  test('should stack content on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const footer = page.locator('.footer');
    await expect(footer).toBeVisible();
    
    // All columns should be visible even on mobile
    const cols = footer.locator('.col-md-4');
    await expect(cols).toHaveCount(3);
  });

});

test.describe('Full Layout Integration', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should have complete layout: navbar, sidebar, content, footer', async ({ page }) => {
    const navbar = page.locator('.navbar');
    const sidebar = page.locator('.sidebar');
    const mainContent = page.locator('.main-content');
    const footer = page.locator('.footer');
    
    await expect(navbar).toBeVisible();
    await expect(sidebar).toBeVisible();
    await expect(mainContent).toBeVisible();
    await expect(footer).toBeVisible();
  });

  test('should have proper spacing between components', async ({ page }) => {
    // Navbar should be fixed top
    const navbar = page.locator('.navbar');
    await expect(navbar).toHaveClass(/fixed-top/);
    
    // Sidebar should start after navbar
    const sidebar = page.locator('.sidebar');
    const sidebarTop = await sidebar.evaluate(el => 
      window.getComputedStyle(el).top
    );
    expect(sidebarTop).toBe('56px'); // Navbar height
  });

  test('should maintain layout on different screen sizes', async ({ page }) => {
    const sizes = [
      { width: 1920, height: 1080, name: 'Desktop' },
      { width: 1366, height: 768, name: 'Laptop' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 375, height: 667, name: 'Mobile' }
    ];

    for (const size of sizes) {
      await page.setViewportSize({ width: size.width, height: size.height });
      
      const navbar = page.locator('.navbar');
      const footer = page.locator('.footer');
      
      await expect(navbar).toBeVisible();
      await expect(footer).toBeVisible();
    }
  });

  test('should work with dark mode', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    
    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(300);
    
    // Check if body has dark-mode class
    const body = page.locator('body');
    await expect(body).toHaveClass(/dark-mode/);
    
    // All components should still be visible
    await expect(page.locator('.navbar')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('.footer')).toBeVisible();
  });

  test('should take full layout screenshots', async ({ page }) => {
    // Light mode
    await page.screenshot({ 
      path: 'tests/screenshots/full-layout-light.png',
      fullPage: true 
    });
    
    // Dark mode
    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(300);
    await page.screenshot({ 
      path: 'tests/screenshots/full-layout-dark.png',
      fullPage: true 
    });
    
    // Mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.screenshot({ 
      path: 'tests/screenshots/full-layout-mobile.png',
      fullPage: true 
    });
  });

});

