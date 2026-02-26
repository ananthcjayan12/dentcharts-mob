import { test, expect } from '@playwright/test';

test.describe('Login', () => {
  test('shows validation errors for empty credentials', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('login-submit').click();

    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });
});
