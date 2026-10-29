# 00 — START HERE (read this first)

## Mission
Build the Gridbricks / REint hiring-challenge web app end to end, production-ready,
inside a 16-hour budget. The challenge document is titled **"REint Full Stack SWE
challenge v4 Shared"** and the name "Gridbricks" does not appear in it — that
mismatch is flagged in `09-SUBMISSION-KIT.md` and in the draft reply to Harisankar
(Sam holds the draft; it is NOT sent). Do not assume anything about the employer
name until Harisankar confirms.

## The job in one paragraph
A UK energy utility team buys power in the UK day-ahead market. They need a web app
that shows the **latest wind-generation forecasts that were available when day-ahead
purchase decisions had to be made**, and lets them **evaluate forecast accuracy
quantitatively**. Data: **national-level wind, Elexon only** — FUELHH actuals and
WINDFOR forecasts — scoped to **purchase decisions to be made in January 2026**.
Stack: **React front-end, Python back-end, Docker for local development, deploy
on Vercel** — the Vite frontend as static hosting and the FastAPI backend as a
Python serverless function in the same Vercel project (same origin, no
separate backend host).
AI tools are allowed **only if explicitly mentioned in the README**. Cap: **do not
spend more than 16 hours**. Deadline wording (verbatim in substance): **"There is
no deadline for submission. However, the earlier the better."**

## How to use this pack
Read the files in this order. Do not skip 02 (data) — the two traps in it
(wrong-date query params, forecast/actual scope gap) will silently corrupt the
product if missed.

| # | File | What it decides |
|---|---|---|
| 00 | `00-START-HERE.md` (this file) | Mission, order, gates |
| 01 | `01-PRODUCT-BRIEF.md` | What the user does, screens, acceptance criteria |
| 02 | `02-DATA-SPEC.md` | Elexon queries (verified live), fields, scope flag |
| 03 | `03-ARCHITECTURE.md` | Repo layout, data flow, env, errors, performance |
| 04 | `04-API-SPEC.md` | Backend endpoints and schemas — build exactly these |
| 05 | `05-UI-DESIGN-SPEC.md` | Design system, screens, charts, accessibility, Impeccable workflow |
| 06 | `06-TESTING-QA.md` | Test plan and quality gates |
| 07 | `07-DEPLOYMENT-OPS.md` | Vercel deploy (static + serverless function), Docker local dev, secrets, verification |
| 08 | `08-BUILD-PLAN.md` | 16-hour task list with acceptance criteria per task |
| 09 | `09-SUBMISSION-KIT.md` | Video, README, anonymous repo, submission form |
| — | `AGENTS.md` (repo root) | Standing instructions for the coding agent |
| — | `SKILLS.md` | GitHub skills to install, per phase, with verified install commands |

## Hard constraints (non-negotiable)
1. **Elexon only.** No other data source, no invented or placeholder numbers anywhere
   in the UI. Every figure shown must trace to a cached Elexon response.
2. **No lookahead bias.** A forecast is shown for a decision moment only if its
   `publishTime` is at or before that moment. This is the core intellectual
   requirement — enforce it in the data layer AND test it.
3. **No secrets in the repo.** API keys live in env vars / server-side only. The
   repo is public and the reviewer will read its history.
4. **January 2026 scope.** Only data relevant to purchase decisions to be made in
   January 2026. Do not pull or display unrelated periods.
5. **Anonymous repo name.** The public GitHub repo must use an anonymous name
   (no personal identifiers). See `09-SUBMISSION-KIT.md`.
6. **16-hour cap.** Follow `08-BUILD-PLAN.md`. If a task overruns, cut scope
   (Section 01 non-goals), never quality gates.
7. **Honesty in the UI.** Label the WINDFOR/FUELHH scope difference wherever
   forecast and actuals are compared (see `02-DATA-SPEC.md`). Never present the
   scope gap as pure forecast error.

## Quality gates (all must pass before submission)
- [ ] `npm run build` (web) and `pytest` (api) green; `tsc --noEmit` clean.
- [ ] `npx impeccable detect` on the dev-server URL returns no P0/P1 findings
      (see `SKILLS.md`); accessibility audit run and P0s fixed.
- [ ] All URLs (deployed app, repo, video) verified in an **incognito window**.
- [ ] README complete per `09-SUBMISSION-KIT.md`, including AI-tools disclosure.
- [ ] No `TODO`, placeholder, or lorem ipsum anywhere in the shipped app.

## Open verifications (resolve during the build, do not guess)
1. **Decision cutoff clock times** — confirm the exact cutoff times from the
   challenge document. The app treats cutoffs as parameters; defaults must come
   from the document, not invention.
2. **WINDFOR vs FUELHH population definitions** — check Elexon dataset
   definitions (see task D-4 in `08-BUILD-PLAN.md`). If they differ, document it;
   do not silently compare unlike populations.
3. **Vercel function constraints** — serverless functions are stateless with a
   read-only filesystem (except `/tmp`); the January cache must therefore be
   bundled with the deployment (see `02-DATA-SPEC.md` / `07-DEPLOYMENT-OPS.md`).
   Verify the bundle contains the cache with `vercel build` before the first
   deploy; Hobby plan duration is 300s max with Fluid Compute — far above what
   cached reads need.

## If anything in this pack conflicts with the challenge document
The challenge document wins. Note the conflict in the README and tell Sam.
