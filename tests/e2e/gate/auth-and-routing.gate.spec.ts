import { test, expect } from '../fixtures';

test.describe('@gate auth and route guards', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('root landing and login route render for signed-out users', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Doctor Portal')).toBeVisible();
    await page.getByRole('button', { name: /login as doctor/i }).click();
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('protected route redirects signed-out users to login', async ({ page }) => {
    await page.goto('/patients');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('login form shows validation errors when submitted empty', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('button', { name: 'Sign In' }).click();
    await expect(page.getByText('Email is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });

  test('@extended register page validation works for public users', async ({ page }) => {
    await page.goto('/register');
    await page.getByRole('button', { name: 'Create Account' }).click();
    await expect(page.getByText('Name is required')).toBeVisible();
    await expect(page.getByText('Phone number is required')).toBeVisible();
    await expect(page.getByText('Password is required')).toBeVisible();
  });
});
