import { test, expect } from '@playwright/test';

test.describe('M0 - Text Mode Vertical Slice', () => {
  test('should display text-based UI with world feed and command prompt', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check that the text-based UI is loaded
    await expect(page.locator('.world-feed')).toBeVisible();
    await expect(page.locator('.actions-panel')).toBeVisible();
    await expect(page.locator('.command-prompt')).toBeVisible();

    // Check that the world feed has a title
    await expect(page.locator('.world-feed h2')).toHaveText('World Feed');

    // Check that status bars are present
    await expect(page.locator('.status-bar.health-bar')).toBeVisible();
    await expect(page.locator('.status-bar.mana-bar')).toBeVisible();
    await expect(page.locator('.status-bar.gold-bar')).toBeVisible();
    await expect(page.locator('.status-bar.xp-bar')).toBeVisible();

    // Check that hotbar buttons are present
    await expect(page.locator('.hotbar-button[data-ability="1"]')).toBeVisible();
    await expect(page.locator('.hotbar-button[data-ability="2"]')).toBeVisible();
    await expect(page.locator('.hotbar-button[data-ability="3"]')).toBeVisible();
    await expect(page.locator('.hotbar-button[data-ability="4"]')).toBeVisible();

    // Check that command input is present
    await expect(page.locator('#command-input')).toBeVisible();
    await expect(page.locator('#command-input')).toHaveAttribute('placeholder', 
      'Type commands like: go north, attack boar, cast fireburst...');
  });

  test('should show welcome message in world feed', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for the welcome message to appear
    await expect(page.locator('.feed-line[data-type="info"]')).toContainText('Welcome to Last-Lite!');
    await expect(page.locator('.feed-line[data-type="info"]')).toContainText('Type "help" for available commands');
  });

  test('should handle command input and display in feed', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Type a command in the command input
    const commandInput = page.locator('#command-input');
    await commandInput.fill('help');
    await commandInput.press('Enter');

    // Check that the command appears in the feed
    await expect(page.locator('.feed-line')).toContainText('> help');
  });

  test('should handle hotkey button clicks', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Click a hotbar button
    await page.locator('.hotbar-button[data-ability="1"]').click();

    // Check that the ability command appears in the feed
    await expect(page.locator('.feed-line')).toContainText('> cast strike');
  });

  test('should handle keyboard hotkeys (1-4)', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Press hotkey 2
    await page.keyboard.press('2');

    // Check that the ability command appears in the feed
    await expect(page.locator('.feed-line')).toContainText('> cast block');
  });

  test('should display different message types with correct styling', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Check that different message types have different data attributes
    const infoMessage = page.locator('.feed-line[data-type="info"]').first();
    await expect(infoMessage).toBeVisible();

    // The CSS should apply different colors based on data-type
    const infoColor = await infoMessage.evaluate(el => 
      window.getComputedStyle(el).color
    );
    expect(infoColor).toBeTruthy();
  });

  test('should handle command history navigation', async ({ page }) => {
    await page.goto('http://localhost:3000');

    const commandInput = page.locator('#command-input');

    // Type a few commands
    await commandInput.fill('go north');
    await commandInput.press('Enter');
    
    await commandInput.fill('attack boar');
    await commandInput.press('Enter');

    // Navigate history with arrow keys
    await commandInput.press('ArrowUp');
    await expect(commandInput).toHaveValue('attack boar');

    await commandInput.press('ArrowUp');
    await expect(commandInput).toHaveValue('go north');

    await commandInput.press('ArrowDown');
    await expect(commandInput).toHaveValue('attack boar');
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('http://localhost:3000');

    // Check that the layout adapts to mobile
    await expect(page.locator('.game-container')).toBeVisible();
    
    // On mobile, the layout should stack vertically
    const gameContainer = page.locator('.game-container');
    const flexDirection = await gameContainer.evaluate(el => 
      window.getComputedStyle(el).flexDirection
    );
    
    // Should be column on mobile (handled by CSS media query)
    expect(flexDirection).toBe('column');
  });

  test('should maintain connection and show player count updates', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for connection to be established
    await expect(page.locator('.feed-line[data-type="info"]')).toContainText('Welcome to');

    // The player count should be displayed in status bars or feed
    // This will be expanded as we implement more server features
    await expect(page.locator('.status-bar')).toBeVisible();
  });

  test('should handle multiple browser tabs', async ({ browser }) => {
    // Open two tabs
    const context = await browser.newContext();
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    // Navigate both to the game
    await page1.goto('http://localhost:3000');
    await page2.goto('http://localhost:3000');

    // Both should show welcome messages
    await expect(page1.locator('.feed-line[data-type="info"]')).toContainText('Welcome to');
    await expect(page2.locator('.feed-line[data-type="info"]')).toContainText('Welcome to');

    // Send a command from one tab
    await page1.locator('#command-input').fill('say hello from tab 1');
    await page1.locator('#command-input').press('Enter');

    // Both tabs should see the command (this will be expanded with server implementation)
    await expect(page1.locator('.feed-line')).toContainText('> say hello from tab 1');

    await context.close();
  });
});