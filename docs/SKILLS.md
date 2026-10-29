# SKILLS.md — GitHub agent skills for this project

All entries were verified against the public GitHub repos on 29 Oct 2026 (repo
READMEs and install docs). Star counts are from that date and will drift — the
install commands are the durable part. Install only the skills named below;
installing whole collections adds noise and slows the agent down.

**Target tool: Google Antigravity.** Antigravity reads skills from the
`.agent/skills/` project folder (per Impeccable's documented layout) and from
`~/.gemini/config/skills/` globally; the alirezarezvani collection installs to
`~/.gemini/antigravity/skills/` via its script. After installing, reload the
tool and confirm each skill is visible before relying on it.

---

## 1. Impeccable — UI/design (MANDATORY for all frontend work)

| | |
|---|---|
| Repo | `https://github.com/pbakaus/impeccable` |
| Licence | Apache-2.0 |
| Stars | ~94,852 (29 Oct 2026) |
| What it is | A design vocabulary for coding agents: 24 commands, ~40 playbooks, and a
deterministic slop detector with 62 rules (no LLM, no API key) that flags
AI-slop tells: Inter for everything, purple-to-blue gradients, cards nested in
cards, gray text on colored backgrounds, cramped padding, skipped headings. |
| Why this project | This app is an **Operate-mode dashboard** (dense data UI for traders), and
Impeccable is the skill built for app/dashboard surfaces. It is strongest on
interfaces that already exist — point it at a component and iterate. |

### Install
```bash
npx impeccable install        # detect tools, choose project scope, ACCEPT the hook offer where available
```
Then reload the tool and run `/impeccable init` inside the agent — it reads the
code, asks what it cannot infer, and writes `PRODUCT.md`. Run
`/impeccable document` to capture the visual system in `DESIGN.md`.

Manual-copy fallback (no Node, or to pin a version): copy the `skills/impeccable`
folder from the repo's `.agent/` directory into the project's `.agent/skills/`.
A manual copy skips the hook and subagents — prefer `npx impeccable install`.

### Commands to use, by phase
| Phase | Commands |
|---|---|
| Before building UI | `/impeccable init`, `/impeccable shape` (plan UX before code), `/impeccable document` |
| While building | `/impeccable critique <target>` (scored UX review), `/impeccable typeset`, `/impeccable layout`, `/impeccable colorize` |
| Before shipping | `/impeccable audit` (accessibility, performance, responsive; findings P0–P3), `/impeccable polish`, `/impeccable harden` (errors, overflow, edge cases), `/impeccable adapt` (screen sizes) |
| Live iteration | `/impeccable live` — opens the Vite dev server with an overlay; pick an element and cycle variants. Works with Vite. **Local checkout only** — never inject into a deployed site. |

### Quality gate (run, do not skip)
```bash
npx impeccable detect src/                        # pattern rules on source
npx impeccable detect http://localhost:5173        # rendered-page rules (contrast, tiny text)
npx impeccable detect --json .                     # machine-readable output
```
Exit code `2` = findings, `1` = a target could not be scanned. No P0/P1 findings
may ship. To silence a rule for one file, use an `impeccable-disable` comment
with a reason — never disable rules globally.

### Caveats
- **Hook:** the automatic design hook (scans every UI file the agent edits) is
  confirmed for Claude Code, Cursor, Codex, GitHub Copilot, Grok Build and
  Hermes Agent. For Antigravity, rely on the commands + the `detect` CLI gate
  above; do not claim hook coverage that was not verified.
- **Live mode** runs the repo's optional `impeccable:manual-edit-validate`
  script for copy edits — review that script before using live mode in an
  unfamiliar repo. Not needed here (this repo is ours).
- **Install side effects:** the installer also writes provider-native hook
  manifests on some tools. Review what it adds before committing.

## 2. alirezarezvani/claude-skills — engineering skills library (SELECTIVE)

| | |
|---|---|
| Repo | `https://github.com/alirezarezvani/claude-skills` |
| Licence | MIT |
| Stars | ~28,968 (29 Oct 2026) |
| What it is | 380+ agent skills across engineering, DevOps, QA, security and product,
each a `SKILL.md` + references/scripts. Explicitly supports Antigravity. |

### Install (Antigravity)
```bash
git clone https://github.com/alirezarezvani/claude-skills.git /tmp/claude-skills
cd /tmp/claude-skills
./scripts/install.sh --tool antigravity   # installs to ~/.gemini/antigravity/skills/
```
### Curated picks — install ONLY these
| Skill | Use it for | Phase |
|---|---|---|
| `frontend-design` | Production-grade React/Tailwind UI | UI build |
| `tdd-guide` | Red-green-refactor TDD workflow, coverage tracking | Testing |
| `docker-development` | Dockerfile optimisation, multi-stage builds, container security | Docker/deploy |
| `senior-devops` | IaC, CI/CD, monitoring, deploy playbooks | Deploy |
| `pr-review-expert` | Multi-pass review: logic bugs, security, missing tests | Pre-submission review |
| Engineering bundle extras (browse `engineering/`): `a11y audit`, Playwright testing toolkit | Accessibility audit, end-to-end checks | QA |

**Verification note:** the exact skill folder names live under the repo's
`engineering/` (and related) directories and the collection is actively
maintained — after cloning, list the directories and confirm each name above
exists before installing. If a name has moved, install its closest equivalent
and note the substitution in the README. Do NOT install the whole collection.

## 3. Taste Skill — design alternative (OPTIONAL, not primary)

| | |
|---|---|
| Repo | `https://github.com/Leonxlnx/taste-skill` |
| Licence | MIT |
| Stars | ~95,500 (Oct 2026) |
| What it is | A single long `SKILL.md` (~1,200 lines) of design rules with a "design
read" + three dials + banned-pattern rules. |

Install: `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`.
**Use only if Impeccable is unavailable.** Independent testing found it best for
landing pages/portfolios, not dashboards — this project is a dashboard, so
Impeccable stays primary. Do not install both and mix their rules.

## 4. Jeffallan/claude-skills — framework skills (BROWSE, pick 2–3)

| | |
|---|---|
| Repo | `https://github.com/Jeffallan/claude-skills` |
| What it is | 67 skills covering React, Next.js, Python, FastAPI, Docker, CI/CD,
security hardening and testing, all in the open `SKILL.md` standard. |

Install: `npx skills add Jeffallan/claude-skills --all -g -y` installs **all
67 — do not do that**. Browse the repo, pick the FastAPI/backend, React
frontend and Docker skills by name, and install only those. Names were not
individually verified — confirm each `SKILL.md` exists in the repo before use.

## 5. Data-layer libraries (not agent skills — pip packages)

| Package | Purpose |
|---|---|
| `elexon-bmrs` | Python client for the Elexon BMRS API; works without a key at lower rate limits. Free key via Elexon Portal registration (`BMRS_API_KEY` env var). |
| `ElexonDataPortal` | Alternative Python client with FUELHH / WINDFORFUELHH stream support. |

A thin `requests`-based client + disk cache is equally acceptable and easier to
explain in the video. Whichever is chosen, the exact queries in
`02-DATA-SPEC.md` are authoritative — the library must not change the query
semantics (especially the `settlementDateFrom/To` and single-`publishTime`
as-of behaviour).

## Skill hygiene rules
- A skill is a guide, not an authority: where a skill's generic advice conflicts
  with this pack (especially `02-DATA-SPEC.md`), this pack wins.
- Never let a skill add dependencies, files, or "helpful" features outside the
  task being executed.
- Record installed skills + versions in the README's AI-tools disclosure.
