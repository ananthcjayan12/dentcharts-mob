# Release Test Run Report

- Generated at: 2026-02-26T20:19:33.031206+00:00
- Total tests: 3
- Passed: 3
- Failed: 0
- Skipped: 0
- Total duration (test execution): 8.22s

## Command

```bash
npx playwright test tests/e2e/auth/login.spec.ts tests/e2e/patients/new-patient.spec.ts --reporter=json > artifacts/release-test-run.json
```

## Test Case Details

| Status | Project | Spec File | Test | Duration (ms) |
|---|---|---|---|---:|
| passed | chromium | auth/login.spec.ts | auth/login.spec.ts > Login > shows validation errors for empty credentials | 3199 |
| passed | chromium | patients/new-patient.spec.ts | patients/new-patient.spec.ts > New patient registration > shows validation errors for required fields | 2834 |
| passed | chromium | patients/new-patient.spec.ts | patients/new-patient.spec.ts > New patient registration > rejects invalid mobile number format | 2186 |
