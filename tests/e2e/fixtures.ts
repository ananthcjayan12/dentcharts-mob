import { expect, test as base } from '@playwright/test';

import type { RunManifest } from './support/runtime';
import { readRunManifest } from './support/runtime';

export const test = base.extend<{ manifest: RunManifest }>({
  manifest: async ({}, use) => {
    await use(readRunManifest());
  },
  page: async ({ page, manifest }, use) => {
    await page.context().setExtraHTTPHeaders({
      'X-Playwright-Seed-Namespace': manifest.seed_namespace,
    });
    await use(page);
  },
});

export { expect };
