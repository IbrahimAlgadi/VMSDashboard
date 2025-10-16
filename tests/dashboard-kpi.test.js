const { test, expect } = require('@playwright/test');

/**
 * Dashboard KPI Cards Tests - Task 05
 */

test.describe('Dashboard KPI Cards - Task 05', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
    // Wait for data to load
    await page.waitForTimeout(1000);
  });

  test('should display dashboard page with header', async ({ page }) => {
    const header = page.locator('.dashboard-header h1');
    await expect(header).toBeVisible();
    await expect(header).toContainText('Dashboard');
  });

  test('should have refresh button', async ({ page }) => {
    const refreshBtn = page.locator('#refresh-dashboard');
    await expect(refreshBtn).toBeVisible();
    await expect(refreshBtn).toContainText('Refresh');
  });

  test('should display all 4 KPI cards', async ({ page }) => {
    const kpiCards = page.locator('.stat-card');
    await expect(kpiCards).toHaveCount(4);
  });

  test('should display Total NVRs card', async ({ page }) => {
    const card = page.locator('#total-nvrs');
    await expect(card).toBeVisible();
    
    // Check title
    await expect(card.locator('h6')).toContainText('Total NVRs');
    
    // Check icon
    const icon = card.locator('.bi-hdd-rack');
    await expect(icon).toBeVisible();
    
    // Check value is loaded (not 0)
    await page.waitForTimeout(1500);
    const value = await card.locator('.stat-card-value').textContent();
    expect(parseInt(value)).toBeGreaterThan(0);
  });

  test('should display Total Cameras card', async ({ page }) => {
    const card = page.locator('#total-cameras');
    await expect(card).toBeVisible();
    
    await expect(card.locator('h6')).toContainText('Total Cameras');
    await expect(card.locator('.bi-camera-video')).toBeVisible();
    
    await page.waitForTimeout(1500);
    const value = await card.locator('.stat-card-value').textContent();
    expect(parseInt(value)).toBeGreaterThan(0);
  });

  test('should display Offline Cameras card', async ({ page }) => {
    const card = page.locator('#offline-cameras');
    await expect(card).toBeVisible();
    
    await expect(card.locator('h6')).toContainText('Offline Cameras');
    await expect(card.locator('.bi-exclamation-triangle')).toBeVisible();
  });

  test('should display Active Alerts card', async ({ page }) => {
    const card = page.locator('#active-alerts');
    await expect(card).toBeVisible();
    
    await expect(card.locator('h6')).toContainText('Active Alerts');
    await expect(card.locator('.bi-bell')).toBeVisible();
  });

  test('should animate KPI values', async ({ page }) => {
    const card = page.locator('#total-nvrs');
    const valueEl = card.locator('.stat-card-value');
    
    // Initial value should be 0
    const initialValue = await valueEl.textContent();
    expect(initialValue).toBe('0');
    
    // After animation, should be > 0
    await page.waitForTimeout(1500);
    const finalValue = await valueEl.textContent();
    expect(parseInt(finalValue)).toBeGreaterThan(0);
  });

  test('should show change indicators on KPI cards', async ({ page }) => {
    const changes = page.locator('.stat-card-change');
    await expect(changes.first()).toBeVisible();
    
    // Check for different change types
    const positiveChange = page.locator('.stat-card-change.positive');
    await expect(positiveChange.first()).toBeVisible();
  });

  test('should have hover effect on KPI cards', async ({ page }) => {
    const card = page.locator('#total-nvrs');
    
    // Get initial position
    const initialBox = await card.boundingBox();
    
    // Hover over card
    await card.hover();
    await page.waitForTimeout(400);
    
    // Card should have hover effect (shadow, transform)
    const hasTransform = await card.evaluate(el => {
      const transform = window.getComputedStyle(el).transform;
      return transform !== 'none';
    });
    
    expect(hasTransform).toBeTruthy();
  });

  test('should make KPI cards clickable', async ({ page }) => {
    const card = page.locator('#total-nvrs');
    
    // Cards should have cursor pointer
    const cursor = await card.evaluate(el => 
      window.getComputedStyle(el).cursor
    );
    expect(cursor).toBe('pointer');
  });

  test('should display quick actions section', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const quickActions = page.locator('#quick-actions-container');
    await expect(quickActions).toBeVisible();
    
    // Should have 4 quick action cards
    const actionCards = page.locator('.quick-action-card');
    await expect(actionCards).toHaveCount(4);
  });

  test('should have clickable quick action cards', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const firstAction = page.locator('.quick-action-card').first();
    await expect(firstAction).toBeVisible();
    
    // Should have href attribute
    const href = await firstAction.getAttribute('href');
    expect(href).toBeTruthy();
  });

  test('should display system summary', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const summary = page.locator('#dashboard-summary');
    await expect(summary).toBeVisible();
    
    // Should have summary items
    const summaryItems = summary.locator('.summary-item');
    await expect(summaryItems).toHaveCount(5);
    
    // Check for specific items
    await expect(summary).toContainText('Regions');
    await expect(summary).toContainText('Storage');
    await expect(summary).toContainText('Uptime');
  });

  test('should display regional breakdown', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const regionBreakdown = page.locator('#region-breakdown');
    await expect(regionBreakdown).toBeVisible();
    
    // Should have region items
    const regionItems = page.locator('.region-item');
    await expect(regionItems).toHaveCount(5);
    
    // Check for region names
    await expect(regionBreakdown).toContainText('Riyadh');
    await expect(regionBreakdown).toContainText('Jeddah');
  });

  test('should show online/offline stats per region', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const firstRegion = page.locator('.region-item').first();
    
    // Should have online indicator
    const onlineStat = firstRegion.locator('.region-stat.online');
    await expect(onlineStat).toBeVisible();
    
    // Should have check icon
    await expect(onlineStat.locator('.bi-check-circle-fill')).toBeVisible();
  });

  test('should load data from JSON file', async ({ page }) => {
    // Listen for fetch requests
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('dashboard-data.json')) {
        responses.push(response);
      }
    });
    
    await page.reload();
    await page.waitForTimeout(1000);
    
    expect(responses.length).toBeGreaterThan(0);
    expect(responses[0].status()).toBe(200);
  });

  test('should refresh data on button click', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    const refreshBtn = page.locator('#refresh-dashboard');
    
    // Click refresh
    await refreshBtn.click();
    
    // Wait for console message
    await page.waitForTimeout(500);
    
    // Check if page refreshed (spinner should appear briefly)
    const lastRefreshTime = page.locator('#last-refresh-time');
    await expect(lastRefreshTime).toBeVisible();
  });

  test('should handle errors gracefully', async ({ page }) => {
    // Intercept network request and make it fail
    await page.route('**/dashboard-data.json', route => route.abort());
    
    await page.reload();
    await page.waitForTimeout(1000);
    
    // Should show error message
    const errorAlert = page.locator('.alert-danger');
    await expect(errorAlert).toBeVisible();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1500);
    
    // All KPI cards should still be visible
    const kpiCards = page.locator('.stat-card');
    await expect(kpiCards.first()).toBeVisible();
    
    // Cards should stack vertically
    const firstCard = kpiCards.first();
    const secondCard = kpiCards.nth(1);
    
    const box1 = await firstCard.boundingBox();
    const box2 = await secondCard.boundingBox();
    
    // Second card should be below first card
    expect(box2.y).toBeGreaterThan(box1.y + box1.height);
  });

  test('should adapt to dark mode', async ({ page }) => {
    await page.waitForTimeout(1500);
    
    // Toggle to dark mode
    await page.locator('#theme-toggle').click();
    await page.waitForTimeout(300);
    
    // Check if body has dark-mode class
    const body = page.locator('body');
    await expect(body).toHaveClass(/dark-mode/);
    
    // All KPI cards should still be visible
    const kpiCards = page.locator('.stat-card');
    await expect(kpiCards.first()).toBeVisible();
  });

  test('should have proper animations', async ({ page }) => {
    // Check for fadeInUp animation
    const firstCard = page.locator('.stat-card').first();
    
    const hasAnimation = await firstCard.evaluate(el => {
      const animation = window.getComputedStyle(el).animation;
      return animation.includes('fadeInUp') || animation.includes('0.5s');
    });
    
    // Animation should be defined
    expect(hasAnimation).toBeTruthy();
  });

  test('should take dashboard screenshot', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    await page.screenshot({ 
      path: 'tests/screenshots/dashboard-kpi-complete.png',
      fullPage: true 
    });
  });

});

