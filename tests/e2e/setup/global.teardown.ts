import { cleanupRun, verifyRunCleanup } from '../support/backendHarness';
import { clearRunManifest, hasRunManifest, readRunManifest } from '../support/runtime';

async function globalTeardown() {
  try {
    if (!hasRunManifest()) {
      return;
    }

    const manifest = readRunManifest();
    await cleanupRun(manifest);
    const verification = await verifyRunCleanup(manifest.seed_namespace);
    if (Object.keys(verification.leftovers || {}).length > 0) {
      throw new Error(`Residual Playwright data detected for ${manifest.seed_namespace}`);
    }
  } finally {
    clearRunManifest();
  }
}

export default globalTeardown;
