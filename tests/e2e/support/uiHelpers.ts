import type { Page } from '@playwright/test';

export const openGlobalMenu = async (page: Page) => {
  await page.getByTestId('global-menu-trigger').click();
};

export const switchClinic = async (page: Page, clinicName: string) => {
  await page.getByTestId('clinic-selector-trigger').click();
  await page.getByTestId(`clinic-selector-option-${clinicName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`).click();
};
