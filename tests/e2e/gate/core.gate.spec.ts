import { authStatePaths } from '../support/runtime';
import { test, expect } from '../fixtures';

test.use({ storageState: authStatePaths.clinicAdmin });

test('@gate invoice route redirects into invoice creation', async ({ page }) => {
  await page.goto('/invoice');
  await expect(page).toHaveURL(/\/invoices\?create=1/);
});

test('@gate appointments and queue pages render seeded statuses', async ({ page, manifest }) => {
  await page.goto('/appointments');
  await expect(
    page.getByRole('row', {
      name: new RegExp(`Playwright Billing ${manifest.seed_suffix}.*Pending Payment`),
    })
  ).toBeVisible();
  await expect(
    page.getByRole('row', {
      name: new RegExp(`Playwright Billing ${manifest.seed_suffix}.*Ready for billing handoff`),
    })
  ).toBeVisible();
  await expect(
    page.getByRole('row', {
      name: new RegExp(`Playwright Rich ${manifest.seed_suffix}.*Needs x-rays upload`),
    })
  ).toBeVisible();
});

test('@gate patient workspace shows billing and dental chart data', async ({ page, manifest }) => {
  await page.goto(`/prescriptions/${manifest.patients.rich_clinical}`);
  await expect(page.getByText('Payment Summary')).toBeVisible();
  await page.getByRole('button', { name: 'Dental Chart' }).click();
  await expect(page.getByRole('button', { name: 'View Summary Report' })).toBeVisible();
  await page.getByRole('button', { name: 'Payment Details' }).click();
  await expect(page.getByText(manifest.invoices.paid, { exact: true })).toBeVisible();
});

test('@gate @mobile mobile home and appointments smoke', async ({ page, manifest }) => {
  await page.goto('/home');
  await expect(page).toHaveURL(/\/home/);
  await page.goto('/appointments');
  await expect(page.getByRole('heading', { name: 'Waiting' })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: `Playwright Billing ${manifest.seed_suffix}` }).first()
  ).toBeVisible();
});
