# Copilot Agent Instructions (Frontend: dentcharts-mob)

This file defines mandatory behavior for GitHub Copilot coding agents working on frontend tickets.

## Scope
- Applies to all files under this repository path.
- Primary domain: route guards, settings access, permissions-aware navigation.

## Non-Negotiable Rules
1. **Ticket-first execution**
   - Read the ticket in [plans/plan.md](../../../plans/plan.md).
   - Implement only ticket scope.
2. **Never trust UI-only authorization**
   - UI guards are required, but backend permission checks remain source of truth.
3. **Single source of permission state**
   - Permissions must be read from Auth context user payload.
   - Avoid ad-hoc local permission states.
4. **Minimal UX changes**
   - Do not redesign pages.
   - Add only required controls/tabs.
5. **Consistent page keys**
   - Use one shared page-key set across guard/sidebar/roles screen.

## Implementation Standards
- Add reusable guard component for route-level access checks.
- Hide inaccessible nav items and block direct URL navigation.
- Keep types strict; update relevant interfaces whenever payload changes.
- Keep components focused and testable.

## Ticket Workflow (Required)
1. Read ticket objective and acceptance criteria.
2. Update types and context first when payload changes.
3. Implement guarded routes + UI visibility logic.
4. Validate with local compile/lint.
5. Verify manual flow:
   - Admin user path
   - Non-admin allowed page
   - Non-admin blocked page redirect

## PR/Commit Notes Format
- `Ticket:`
- `Files changed:`
- `User-visible change:`
- `Guard behavior:`
- `Verification steps:`

## Do Not
- Do not hardcode permission outcomes per user.
- Do not duplicate permission logic in multiple places.
- Do not leave routes unguarded when sidebar is hidden.
