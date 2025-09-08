import { test, expect } from '@playwright/test';

test.describe('M0 - Vertical Slice', () => {
  test('should load the game and display HUD', async ({ page }) => {
    await page.goto('/');
    
    // Check that the game canvas is present
    const canvas = page.locator('#gameCanvas');
    await expect(canvas).toBeVisible();
    
    // Check that HUD elements are present
    await expect(page.locator('[data-hud-playercount]')).toBeVisible();
    await expect(page.locator('[data-hud-hp]')).toBeVisible();
    await expect(page.locator('[data-hud-mp]')).toBeVisible();
    await expect(page.locator('[data-hud-gold]')).toBeVisible();
  });

  test('should apply low-spec quality profile for Chromebook', async ({ page }) => {
    // Mock Chromebook user agent
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36',
        writable: true,
      });
    });

    await page.goto('/');
    
    // Check that low-spec quality profile is applied
    await expect(page.locator('body[data-quality="low"]')).toBeVisible();
  });

  test('should display player count in HUD', async ({ page }) => {
    await page.goto('/');
    
    const playerCount = page.locator('[data-hud-playercount]');
    await expect(playerCount).toBeVisible();
    await expect(playerCount).toHaveText('1'); // Single player initially
  });

  test('should handle window resize', async ({ page }) => {
    await page.goto('/');
    
    // Resize window
    await page.setViewportSize({ width: 800, height: 600 });
    
    // Game should still be visible
    await expect(page.locator('#gameCanvas')).toBeVisible();
  });
});
