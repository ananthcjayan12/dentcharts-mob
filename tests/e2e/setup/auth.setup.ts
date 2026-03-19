import { expect, test } from '@playwright/test';

import { authStatePaths, readRunManifest } from '../support/runtime';

const loginAndSave = async (
  page: import('@playwright/test').Page,
  email: string,
  password: string,
  storagePath: string
) => {
  await page.goto('/login');
  await page.getByPlaceholder('id-xxxxxx / 8801xxxxxx').fill(email);
  await page.getByPlaceholder('Enter your password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
  await expect(page).toHaveURL(/\/home/);
  await page.context().storageState({ path: storagePath });
};

test('authenticate admin state', async ({ page }) => {
  const manifest = readRunManifest();
  await loginAndSave(
    page,
    manifest.auth.clinic_admin.email,
    manifest.auth.clinic_admin.password,
    authStatePaths.clinicAdmin
  );
});

test('authenticate limited state', async ({ page }) => {
  const manifest = readRunManifest();
  await loginAndSave(
    page,
    manifest.auth.limited_practitioner.email,
    manifest.auth.limited_practitioner.password,
    authStatePaths.limitedPractitioner
  );
});
