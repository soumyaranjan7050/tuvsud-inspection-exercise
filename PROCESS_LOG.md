# Process Log

## Tools used
- Claude (web chat) as a pair-programming assistant
- Node/Express, Jest/Supertest, React/Vite, VS Code, Git, curl

## What I used AI for
- Walking through the codebase before changing it
- Drafting the certificate feature (store, endpoints, UI) and tests
- Reviewing the code for defects
- Debugging setup and integration errors

## A prompt I found useful
> "Explain the project first, as per the code."

Grounded the work in the actual architecture (routes translate HTTP, the store owns state), so each change landed in the right layer.

## A prompt or suggestion I rejected or overrode
> [Your own, only if true. E.g. kept 409 on re-issue instead of an idempotent 200, to avoid obscuring the audit trail.]

## A moment where the AI led me astray
An ambiguous "add the tests to the file" made me overwrite the test file and lose the `freshApp()` fixture. Restored it and re-ran the suite. Now I apply one change at a time and run the tests after each.

## The bug I found
- **Missing state guards (backend):** `approve`, `reject` and `addFinding` ignored current status, so a rejected inspection could be approved and certified, or re-approved (overwriting `approvedAt`). Fixed with a `pending`-only guard returning `409`; four regression tests, which fail on the original code.
- **Stored XSS (frontend):** findings were rendered via `dangerouslySetInnerHTML`. Now rendered as text.
- How I found them: [state accurately, e.g. flagged in AI code review, then reproduced with curl and a test payload].

## A security or compliance angle I considered
Issued certificates are immutable: one per inspection, re-issue returns `409`, and findings are snapshotted at issue time. Not done (listed in README): authn/authz, audit log, input validation.

## What I would do differently next time
Reproduce each defect myself before asking for a fix, and add an audit log and role-based authorisation first.