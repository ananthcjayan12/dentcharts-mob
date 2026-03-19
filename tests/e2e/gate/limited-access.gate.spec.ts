import { authStatePaths } from '../support/runtime';
import { test, expect } from '../fixtures';

test.use({ storageState: authStatePaths.limitedPractitioner });

test('@gate limited practitioner can use home but not admin areas', async ({ page }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/home/);

  await page.goto('/settings');
  await expect(page).toHaveURL(/\/home/);

  await page.goto('/financial-dashboard');
  await expect(page).toHaveURL(/\/home/);

  await page.goto('/whatsapp-manager');
  await expect(page).toHaveURL(/\/home/);
});
