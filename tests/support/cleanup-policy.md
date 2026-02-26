# E2E Cleanup Policy

- Successful runs: cleanup immediately after each test using captured entity IDs.
- Failed runs: keep tagged data (`E2E_*`) for up to 24 hours for debugging.
- Scheduled purge: remove stale tagged entities older than 24 hours.

This policy matches the agreed release-test behavior from planning.
