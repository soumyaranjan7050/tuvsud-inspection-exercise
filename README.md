# TÜV SÜD — Full-Stack Coding Exercise
## Elevator Inspection Records

Thank you for taking the time to work on this exercise. It reflects
the kind of work you would do as a full-stack developer at TÜV SÜD:
pragmatic feature work on a small system that stores inspection
records, with attention to correctness, traceability, and security.

**Estimated time: ~2 hours.** Please do not exceed this by much. A
partial, well-understood submission beats an over-scoped one.

 Everything we evaluate comes
from your repository and your two recordings — please read the
"What to Submit" section carefully before you start.

---

## The Domain

A small full-stack application for managing elevator (lift)
inspection records. Inspectors record findings from an on-site
inspection; administrators approve or reject the report.

---

## The Stack

```
backend/    Node.js + Express, in-memory JSON store, Jest + Supertest
frontend/   React (Vite), plain CSS, fetch-based API client
```

Requirements: **Node.js 18+** and npm.

### Setup

```bash
cd backend  && npm install && cd ..
cd frontend && npm install && cd ..

# Backend on http://localhost:4000
cd backend && npm run dev

# In a second terminal, frontend on http://localhost:5173
cd frontend && npm run dev

# Backend tests
cd backend && npm test
```

The frontend proxies `/api/*` to the backend on port 4000.

### Existing endpoints

- `GET  /api/inspections`                 — list, supports `?status=`, `?inspector=`
- `GET  /api/inspections/:id`             — get one inspection with findings
- `POST /api/inspections`                 — create a new inspection
- `POST /api/inspections/:id/findings`    — add a finding
- `POST /api/inspections/:id/approve`     — approve
- `POST /api/inspections/:id/reject`      — reject (body: `{ reason }`)

---

### Compliance certificate endpoints (added)

- `POST /api/inspections/:id/certificate` — issue a certificate.
  - `201` with the certificate: `certificateNumber` (`CERT-<year>-<6 digit sequence>`),
    `inspectionId`, `issuedAt`, `validUntil` (12 months later, month-end clamped),
    `elevatorId`, `inspector`, `findings` (snapshot copy).
  - `409` if the inspection is not `approved`, or already has a certificate.
  - `404` if the inspection does not exist.
- `GET  /api/inspections/:id/certificate` — return the stored certificate.
  - `404` if the inspection does not exist or no certificate was issued yet.

**Re-issue policy:** one certificate per inspection, immutable once issued.
A second `POST` returns `409` and the original certificate stays unchanged.
Reason: a certificate is a compliance record; silently replacing it would
break the audit trail. A replacement (e.g. after expiry or correction) should
be an explicit, authorised and logged action — not implemented here.

### Bug fixes (added)

1. **Missing state-transition guards (backend).** `approve`, `reject` and
   `findings` did not check the current status. A rejected inspection could be
   approved (and then certified), an approved one could be approved again
   (overwriting `approvedAt`) or rejected, and findings could be added after a
   decision. Now only `pending` inspections accept these actions; others get `409`.
2. **Stored XSS (frontend).** Finding descriptions were rendered with
   `dangerouslySetInnerHTML`, so `<img onerror=...>` in a description would run
   in every viewer's browser. They are now rendered as plain text.

### Known gaps (not done in the time box)

No authentication/authorisation (anyone can approve or issue), no audit log of
who did what, no server-side length/type validation of inputs, in-memory data only.

## Your Task

Three things. All three count.

### 1. Add a Compliance Certificate feature (backend + frontend)

When an inspection is **approved**, the system should issue a
compliance certificate.

Backend:

- `POST /api/inspections/:id/certificate` — only for approved
  inspections (409 otherwise). Generate: unique `certificateNumber`
  (server-side), `issuedAt` (ISO), `validUntil` (12 months later),
  `elevatorId`, `inspector`, snapshot of findings. Persist on the
  inspection. Decide and document a re-issue policy.
- `GET /api/inspections/:id/certificate` — return the persisted
  certificate JSON, or 404.

Frontend:

- In the detail view of an approved inspection, show an
  **"Issue certificate"** button.
- Once issued (or if one exists), replace the button with a clean,
  legible certificate panel showing certificate number, issue date,
  validity, inspector, findings. Printable styling is not required.

### 2. Find and fix at least one real bug

There is **at least one real bug** in the existing codebase — not
a typo. Look at both backend and frontend. Fix it properly. If you
spot more than one, fix as many as time allows.

### 3. Add tests and update docs

- Certificate happy path + one edge case (e.g. certificate on a
  non-approved inspection).
- A regression test for the bug you fixed (or a manual verification
  note in the README if it is a frontend bug).
- Update this README with the new endpoints and your re-issue policy.

---

## Tools

You may use **any tools you like**, including AI assistants
(ChatGPT, Claude, Copilot, Cursor, autonomous coding agents,
anything else). We expect modern engineers to use these tools well.
Part of what we evaluate is **how you use them**, not whether you
use them.

No penalty for heavy AI use. Strong penalty for submitting code
you do not understand.

---

## What to Submit

Three things:

### A. Your Git repository

A link to a public or private Git repository or a zip package. 

- Do **not** squash commits.
- Include a `PROCESS_LOG.md` in the repo root (use
  `PROCESS_LOG_TEMPLATE.md`).

### B. Silent screen recording of the whole exercise (no audio, no camera)

Record your primary work screen for the **entire duration** of the
exercise.

- **No audio.** Mute your microphone in the recorder.
- **No camera.** Screen only.
- Any tool: OBS Studio (recommended, free), Loom, QuickTime, the
  built-in Windows Xbox Game Bar, etc.
- Low frame rate (5–10 fps) and 1080p or lower keeps files small.
  A ~2 hour recording is typically 200–500 MB.
- Pause during breaks; do not restart.
- Upload to Google Drive, Dropbox, WeTransfer, OneDrive, or similar.

**Purpose.** Not to judge speed or style. It is our evidence that
the work in your repo is your work — that a real person was in the
driver's seat. AI use on camera is expected.

If you have a genuine privacy concern about the silent recording,
tell us before you start.

### C. Narrated walkthrough (up to 7 minutes, unedited)

A short second video, **with audio**, that explains what you built.
Camera-on optional. 

Rough structure:

1. **(1 min)** Demo the certificate feature end to end.
2. **(1 min)** Run the tests live and show them passing.
3. **(2 min)** Walk through the certificate implementation —
   backend then frontend — and explain one design decision.
4. **(2 min)** Explain the bug you found: what it was, how you
   spotted it, what your fix does.
5. **(1 min)** One thing you would improve with more time, and one
   security or compliance consideration relevant to a certification
   body that you thought about.

**Unedited.** No cuts, no re-records, no splicing. Pausing to think
is fine.

---

## What We Evaluate

- **Code quality** — works, structured reasonably, meaningful tests.
- **Bug identification** — real bug, properly fixed.
- **AI collaboration judgment** — process log shows thoughtful use.
- **Working recording** — silent recording shows a real person
  engaging with the code. We spot-check.
- **Walkthrough fluency** — you can explain your own code.
- **Compliance sensibility** — you thought about audit trail,
  sanitisation, authorisation.

---

## Data Handling

Both recordings will be stored securely by TÜV SÜD HR and deleted
after the hiring decision is made, per our standard candidate data
retention policy. You may request deletion at any time.

---

## Questions

If anything is unclear, email us before
you start. We would much rather clarify than have you guess.

Viel Erfolg — good luck.
