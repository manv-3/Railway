/**
 * Station Master & Field SSE E2E Test Suite
 * PS 26027 - V3-08: Playwright end-to-end tests for field safety handshake flow.
 *
 * Tests:
 * 1. Station Master login → redirects to /field portal
 * 2. Field SSE login → field portal loads without errors
 */

import { test, expect } from '@playwright/test';

const API_BASE = process.env.VITE_API_URL || 'http://localhost:8000';

test.describe('Station Master Safety Flow', () => {
  test('Station Master can login and view field portal', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');

    // Verify login page is rendered
    await expect(page).toHaveTitle(/Railway/i);

    // Fill credentials for station_master
    await page.fill('input[name="username"], input[placeholder*="username" i], input[type="text"]:first-of-type', 'station_master');
    await page.fill('input[name="password"], input[type="password"]', 'demo123');

    // Click login
    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")');

    // Wait for navigation
    await page.waitForURL('**/field', { timeout: 10000 });

    // Verify field portal content is visible
    await expect(page.locator('body')).toBeVisible();
    await expect(page.url()).toContain('/field');
  });

  test('Field SSE can login and access field portal', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[type="text"]:first-of-type', 'field_sse');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    await page.waitForURL('**/field', { timeout: 10000 });
    await expect(page.url()).toContain('/field');

    // Field portal should load without JS errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors.filter(e => !e.includes('ResizeObserver'))).toHaveLength(0);
  });

  test('Unauthenticated user is redirected to login', async ({ page }) => {
    await page.goto('/field');
    await expect(page).toHaveURL(/\/login/);
  });

  test('Station Master cannot access division cockpit (role enforcement)', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]:first-of-type', 'station_master');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/field', { timeout: 10000 });

    // Try to navigate to /division
    await page.goto('/division');

    // Should be redirected to /field (role home)
    await expect(page).toHaveURL(/\/field/);
  });
});
