const { test, expect } = require('@playwright/test');

/**
 * Foundation Tests - Task 01
 * Tests for basic Express + Nunjucks setup
 */

test.describe('Foundation - Task 01', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to homepage before each test
    await page.goto('http://localhost:3000');
  });

  test('should load homepage successfully', async ({ page }) => {
    // Check if page loads
    await expect(page).toHaveTitle(/Dashboard/);
    
    // Check for main content
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
  });

  test('should have Bootstrap CSS loaded', async ({ page }) => {
    // Check if Bootstrap is loaded by looking for Bootstrap classes
    const card = page.locator('.card');
    await expect(card).toHaveCount(1);
    
    // Verify Bootstrap styles are applied
    const cardElement = await card.first();
    const backgroundColor = await cardElement.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(backgroundColor).toBeTruthy();
  });

  test('should have Bootstrap Icons available', async ({ page }) => {
    // Check if Bootstrap Icons CSS is loaded
    const iconLink = page.locator('link[href*="bootstrap-icons"]');
    await expect(iconLink).toHaveAttribute('rel', 'stylesheet');
  });

  test('should load main.css', async ({ page }) => {
    // Check if custom CSS is loaded
    const cssLink = page.locator('link[href="/css/main.css"]');
    await expect(cssLink).toHaveAttribute('rel', 'stylesheet');
  });

  test('should load app.js', async ({ page }) => {
    // Check if main JS file is loaded
    const scriptTag = page.locator('script[src="/js/app.js"]');
    await expect(scriptTag).toHaveCount(1);
    
    // Verify App object is available
    const appExists = await page.evaluate(() => typeof window.App !== 'undefined');
    expect(appExists).toBeTruthy();
  });

  test('should have correct meta tags', async ({ page }) => {
    // Check charset
    const charset = page.locator('meta[charset="UTF-8"]');
    await expect(charset).toHaveCount(1);
    
    // Check viewport
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', 'width=device-width, initial-scale=1.0');
    
    // Check theme color
    const themeColor = page.locator('meta[name="theme-color"]');
    await expect(themeColor).toHaveAttribute('content', '#0d6efd');
  });

  test('should have responsive layout', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    const container = page.locator('.container-fluid');
    await expect(container).toBeVisible();
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(container).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(container).toBeVisible();
  });

  test('should log initialization message', async ({ page }) => {
    // Listen for console messages
    const messages = [];
    page.on('console', msg => messages.push(msg.text()));
    
    // Reload page to capture console logs
    await page.reload();
    
    // Wait a bit for logs
    await page.waitForTimeout(500);
    
    // Check if initialization message was logged
    const hasInitMessage = messages.some(msg => 
      msg.includes('CCTV Dashboard initialized')
    );
    expect(hasInitMessage).toBeTruthy();
  });

  test('should support theme toggling', async ({ page }) => {
    // Check if theme is stored in localStorage
    await page.evaluate(() => {
      window.App.toggleTheme();
    });
    
    const theme = await page.evaluate(() => localStorage.getItem('theme'));
    expect(['light', 'dark']).toContain(theme);
  });

  test('should have proper HTML structure', async ({ page }) => {
    // Check for basic HTML5 structure
    const html = page.locator('html[lang="en"]');
    await expect(html).toHaveCount(1);
    
    const body = page.locator('body');
    await expect(body).toHaveClass(/d-flex flex-column min-vh-100/);
  });

  test('should take screenshot for visual verification', async ({ page }) => {
    // Take screenshot for manual verification
    await page.screenshot({ 
      path: 'tests/screenshots/foundation-homepage.png',
      fullPage: true 
    });
  });

});

test.describe('Server Routes', () => {
  
  test('should serve static files', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/css/main.css');
    expect(response.status()).toBe(200);
  });

  test('should handle 404 gracefully', async ({ page }) => {
    const response = await page.goto('http://localhost:3000/non-existent-page', {
      waitUntil: 'domcontentloaded'
    });
    expect(response.status()).toBe(404);
  });

});

