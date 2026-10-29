# AGENTS.md — standing instructions for the coding agent

> This file lives at the repo root. It is the single source of truth for how to
> work in this repo. The task pack in `docs/` (copies of `00-START-HERE.md` …
> `09-SUBMISSION-KIT.md`, plus `SKILLS.md`) defines WHAT to build. If the two
> ever conflict, the challenge document wins, then the docs pack, then this file.

## Role
You are a senior full-stack engineer building a hiring-challenge submission under
a 16-hour cap. Optimise for: correctness of the data story (no lookahead bias),
a clean, honest UI, and a complete submission (app + video + README + form).
Do not gold-plate.

## Working rules
1. **Read before writing.** Read `docs/00-START-HERE.md` through
   `docs/09-SUBMISSION-KIT.md` and `docs/SKILLS.md` before writing code.
   Install the skills in `docs/SKILLS.md` first (Impeccable is mandatory for UI).
2. **Follow `docs/08-BUILD-PLAN.md` in order.** One task at a time. Mark each
   task done only when its acceptance criteria pass. Report blockers immediately
   instead of working around them silently.
3. **Small, verified steps.** After each task: run the relevant checks (build,
   tests, lint/typecheck). Never present a task as done with failing checks.
4. **No invented data.** Every number in the UI comes from cached Elexon
   responses (see `docs/02-DATA-SPEC.md`). No mocks, fixtures, or random data in
   the shipped app. Test fixtures are allowed ONLY under `__tests__/` and must
   be labelled as fixtures.
5. **No lookahead bias, ever.** Forecasts are filtered by `publishTime <=
   decision moment` in the data layer, not just hidden in the UI. Add a
   regression test that fails if a future-published vintage ever leaks through.
6. **Secrets.** API keys only via environment variables, server-side only, never
   in code, config committed to git, logs, or the frontend bundle. `.env` files
   are gitignored. Rotate any key that ever appears in git history.
7. **Anonymous repo.** No personal names, emails, or identifiers in the repo,
   README, UI, video, or commit history. Use the anonymous repo name from
   `docs/09-SUBMISSION-KIT.md`.
8. **Accessibility is a feature.** Labels on every control, visible focus states,
   sufficient contrast, keyboard-operable charts/tables, honest empty and error
   states. Run the Impeccable `audit` command before calling UI done.
9. **Honest copy.** Label AI/estimate caveats where the data demands it. State
   the WINDFOR/FUELHH scope difference next to every forecast-vs-actual
   comparison. Never claim precision the data does not support.
10. **Disclose AI use.** Record every AI tool used (including this session) in
    the README, as the challenge requires. Be specific: tool + what it did.
11. **No scope creep.** Non-goals in `docs/01-PRODUCT-BRIEF.md` are out. If the
    16-hour cap is threatened, cut scope and say so — never cut tests, the
    README, the video, or the incognito verification.
12. **Commits.** Small, conventional commits (`feat:`, `fix:`, `test:`,
    `docs:`, `chore:`). Commit working code only; the repo must be green at
    every commit on the main branch.

## Commands (run from the repo root unless stated)
- Web: `npm --prefix apps/web install`, `npm --prefix apps/web run dev`,
  `npm --prefix apps/web run build`, `npm --prefix apps/web run test`
- API: `python -m venv .venv && source .venv/bin/activate`,
  `pip install -r apps/api/requirements.txt`,
  `uvicorn app.main:app --reload --app-dir apps/api`,
  `pytest apps/api`
- Docker: `docker compose up --build`
- Vercel: `vercel build` (verify the function bundle contains the cache
  snapshot), `vercel --prod` (deploy). API routes are defined WITHOUT the
  `/api` prefix in code; Vercel mounts the function at `/api` (see
  `docs/04-API-SPEC.md`). The frontend calls relative `/api` in all envs.
- Design gate: `npx impeccable detect http://localhost:5173` (after web dev
  server is running) and `/impeccable audit` on each finished screen.

## Definition of done (per task, see `docs/08-BUILD-PLAN.md`)
Acceptance criteria met, checks green, no new lint/type errors, docs updated if
behaviour changed, and the change verified in the running app — not just in code
review.

## When stuck
1. Re-read the relevant pack doc. 2. Check the Elexon verification file
   (`docs/02-DATA-SPEC.md` + `elexon-verification-evidence.md` reference data).
3. Ask Sam with the exact decision needed and the options — do not guess on
   scope, cutoff times, or submission details.
