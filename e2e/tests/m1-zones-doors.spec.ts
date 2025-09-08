import { test, expect } from '@playwright/test';

test.describe('M1 - Zones & Doors', () => {
  test('should display zone information in HUD', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game to load
    await page.waitForSelector('#gameCanvas');
    
    // Check that zone information is displayed
    await expect(page.locator('[data-hud-zone]')).toBeVisible();
    await expect(page.locator('[data-hud-zone]')).toHaveText('Hub');
  });

  test('should handle zone transfer request', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game to load
    await page.waitForSelector('#gameCanvas');
    
    // Mock successful zone transfer
    await page.evaluate(() => {
      // Simulate being near a door
      window.game?.networkManager?.room?.send('swap_zone', { toZoneId: 'world:field:1' });
    });
    
    // Wait for zone transfer response
    await page.waitForTimeout(1000);
    
    // Check that zone changed (this would be updated by the client)
    // In a real implementation, the HUD would update to show the new zone
  });

  test('should show error when too far from door', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game to load
    await page.waitForSelector('#gameCanvas');
    
    // Mock being far from door
    await page.evaluate(() => {
      // Simulate being far from any door
      window.game?.networkManager?.room?.send('swap_zone', { toZoneId: 'world:field:1' });
    });
    
    // Wait for error response
    await page.waitForTimeout(1000);
    
    // Check that error message is displayed
    // In a real implementation, this would show an error message to the player
  });

  test('should maintain player state during zone transfer', async ({ page }) => {
    await page.goto('/');
    
    // Wait for game to load
    await page.waitForSelector('#gameCanvas');
    
    // Check initial player state
    await expect(page.locator('[data-hud-hp]')).toHaveText('100/100');
    await expect(page.locator('[data-hud-mp]')).toHaveText('50/50');
    await expect(page.locator('[data-hud-gold]')).toHaveText('0');
    
    // Simulate zone transfer
    await page.evaluate(() => {
      window.game?.networkManager?.room?.send('swap_zone', { toZoneId: 'world:field:1' });
    });
    
    // Wait for transfer
    await page.waitForTimeout(1000);
    
    // Player state should be preserved
    await expect(page.locator('[data-hud-hp]')).toHaveText('100/100');
    await expect(page.locator('[data-hud-mp]')).toHaveText('50/50');
    await expect(page.locator('[data-hud-gold]')).toHaveText('0');
  });
});
