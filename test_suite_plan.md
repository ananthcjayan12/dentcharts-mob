## Major Release Regression Suite Plan (CSV-Driven, 61 Cases)

### Summary
Build a **single release-gate test system** that maps every row in `suite_test.csv` to one of:
- `automated` (runs in Playwright)
- `manual` (human checklist, still mandatory if marked P0/P1)
- `blocked` (feature not implemented yet; explicitly tracked)

Chosen defaults from you:
- Coverage for missing features: **Track as blocked**
- Environment: **Dedicated staging**
- Gate policy: **P0/P1 must pass**
- Framework: **Playwright + API-based test data setup**

---

### Current-State Grounding (from codebase)
Source reviewed:
- [suite_test.csv](/Users/ananthu/Desktop/new_repos/dentcharts-mob/suite_test.csv)
- [src/App.tsx](/Users/ananthu/Desktop/new_repos/dentcharts-mob/src/App.tsx)
- [src/pages/NewPatientPage.tsx](/Users/ananthu/Desktop/new_repos/dentcharts-mob/src/pages/NewPatientPage.tsx)
- [src/pages/NewAppointmentPage.tsx](/Users/ananthu/Desktop/new_repos/dentcharts-mob/src/pages/NewAppointmentPage.tsx)
- [src/pages/AppointmentsPage.tsx](/Users/ananthu/Desktop/new_repos/dentcharts-mob/src/pages/AppointmentsPage.tsx)
- [src/pages/PrescriptionPage.tsx](/Users/ananthu/Desktop/new_repos/dentcharts-mob/src/pages/PrescriptionPage.tsx)
- [src/pages/InvoicePage.tsx](/Users/ananthu/Desktop/new_repos/dentcharts-mob/src/pages/InvoicePage.tsx)
- [src/api/client.ts](/Users/ananthu/Desktop/new_repos/dentcharts-mob/src/api/client.ts)

Findings used in plan:
- No existing E2E framework or test files.
- Some CSV features are not implemented in UI yet (queue state transitions, dental chart, rich prescription builder, etc.).
- API services exist for auth/patient/appointment/prescription/payment/file, so deterministic setup/cleanup via API is feasible.

---

### Scope Model for 61 CSV Cases
1. **Tier A (Automate now, P0/P1 focus)**  
   Login, patient creation validations, basic appointment booking flows, core list visibility, basic invoice creation, patient header/quick-action flows.
2. **Tier B (Manual now, automate later)**  
   Flows partially present but lacking stable UI hooks/verification surfaces.
3. **Tier C (Blocked)**  
   Cases requiring unimplemented UI/business flows; tracked explicitly with reason and owning module.

---

### Deliverables
1. `docs/release-test-plan.md`  
   Full strategy, runbook, environment requirements, gating rules.
2. `docs/release-case-matrix.csv`  
   One row per CSV test case with columns:  
   `csv_id, feature, priority, execution_mode, status, automation_spec, blocking_reason, owner`
3. `tests/e2e/` Playwright project with:
   - `auth/`
   - `patients/`
   - `appointments/`
   - `billing/`
   - `profile/`
4. `tests/support/`:
   - API seeding client
   - reusable fixtures
   - cleanup hooks
5. Release commands in `package.json`:
   - `test:release:smoke`
   - `test:release:p0p1`
   - `test:release:full`
   - `test:release:report`
6. CI workflow (`.github/workflows/release-regression.yml`) to run P0/P1 gate on demand/tag.

---

### Important Public Interface / Type Additions
1. **Test metadata contract**
   - Add `docs/release-case-matrix.csv` as source of truth.
   - Enforce status enum: `automated | manual | blocked`.
2. **Stable selector contract**
   - Add `data-testid` to key controls in high-priority flows.
   - Naming convention: `page-section-action` (e.g., `new-patient-submit`).
3. **Test environment variables**
   - `E2E_BASE_URL`
   - `E2E_API_BASE_URL`
   - `E2E_DOCTOR_USER`
   - `E2E_DOCTOR_PASS`
   - `E2E_RUN_MODE` (`smoke|p0p1|full`)
4. **Release gate contract**
   - Gate fails if any `P0/P1 automated` test fails.
   - Gate also fails if any `P0/P1 manual` case is unchecked in checklist artifact.

---

### Implementation Phases

1. **Phase 1: Case Normalization + Prioritization**
   - Parse all 61 CSV rows.
   - Add priority tags: `P0/P1/P2`.
   - Assign each row to `automated/manual/blocked`.
   - Output first version of `release-case-matrix.csv`.

2. **Phase 2: Playwright Foundation**
   - Install/configure Playwright for CRA app.
   - Add staging env loader and auth state reuse.
   - Add API helper for creating patient/appointment/invoice test data.
   - Add baseline HTML report + trace/video on failure.

3. **Phase 3: Implement Tier A Automated Specs**
   - Build deterministic specs for all selected P0/P1 automatable cases.
   - Use API setup + UI verification pattern.
   - Ensure tests are idempotent and cleanup artifacts.

4. **Phase 4: Manual + Blocked Governance**
   - Generate manual checklist from matrix.
   - Generate blocked list with code references and reasons.
   - Attach owner/module for each blocked case.

5. **Phase 5: Release Gate + Reporting**
   - Add release workflow.
   - Archive artifacts: Playwright report, traces, manual checklist, blocked list.
   - Publish summary table for go/no-go.

---

### Test Cases and Scenarios (Execution Plan)
1. **Auth**
   - Successful login and redirect to dashboard.
   - Empty credential validation.
2. **New Patient**
   - Mandatory field validation.
   - Invalid mobile formats rejected.
   - Valid mobile + required fields create patient.
   - Cancel path returns to patient list without save.
3. **Appointments**
   - Create appointment for existing patient (future date).
   - Create appointment for same day.
   - Past date booking rejection (UI/API behavior validation).
   - Duration slot options rendered and accepted.
   - Date-based appointment list visibility.
4. **Patient Profile/History View**
   - Patient demographic card reflects created patient data.
   - Quick action from patient view opens prefilled new appointment.
5. **Billing**
   - Invoice creation with required fields and item totals.
   - Validation errors for incomplete invoice data.

All remaining CSV rows are still represented in `release-case-matrix.csv` as manual or blocked (not dropped).

---

### Acceptance Criteria
1. Every one of 61 CSV cases is present in the matrix with explicit status.
2. P0/P1 automatable cases have executable Playwright specs and pass on staging.
3. P0/P1 manual cases have a mandatory checklist artifact in release run.
4. Blocked cases include reason + owning module and are visible in release summary.
5. Single command can run major-release gate and produce artifacts.

---

### Assumptions and Defaults
1. Staging backend has reliable API parity with production.
2. Test credentials and API access are available for seeded data operations.
3. GitHub Actions is acceptable as initial CI implementation.
4. Cases depending on missing UI/business logic remain `blocked` until features are implemented.
5. Release decision uses your selected policy: **P0/P1 must pass**.
