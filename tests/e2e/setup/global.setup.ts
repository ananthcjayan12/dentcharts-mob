import { cleanupStaleRuns, prepareRun, seedRun } from '../support/backendHarness';
import { ensureRuntimeDirs, writeRunManifest } from '../support/runtime';

async function globalSetup() {
  ensureRuntimeDirs();
  await cleanupStaleRuns();
  const prepared = await prepareRun();
  const manifest = await seedRun(prepared.run_id, prepared.seed_namespace);
  writeRunManifest(manifest);
}

export default globalSetup;
