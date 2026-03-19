import fs from 'fs';
import path from 'path';

const projectRoot = path.resolve(__dirname, '../../..');

export const playwrightRuntimeDir = path.join(projectRoot, 'playwright', 'runtime');
export const playwrightAuthDir = path.join(projectRoot, 'playwright', '.auth');
export const runManifestPath = path.join(playwrightRuntimeDir, 'run-manifest.json');

export const authStatePaths = {
  clinicAdmin: path.join(playwrightAuthDir, 'clinic_admin.json'),
  limitedPractitioner: path.join(playwrightAuthDir, 'limited_practitioner.json'),
};

export type RunManifest = {
  run_id: string;
  seed_namespace: string;
  seed_suffix: string;
  auth: {
    clinic_admin: { email: string; password: string; practitioner_id: string };
    limited_practitioner: { email: string; password: string; practitioner_id: string };
  };
  clinics: {
    primary: string;
    secondary: string;
    public_booking: string;
    public_booking_path: string;
  };
  patients: Record<string, string>;
  appointments: Record<string, string>;
  invoices: Record<string, string>;
  payments: Record<string, string>;
  prescriptions: Record<string, string>;
  orthodontic: Record<string, string>;
  records: Record<string, string[]>;
};

export const ensureRuntimeDirs = () => {
  fs.mkdirSync(playwrightRuntimeDir, { recursive: true });
  fs.mkdirSync(playwrightAuthDir, { recursive: true });
};

export const writeRunManifest = (manifest: RunManifest) => {
  ensureRuntimeDirs();
  fs.writeFileSync(runManifestPath, JSON.stringify(manifest, null, 2));
};

export const hasRunManifest = () => fs.existsSync(runManifestPath);

export const readRunManifest = (): RunManifest => {
  return JSON.parse(fs.readFileSync(runManifestPath, 'utf-8')) as RunManifest;
};

export const clearRunManifest = () => {
  if (fs.existsSync(runManifestPath)) {
    fs.rmSync(runManifestPath, { force: true });
  }
};
