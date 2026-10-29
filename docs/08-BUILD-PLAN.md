# 08 — BUILD PLAN (16 hours, task order = build order)

Work tasks in order. A task is done only when its acceptance criteria pass.
Log actual time per task in the README's build log — the 16-hour cap is part of
the brief, and the reviewer should be able to see it was respected.

## Phase A — Foundations (2.0h)
- **A-1 (0.5h) Setup.** Anonymous repo created; layout per `03-ARCHITECTURE.md`;
  `.gitignore`; lockfiles; `AGENTS.md` + `docs/` pack committed; Elexon Portal
  registration started (free key → env var, server-side only).
  *Done when:* clean clone builds the skeletons; no secrets committed.
- **A-2 (1.5h) Data layer.** `elexon.py` (the two verified queries, nothing
  else) + `fetch_january.py` + validation per `02-DATA-SPEC.md`; full January
  window cached with `provenance.json`.
  *Done when:* all validation rules pass; 31 days × 48 actuals; ≥1 vintage per
  delivery day; the `from`/`to` trap test exists and passes.

## Phase B — Backend + accuracy engine (4.0h)
- **B-1 (1.0h) Accuracy engine.** `metrics.py` (MAE/RMSE/bias, pure functions)
  + `decisions.py` (vintage selection, `publishTime <= cutoff`) with the full
  test set from `06-TESTING-QA.md`, including the late-vintage regression test.
  *Done when:* 100% coverage of both modules; all tests green.
- **B-2 (2.0h) API.** FastAPI app implementing `04-API-SPEC.md` exactly;
  Pydantic schemas; error contract; CORS; `/docs` clean.
  *Done when:* every endpoint matches its spec payload; error paths return the
  contract; TestClient suite green.
- **B-3 (1.0h) Scope task (D-4).** Check Elexon dataset definitions for
  WINDFOR vs FUELHH WIND; look for a same-population actuals series; write the
  scope note into the About content + README + API `scopeNote` fields.
  *Done when:* the note states what was checked and what was concluded, with
  sources; no silent comparison anywhere.

## Phase C — Frontend (4.0h)
- **C-1 (0.5h) Scaffold + skills.** Vite + React + TS + Tailwind + Recharts;
  Impeccable installed; `/impeccable init` + `shape`; tokens from
  `05-UI-DESIGN-SPEC.md` in `index.css`.
  *Done when:* app boots; PRODUCT.md/DESIGN.md written; tokens live.
- **C-2 (2.0h) Screens 1–2.** DecisionView + AccuracyView with real API data,
  charts with table toggles, CaveatBanner, all four states.
  *Done when:* US1–US3 pass against the local API; critique run, findings fixed.
- **C-3 (1.0h) Screens 3–4.** VintageExplorer + AboutView.
  *Done when:* US4–US5 pass; explorer never shows a future vintage.
- **C-4 (0.5h) Design pass.** `/impeccable critique` + `audit` per screen;
  responsive checkpoints (375/768/1280/1600); `npx impeccable detect` gate.
  *Done when:* zero P0/P1 findings; keyboard-only pass clean.

## Phase D — Hardening + deploy (3.5h)
- **D-1 (1.0h) Tests + QA.** Frontend test set; full `06-TESTING-QA.md`
  smoke pass; fix what it finds.
- **D-2 (1.5h) Vercel deploy.** `api/index.py` entrypoint + `vercel.json` +
  `.python-version`; `vercel build` locally and confirm the function bundle
  contains the cache snapshot; `vercel --prod`; smoke pass against the
  deployed URL; incognito check #1. Docker compose stays green for local dev.
  *Done when:* the single Vercel URL serves the full app with real data to a
  signed-out browser.
- **D-3 (1.0h) README + repo hygiene.** README per `09-SUBMISSION-KIT.md`
  (file/dir details, how to start, deployed link, AI disclosure, scope note,
  QA note, build log); commit history clean; `rg` check for TODO/secrets.
  *Done when:* a stranger can clone, run, and understand the project from the
  README alone.

## Phase E — Video + submission (2.5h)
- **E-1 (1.5h) Video.** Script + record + edit per `09-SUBMISSION-KIT.md`
  (Part 1 ≤ 5 min pitch, Part 2 ≤ 5 min technical; total ≤ 10 min). Upload
  **unlisted** to YouTube; verify in incognito.
- **E-2 (0.5h) Submission form.** Fill the "Full Stack SWE challenge
  submission v4" form with the three verified URLs. Verify each URL in
  incognito FIRST (see 09).
- **E-3 (0.5h) Buffer.** Reserved for whatever broke. If unused, spend it on
  the Impeccable `polish` pass and a second incognito check.

**Total: 16.0h.** If any phase overruns by >30 min, cut in this order:
VintageExplorer polish → HorizonChart variants → E2E automation. Never cut:
the decision-time regression test, the scope note, the README, the video, or
the incognito verification.
