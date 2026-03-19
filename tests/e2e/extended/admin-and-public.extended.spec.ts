import { authStatePaths } from '../support/runtime';
import { test, expect } from '../fixtures';
import { openGlobalMenu, switchClinic } from '../support/uiHelpers';

test.describe('@extended admin clinic management', () => {
  test.use({ storageState: authStatePaths.clinicAdmin });

  test('settings and WhatsApp manager load for the namespaced secondary clinic', async ({ page, manifest }) => {
    await page.goto('/home');
    await switchClinic(page, manifest.clinics.secondary);

    await page.goto('/settings');
    await expect(page.getByText('Settings')).toBeVisible();

    await page.goto('/home');
    await openGlobalMenu(page);
    await page.getByTestId('global-menu-whatsapp').click();
    await expect(page).toHaveURL(/\/whatsapp-manager/);
    await expect(page.getByRole('button', { name: 'Save Settings' })).toBeVisible();
  });
});

test.describe('@extended public booking', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('public clinic booking flow completes against the seeded public clinic', async ({ page, manifest }) => {
    await page.goto(manifest.clinics.public_booking_path);
    await page.getByRole('button', { name: 'Consultation' }).click();
    await page.locator('button').filter({ hasText: /\w{3}\d{1,2}/ }).first().click();
    await page.locator('button').filter({ hasText: /^\d{2}:\d{2}$/ }).first().click();
    await page.getByRole('button', { name: 'Continue' }).click();
    await page.getByPlaceholder('Full Name').fill(`Playwright Public ${manifest.seed_suffix}`);
    await page.getByPlaceholder('Phone Number').fill(`+9198900${manifest.seed_suffix.slice(-4)}`);
    await page.getByRole('button', { name: /Confirm Booking/i }).click();
    await expect(page.getByText('Confirmed!')).toBeVisible();
  });

  test('@mobile public clinic smoke on mobile project', async ({ page, manifest }) => {
    await page.goto(manifest.clinics.public_booking_path);
    await expect(page.getByText('Book instantly online. No login required.')).toBeVisible();
  });
});
