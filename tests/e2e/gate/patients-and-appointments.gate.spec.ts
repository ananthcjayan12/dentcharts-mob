import { authStatePaths } from '../support/runtime';
import { test, expect } from '../fixtures';

const numericToken = () => `${Date.now()}`.slice(-8);

test.describe('@gate patient and appointment flows', () => {
  test.use({ storageState: authStatePaths.clinicAdmin });

  test('patients list shows seeded run data and patient workspace navigation works', async ({ page, manifest }) => {
    await page.goto('/patients');
    const patientCell = page.getByRole('cell', { name: `Playwright Rich ${manifest.seed_suffix}` });
    await expect(patientCell).toBeVisible();
    await patientCell.click();
    await expect(page).toHaveURL(new RegExp(`/prescriptions/${manifest.patients.rich_clinical}$`));
    await expect(page.getByText('Payment Summary')).toBeVisible();
  });

  test('new patient form enforces required fields', async ({ page }) => {
    await page.goto('/patients/new');
    await expect(page.getByText('New Patient Registration')).toBeVisible();
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Mobile number is required')).toBeVisible();
    await expect(page.getByText('Address is required')).toBeVisible();
  });

  test('new patient can be created through the real UI', async ({ page, manifest }) => {
    const token = numericToken();
    const patientName = `Playwright Added ${manifest.seed_suffix}`;

    await page.goto('/patients/new');
    await page.getByPlaceholder('Enter first name').fill('Playwright');
    await page.getByPlaceholder('Enter last name').fill(`Added ${manifest.seed_suffix}`);
    await page.getByPlaceholder('+91XXXXXXXXXX').fill(`+91977${token}`);
    await page.getByPlaceholder('Enter complete address').fill(`Namespace Lane ${manifest.seed_suffix}`);
    await page.getByRole('button', { name: 'Save' }).click();

    await expect(page).toHaveURL(/\/patients$/);
    await expect(page.getByRole('cell', { name: patientName })).toBeVisible();
  });

  test('new appointment can be booked for a seeded patient', async ({ page, manifest }) => {
    await page.goto('/appointments/new');
    await expect(page.getByText('Search and book appointments')).toBeVisible();

    const patientLabel = `Playwright Empty ${manifest.seed_suffix}`;
    await page.getByPlaceholder('Search patient by name, ID, or phone').fill(patientLabel);
    await page.getByRole('button', { name: 'Select' }).first().click();

    await expect(page.getByText('Select Doctor')).toBeVisible();
    await page.getByRole('button', { name: 'Add to Todays Queue' }).click();
    await page.getByRole('button', { name: 'Book Appointment' }).click();

    await expect(page).toHaveURL(/\/appointments$/);
    await expect(page.getByRole('cell', { name: patientLabel })).toBeVisible();
  });
});
