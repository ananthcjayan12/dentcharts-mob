import { test, expect } from '@playwright/test';

test.describe('New patient registration', () => {
  test('shows validation errors for required fields', async ({ page }) => {
    await page.goto('/patients/new');
    await page.getByTestId('new-patient-submit').click();

    await expect(page.getByText('First name is required')).toBeVisible();
    await expect(page.getByText('Last name is required')).toBeVisible();
    await expect(page.getByText('Date of birth is required')).toBeVisible();
    await expect(page.getByText('Mobile number is required')).toBeVisible();
    await expect(page.getByText('Address is required')).toBeVisible();
  });

  test('rejects invalid mobile number format', async ({ page }) => {
    await page.goto('/patients/new');

    await page.getByTestId('new-patient-first-name').fill('E2E');
    await page.getByTestId('new-patient-last-name').fill('Patient');
    await page.getByTestId('new-patient-dob').fill('1990-02-10');
    await page.getByTestId('new-patient-mobile').fill('12345');
    await page.getByTestId('new-patient-address').fill('test address');

    await page.getByTestId('new-patient-submit').click();
    await expect(page.getByText('Invalid mobile number format')).toBeVisible();
  });
});
