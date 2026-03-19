# DentCharts Mobile Playwright E2E Source Of Truth

This document is the primary reference for the DentCharts Mobile Playwright regression suite.

Use this file when:
- adding new E2E tests
- updating existing Playwright coverage
- changing seeded test data
- adjusting cleanup guarantees
- handing E2E work to another agent

This is intended to be the single planning and authoring reference for both current and future Playwright coverage.

## Goals

The suite exists to validate real product behavior on the shared `dev2.localhost` environment while guaranteeing that Playwright-created data does not remain behind after a run.

Core goals:
- exercise real UI login and real frontend flows
- use seeded real backend data instead of brittle mocks for core product paths
- mock only true external side effects such as WhatsApp transport and camera/browser hooks
- keep all Playwright-created data namespaced and fully removable
- make release-blocking coverage explicit through `@gate`
- keep broader coverage explicit through `@extended`

## Runtime Contract

Default runtime values:
- frontend base URL: `http://dev2.localhost:3001`
- backend API base URL: `http://dev2.localhost:8800`
- site name: `dev2.localhost`

Environment variables:
- `E2E_BASE_URL`
- `E2E_API_BASE_URL`
- `E2E_SITE_NAME`
- `E2E_ADMIN_EMAIL`
- `E2E_ADMIN_PASSWORD`
- `E2E_LIMITED_USER_EMAIL`
- `E2E_LIMITED_USER_PASSWORD`
- `E2E_SEED_NAMESPACE_PREFIX`
- `E2E_SEED_TTL_HOURS`

Important note:
- the suite should run against `dev2.localhost`
- if a container cannot resolve `dev2.localhost`, fix name resolution rather than rewriting the suite to target `127.0.0.1`

## Cleanup Contract

The suite uses run-level teardown, not per-test teardown.

Lifecycle:
1. `cleanup_stale_runs()` removes abandoned old namespaces
2. `prepare_run()` creates a unique `run_id` and `seed_namespace`
3. `seed_run()` creates the run-owned fixtures and returns a manifest
4. tests execute using that manifest
5. `cleanup_run()` deletes all namespaced records
6. `verify_run_cleanup()` fails if any namespaced records remain

Non-negotiable cleanup rules:
- every seeded record must be tagged with the current namespace
- names visible in the UI should include the namespace suffix
- destructive tests must mutate only run-owned data
- tests must not rely on mutating unrelated shared site records
- a passing cleanup must leave zero leftover namespaced records

## Data Ownership Rules

All new tests must follow these rules:
- use seeded namespaced records whenever existing data is required
- do not modify unrelated non-namespaced site data
- if a test creates a patient, appointment, invoice, payment, or encounter through the UI, the backend must still tag it to the run namespace
- use namespaced seeded records for destructive flows
- prefer manifest-driven test data over hard-coded ids

## Suite Structure

Main config:
- [playwright.config.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/playwright.config.ts)

Projects:
- `setup-auth`
- `desktop-chromium`
- `mobile-chromium`

Tag policy:
- `@gate`: release-blocking coverage
- `@extended`: broader non-blocking coverage
- `@mobile`: tests intended for the mobile project

Key support files:
- [tests/e2e/setup/global.setup.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/setup/global.setup.ts)
- [tests/e2e/setup/global.teardown.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/setup/global.teardown.ts)
- [tests/e2e/setup/auth.setup.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/setup/auth.setup.ts)
- [tests/e2e/support/backendHarness.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/support/backendHarness.ts)
- [tests/e2e/support/runtime.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/support/runtime.ts)
- [tests/e2e/fixtures.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/fixtures.ts)

Backend harness:
- [playwright_e2e.py](/workspace/development/frappe-bench/apps/mob_clinic/mob_clinic/mob_clinic/api/playwright_e2e.py)

## Current Seed Model

The current harness seeds:

Users:
- one clinic admin user
- one limited practitioner user

Clinics:
- primary clinic
- secondary admin-access clinic
- public-booking clinic

Patients:
- empty/new patient
- rich clinical patient
- billing-heavy patient
- orthodontic patient

Appointments:
- scheduled
- confirmed
- waiting
- in progress
- to be invoiced
- pending payment
- files to be uploaded
- completed
- cancelled

Financial and clinical artifacts:
- invoices
- payments
- prescription/encounter data
- dental chart data
- orthodontic case data
- WhatsApp shell data

## Current Test Inventory

### Auth Setup

File:
- [tests/e2e/setup/auth.setup.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/setup/auth.setup.ts)

Coverage:
- authenticate admin storage state through the real login page
- authenticate limited practitioner storage state through the real login page

Purpose:
- all downstream tests depend on these saved authenticated states

### Gate: Auth And Route Guards

File:
- [tests/e2e/gate/auth-and-routing.gate.spec.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/gate/auth-and-routing.gate.spec.ts)

Current cases:
1. root landing and login route render for signed-out users
2. protected route redirects signed-out users to login
3. login form shows validation errors when submitted empty
4. register page validation works for public users

### Gate: Core

File:
- [tests/e2e/gate/core.gate.spec.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/gate/core.gate.spec.ts)

Current desktop cases:
1. `/invoice` redirects to `/invoices?create=1`
2. appointments page shows seeded queue and status rows for the current namespace
3. patient workspace shows payment summary, dental chart access, and seeded invoice data

Current mobile case:
1. mobile home and appointments smoke

### Gate: Limited Access

File:
- [tests/e2e/gate/limited-access.gate.spec.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/gate/limited-access.gate.spec.ts)

Current cases:
1. limited practitioner can use allowed areas and is denied admin areas

### Gate: Patients And Appointments

File:
- [tests/e2e/gate/patients-and-appointments.gate.spec.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/gate/patients-and-appointments.gate.spec.ts)

Current cases:
1. patients list shows seeded patient data and navigation into patient workspace works
2. new patient form validates required fields
3. new patient can be created through the real UI
4. new appointment can be created for a seeded patient

### Extended: Admin And Public

File:
- [tests/e2e/extended/admin-and-public.extended.spec.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/extended/admin-and-public.extended.spec.ts)

Current cases:
1. admin clinic management and WhatsApp manager load for secondary namespaced clinic
2. public clinic booking completes for the seeded public clinic
3. public clinic smoke on mobile

### Extended: Dashboard And Admin

File:
- [tests/e2e/extended/dashboard-and-admin.extended.spec.ts](/workspace/development/frappe-bench/UI/dentcharts-mob/tests/e2e/extended/dashboard-and-admin.extended.spec.ts)

Current cases:
1. invoice creation route, financial dashboard, and orthodontic dashboard load
2. settings roles tab and global menu admin routes are reachable

## Current Stable Selector Strategy

We prefer accessible selectors first.

Use `data-testid` only when semantic or accessible selectors are ambiguous.

Already-added test ids and stabilizers cover areas such as:
- clinic selector
- global menu
- settings save actions
- dental chart actions
- appointment action controls
- WhatsApp settings save actions

Guidelines:
- prefer `getByRole(...)`
- prefer `getByPlaceholder(...)` when the input is visually labeled but not programmatically associated
- use row-level or card-level selectors when repeated text appears across multiple records
- anchor assertions to the current namespace suffix whenever possible
- avoid raw `getByText(...)` when the same label appears in both summary chips and table rows

## Test Authoring Rules

When adding a new test:
- decide first whether it belongs in `@gate` or `@extended`
- decide whether it is desktop-only or should also run in mobile
- use the run manifest instead of hard-coded patients, clinics, invoices, or users
- assert against the current namespace suffix to avoid collisions with old data
- prefer one major user journey per test
- keep assertions on user-visible outcomes, not implementation details

When a flow depends on existing records:
- use a seeded record from `manifest`
- do not use unrelated site data

When a flow creates new records:
- create them through the real UI when practical
- assert the result in the page that the user lands on next

When a selector is ambiguous:
- scope to a row, table, section, card, or heading first
- only add a new `data-testid` if accessible scoping still stays brittle

## Scenario Template For New Coverage

Every major flow should eventually support these scenario types:

1. happy path
2. validation or guardrail failure
3. destructive confirm/cancel branch
4. backend error, retry, or empty state

Recommended test case entry format for future additions:

```md
### Flow Name

Owner file:
- `tests/e2e/...`

Coverage tier:
- `@gate` or `@extended`

Auth state:
- `clinic_admin` or `limited_practitioner` or signed-out

Seed requirements:
- patients:
- appointments:
- invoices:
- clinic settings:

Scenarios:
1. Happy path:
   user action and expected result
2. Validation:
   invalid input and expected guardrail
3. Destructive branch:
   cancel/delete/confirm branch and expected result
4. Backend failure or empty state:
   failure surface and expected fallback

Selectors:
- preferred roles/placeholders/testids

Cleanup considerations:
- whether the test mutates only run-owned records
```

## Known Good Run Commands

List tests:

```bash
cd /workspace/development/frappe-bench/UI/dentcharts-mob
npx playwright test --list
```

Run gate:

```bash
cd /workspace/development/frappe-bench/UI/dentcharts-mob
E2E_BASE_URL=http://dev2.localhost:3001 \
E2E_API_BASE_URL=http://dev2.localhost:8800 \
E2E_SITE_NAME=dev2.localhost \
npx playwright test --grep @gate
```

Run extended:

```bash
cd /workspace/development/frappe-bench/UI/dentcharts-mob
E2E_BASE_URL=http://dev2.localhost:3001 \
E2E_API_BASE_URL=http://dev2.localhost:8800 \
E2E_SITE_NAME=dev2.localhost \
npx playwright test --grep @extended
```

Run with trace:

```bash
cd /workspace/development/frappe-bench/UI/dentcharts-mob
E2E_BASE_URL=http://dev2.localhost:3001 \
E2E_API_BASE_URL=http://dev2.localhost:8800 \
E2E_SITE_NAME=dev2.localhost \
npx playwright test --grep @gate --trace on
```

Open a saved trace:

```bash
cd /workspace/development/frappe-bench/UI/dentcharts-mob
npx playwright show-trace test-results/<path>/trace.zip
```

## Artifact And Debugging Rules

When debugging failures:
- inspect `error-context.md` first
- inspect the failure screenshot
- inspect the video when interaction order matters
- inspect `trace.zip` for network, navigation, and timing issues

Typical artifact locations:
- `test-results/.../test-failed-1.png`
- `test-results/.../video.webm`
- `test-results/.../trace.zip`
- `test-results/.../error-context.md`

## What Future Agents Should Update

Whenever a new test is added, update this document with:
- the file path
- the coverage tier
- the auth state used
- the seed data dependency
- the exact scenario added
- any new selector contract or `data-testid`
- any new cleanup or ownership consideration

Whenever a seed shape changes, update:
- seed model section
- cleanup contract section
- affected test inventory section

Whenever a flaky selector is fixed, update:
- stable selector strategy section

## Current Baseline

As of the latest verified run:
- the full `@gate` suite passes on `dev2.localhost`
- auth setup passes through the real UI
- namespaced backend seed and cleanup pass with zero leftovers

This file should be kept current as coverage expands.
