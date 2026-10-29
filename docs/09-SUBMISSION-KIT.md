# 09 — SUBMISSION KIT

## Deliverables (from the challenge document)
1. **Unlisted YouTube video, max 10 minutes total.** Evaluation starts with
   the video — **do not submit without it.**
2. **Public GitHub repo** with an **anonymous name** and a README.
3. **Submission form:** "Full Stack SWE challenge submission v4 – Fill out
   form" (link in Harisankar's email). Submit the video, repo, and deployed-app
   details there.

## ⚠️ Name-mismatch flag
The challenge document is titled "REint Full Stack SWE challenge" and never
mentions Gridbricks. The draft reply to Harisankar asks him to confirm it is
the right document. Until he confirms: use neutral language in the video and
README ("the hiring challenge", "the brief"), do not assert the employer name,
and do not put either company name in the repo name. If Harisankar confirms,
use the confirmed name; if he does not reply, stay neutral.

## Video (≤10:00 total, unlisted)
- **Part 1 (≤5:00) — pitch to the customer.** Who it is for, the decision-time
  problem in plain language, a live walkthrough of the Decision view on one
  January day, the accuracy story (including the scope caveat, in one honest
  sentence), and what the team would do with it on Monday morning.
- **Part 2 (≤5:00) — architecture / design / analysis / code.** Repo tour,
  data flow (Elexon → cache → API → UI), the lookahead-bias rule and its
  regression test, the temporal alignment choice, the metrics, Docker/deploy,
  and the honest limitations (scope gap, single-month window).
- **Rules:** screen-record the DEPLOYED app (hit `/api/health` first to warm
  the serverless function — the first request after idle is slower); no personal identifiers on screen (anonymous browser profile,
  no bookmarks/names visible); captions on; check audio levels; keep the
  runtime visible (YouTube shows it) — if a part runs over, cut, do not speed up.
- **Shot list (record in this order):** cold open on Decision view → change
  cutoff, narrate the vintage change → Accuracy view, sort by bias → Vintage
  explorer scrub → About/methods → code: `decisions.py` + the regression test
  → terminal: `pytest` green → `docker compose up` → deployed URL in
  incognito. Edit to ≤10:00; verify the uploaded video plays in incognito.

## README (required contents)
1. What the app does + who it is for (2–3 sentences).
2. File and directory details (what lives where, and why).
3. How to start: prerequisites, env vars, fetch script, `docker compose up`,
   local dev commands, tests.
4. Link to the deployed Vercel app + API docs (`/api/docs` on the deployed URL).
5. Data & methods: Elexon sources, the exact queries, the decision-time rule,
   metric formulas, the January 2026 window, the WINDFOR/FUELHH scope note.
6. **AI tools used** (explicit, per the brief): tool names + what each did
   (e.g. "Google Antigravity — implementation", "Impeccable skill — design
   review", "Genie/Muse — research and task pack"). Include the installed
   skills and their versions.
7. QA note: test commands + results, Impeccable detect result, incognito
   verification date.
8. Build log: hours per phase (16h cap), limitations, and what was cut, if
   anything.
9. Licence note if any dependency requires attribution (check licences of
   Recharts, Tailwind, FastAPI — all permissive; state the outcome).

## Anonymous repo rules
- Repo name: neutral, anonymous (e.g. `uk-wind-dayahead-accuracy` — no
  personal name, no employer name until confirmed).
- No personal names/emails in commits, README, UI, or video. Check
  `git log` and the GitHub profile shown in the video before recording.
- Public from the first push; the reviewer must be able to clone without
  access requests.

## Submission checklist (all must be true)
- [ ] Video unlisted, ≤10:00, both parts present, plays in incognito.
- [ ] Repo public, anonymous, README complete, green at HEAD, tag
  `submission-v1` pushed.
- [ ] Deployed app loads with real data in incognito; `/api/health` shows
  `cacheLoaded: true`.
- [ ] All three URLs pasted into the form; form submitted; confirmation
  (screenshot/text) saved.
- [ ] No secrets anywhere in the repo history (`git log -p | rg -i
  "api[_-]?key|secret|token"` reviewed; `.env` never committed).

## After submission
Tell Sam: the three URLs, the form confirmation, total hours spent, and any
open items (e.g. Harisankar's naming confirmation). Do not contact Harisankar
again unless Sam asks.
