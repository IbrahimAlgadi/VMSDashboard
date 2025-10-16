const { test, expect } = require('@playwright/test');

/**
 * Navbar Component Tests - Task 02
 */

test.describe('Navbar Component - Task 02', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should display navbar with brand logo', async ({ page }) => {
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();
    
    const brand = page.locator('.navbar-brand');
    await expect(brand).toBeVisible();
    await expect(brand).toContainText('CCTV Dashboard');
    
    // Check for camera icon
    const icon = brand.locator('i.bi-camera-video-fill');
    await expect(icon).toBeVisible();
  });

  test('should have search bar', async ({ page }) => {
    const searchInput = page.locator('#navbar-search');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toHaveAttribute('placeholder', /Search/i);
  });

  test('should have theme toggle button', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    await expect(themeToggle).toBeVisible();
    
    const themeIcon = page.locator('#theme-icon');
    await expect(themeIcon).toBeVisible();
  });

  test('should toggle theme when clicking theme button', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    const body = page.locator('body');
    
    // Check initial state (light mode)
    await expect(body).not.toHaveClass(/dark-mode/);
    
    // Click to toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(100);
    await expect(body).toHaveClass(/dark-mode/);
    
    // Click again to toggle back to light mode
    await themeToggle.click();
    await page.waitForTimeout(100);
    await expect(body).not.toHaveClass(/dark-mode/);
  });

  test('should display notification bell with badge', async ({ page }) => {
    const notificationIcon = page.locator('#notifications-dropdown');
    await expect(notificationIcon).toBeVisible();
    
    const badge = page.locator('#notification-badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('3');
  });

  test('should show notifications dropdown on click', async ({ page }) => {
    const notificationIcon = page.locator('#notifications-dropdown');
    
    // Click to open dropdown
    await notificationIcon.click();
    
    // Wait for dropdown to be visible
    const dropdown = page.locator('.notification-dropdown');
    await expect(dropdown).toBeVisible();
    
    // Check for notification items
    const notificationItems = page.locator('.notification-item');
    await expect(notificationItems).toHaveCount(3);
  });

  test('should display user menu with avatar', async ({ page }) => {
    const userDropdown = page.locator('#user-dropdown');
    await expect(userDropdown).toBeVisible();
    await expect(userDropdown).toContainText('Admin User');
    
    // Check for avatar image
    const avatar = userDropdown.locator('img');
    await expect(avatar).toBeVisible();
    await expect(avatar).toHaveAttribute('alt', 'User');
  });

  test('should show user dropdown menu on click', async ({ page }) => {
    const userDropdown = page.locator('#user-dropdown');
    
    // Click to open dropdown
    await userDropdown.click();
    
    // Check for menu items
    const profileLink = page.locator('a[href="/profile"]');
    await expect(profileLink).toBeVisible();
    
    const settingsLink = page.locator('a[href="/settings"]');
    await expect(settingsLink).toBeVisible();
    
    const logoutLink = page.locator('a[href="/login"]');
    await expect(logoutLink).toBeVisible();
  });

  test('should have mobile hamburger menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const toggleButton = page.locator('.navbar-toggler');
    await expect(toggleButton).toBeVisible();
  });

  test('should toggle mobile menu on hamburger click', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    const toggleButton = page.locator('.navbar-toggler');
    const navbarCollapse = page.locator('#navbarContent');
    
    // Initially collapsed
    await expect(navbarCollapse).not.toHaveClass(/show/);
    
    // Click to expand
    await toggleButton.click();
    await page.waitForTimeout(500);
    await expect(navbarCollapse).toHaveClass(/show/);
  });

  test('should have functional search with keyboard shortcut', async ({ page }) => {
    const searchInput = page.locator('#navbar-search');
    
    // Press Ctrl+K (Windows) or Cmd+K (Mac)
    await page.keyboard.press('Control+KeyK');
    
    // Check if search input is focused
    await expect(searchInput).toBeFocused();
  });

  test('should update notification count when marking as read', async ({ page }) => {
    // Open notifications dropdown
    await page.locator('#notifications-dropdown').click();
    
    // Click first notification
    const firstNotification = page.locator('.notification-item.unread').first();
    await firstNotification.click();
    
    // Wait for update
    await page.waitForTimeout(300);
    
    // Badge should update (or be hidden if count is 0)
    const badge = page.locator('#notification-badge');
    const badgeText = await badge.textContent();
    expect(parseInt(badgeText) || 0).toBeLessThan(3);
  });

  test('should be responsive on different screen sizes', async ({ page }) => {
    const navbar = page.locator('.navbar');
    
    // Desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(navbar).toBeVisible();
    
    // Tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(navbar).toBeVisible();
    
    // Mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(navbar).toBeVisible();
  });

  test('should have proper navbar styling', async ({ page }) => {
    const navbar = page.locator('.navbar');
    
    // Check for Bootstrap classes
    await expect(navbar).toHaveClass(/navbar-expand-lg/);
    await expect(navbar).toHaveClass(/navbar-dark/);
    await expect(navbar).toHaveClass(/bg-primary/);
    await expect(navbar).toHaveClass(/fixed-top/);
  });

  test('should persist theme preference in localStorage', async ({ page }) => {
    const themeToggle = page.locator('#theme-toggle');
    
    // Toggle to dark mode
    await themeToggle.click();
    await page.waitForTimeout(100);
    
    // Check localStorage
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(theme).toBe('dark');
    
    // Reload page
    await page.reload();
    await page.waitForTimeout(300);
    
    // Should still be dark mode
    const body = page.locator('body');
    await expect(body).toHaveClass(/dark-mode/);
  });

  test('should take screenshot for visual verification', async ({ page }) => {
    await page.screenshot({ 
      path: 'tests/screenshots/navbar-light.png',
      fullPage: false 
    });
    
    // Take dark mode screenshot
    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(300);
    await page.screenshot({ 
      path: 'tests/screenshots/navbar-dark.png',
      fullPage: false 
    });
  });

});

