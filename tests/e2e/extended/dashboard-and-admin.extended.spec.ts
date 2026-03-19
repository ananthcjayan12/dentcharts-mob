import { authStatePaths } from '../support/runtime';
import { test, expect } from '../fixtures';
import { openGlobalMenu } from '../support/uiHelpers';

test.describe('@extended dashboards and admin routes', () => {
  test.use({ storageState: authStatePaths.clinicAdmin });

  test('invoice creation route, financial dashboard, and orthodontic dashboard load', async ({ page }) => {
    await page.goto('/invoices?create=1');
    await expect(page.getByText('Invoices')).toBeVisible();
    await expect(page.getByRole('button', { name: /create invoice|save invoice|new invoice/i }).first()).toBeVisible();

    await page.goto('/financial-dashboard');
    await expect(page.getByText('Dashboard')).toBeVisible();
    await expect(page.getByText(/today collection|month collection|outstanding/i).first()).toBeVisible();

    await page.goto('/financial-dashboard/orthodontic');
    await expect(page.getByText('Orthodontic Dashboard')).toBeVisible();
    await expect(page.getByText(/Active Cases|Outstanding|Collected/).first()).toBeVisible();
  });

  test('settings roles tab and global menu admin routes are reachable', async ({ page, manifest }) => {
    await page.goto('/settings/roles');
    await expect(page.getByText('Roles Settings')).toBeVisible();
    await expect(page.getByTestId(`roles-settings-save-${manifest.auth.limited_practitioner.practitioner_id}`)).toBeVisible();

    await page.goto('/home');
    await openGlobalMenu(page);
    await page.getByTestId('global-menu-financials').click();
    await expect(page).toHaveURL(/\/financial-dashboard/);
  });
});
