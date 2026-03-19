import { e2eEnv } from './env';
import type { RunManifest } from './runtime';

type HarnessEnvelope<T> = {
  message?: string;
  data?: T;
  exc_type?: string;
};

const unwrapEnvelope = <T>(payload: any): T => {
  const inner: HarnessEnvelope<T> = payload?.message ?? payload;
  if (inner?.exc_type) {
    throw new Error(inner.message || inner.exc_type);
  }
  return (inner?.data ?? inner) as T;
};

const callHarness = async <T>(methodName: string, params: Record<string, string | number | undefined>) => {
  const body = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      body.set(key, String(value));
    }
  }

  const response = await fetch(
    `${e2eEnv.apiBaseUrl}/api/method/mob_clinic.mob_clinic.api.playwright_e2e.${methodName}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Frappe-Site-Name': e2eEnv.siteName,
      },
      body: body.toString(),
    }
  );

  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(json?.message || `Harness call failed: ${methodName}`);
  }

  return unwrapEnvelope<T>(json);
};

export const cleanupStaleRuns = async () => {
  return callHarness<{ ttl_hours: number; cleaned_runs: Array<{ seed_namespace: string }> }>('cleanup_stale_runs', {
    seed_namespace_prefix: e2eEnv.seedNamespacePrefix,
    ttl_hours: e2eEnv.seedTtlHours,
  });
};

export const prepareRun = async () => {
  return callHarness<{ run_id: string; seed_namespace: string; seed_suffix: string }>('prepare_run', {
    seed_namespace_prefix: e2eEnv.seedNamespacePrefix,
  });
};

export const seedRun = async (runId: string, seedNamespace: string) => {
  return callHarness<RunManifest>('seed_run', {
    run_id: runId,
    seed_namespace: seedNamespace,
    admin_email: e2eEnv.adminEmail,
    admin_password: e2eEnv.adminPassword,
    limited_user_email: e2eEnv.limitedUserEmail,
    limited_user_password: e2eEnv.limitedUserPassword,
  });
};

export const cleanupRun = async (manifest: RunManifest) => {
  return callHarness<{ seed_namespace: string; leftovers: Record<string, string[]> }>('cleanup_run', {
    manifest: JSON.stringify(manifest),
  });
};

export const verifyRunCleanup = async (seedNamespace: string) => {
  return callHarness<{ seed_namespace: string; leftovers: Record<string, string[]> }>('verify_run_cleanup', {
    seed_namespace: seedNamespace,
  });
};
