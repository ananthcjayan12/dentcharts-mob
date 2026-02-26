## Major Release Regression Plan

This implementation turns `suite_test.csv` into a repeatable release gate for staging.

### Objectives
- Keep all 61 CSV cases tracked in one matrix.
- Automate P0/P1 cases currently supported by UI/API.
- Keep unsupported flows visible as blocked items (not silently dropped).
- Enforce cleanup policy: pass = immediate cleanup, fail = retain 24h then purge.

### Deliverables Implemented
1. `docs/release-case-matrix.csv` with one row per CSV case.
2. Playwright baseline config with HTML reports/traces/videos.
3. Initial executable specs for auth and patient validations.
4. Test support seed/tag helper and cleanup-policy doc.
5. Release scripts in `package.json` and CI workflow trigger.

### Run Modes
- `npm run test:release:smoke`: high-signal smoke checks.
- `npm run test:release:p0p1`: gate for critical and high priority tests.
- `npm run test:release:full`: full automated suite.
- `npm run test:release:report`: open HTML report.

### Environment Variables
- `E2E_BASE_URL`
- `E2E_API_BASE_URL`
- `E2E_DOCTOR_USER`
- `E2E_DOCTOR_PASS`
- `E2E_RUN_MODE`

### Gating Rule
Release fails when a `P0/P1` automated test fails.

Manual and blocked cases stay in the matrix for explicit sign-off and backlog tracking.
