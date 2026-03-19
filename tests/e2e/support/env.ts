export type E2EEnv = {
  baseUrl: string;
  apiBaseUrl: string;
  siteName: string;
  adminEmail?: string;
  adminPassword?: string;
  limitedUserEmail?: string;
  limitedUserPassword?: string;
  seedNamespacePrefix: string;
  seedTtlHours: number;
};

const toNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const e2eEnv: E2EEnv = {
  baseUrl: process.env.E2E_BASE_URL || 'http://dev2.localhost:3001',
  apiBaseUrl: process.env.E2E_API_BASE_URL || 'http://dev2.localhost:8800',
  siteName: process.env.E2E_SITE_NAME || 'dev2.localhost',
  adminEmail: process.env.E2E_ADMIN_EMAIL,
  adminPassword: process.env.E2E_ADMIN_PASSWORD,
  limitedUserEmail: process.env.E2E_LIMITED_USER_EMAIL,
  limitedUserPassword: process.env.E2E_LIMITED_USER_PASSWORD,
  seedNamespacePrefix: process.env.E2E_SEED_NAMESPACE_PREFIX || 'pw',
  seedTtlHours: toNumber(process.env.E2E_SEED_TTL_HOURS, 24),
};
