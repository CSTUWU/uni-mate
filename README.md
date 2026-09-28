# UniMate

**Live site:** [unimate.cstuwu.org](https://unimate.cstuwu.org)

A client-side GPA calculator and academic progress tracker built for students of
**Uva Wellassa University of Sri Lanka (UWU)**. UniMate reads your degree's
curriculum straight from a published Google Sheet, lets you enter grades per
semester, and computes your CGPA, honours classification, and target-GPA
requirements using the official UWU grading scale.

Everything runs in the browser. There is no account, no backend, and no data
leaves your device.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Project structure](#project-structure)
- [How the data works](#how-the-data-works)
- [Grading and calculation](#grading-and-calculation)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## Features

**Curriculum sync**

- Automatically discovers every degree programme published in a Google Sheet by
  reading its sheet index, so switching programmes needs no manual setup.
- Reads an optional `[Degree]` sheet to enrich programmes with full names,
  duration in years, and academic level.
- Tolerant TSV parser — columns are located by header name (`code`, `name`,
  `credit`, `semester`) rather than fixed position, so extra columns or
  reordered headers do not break it.
- Falls back to a CORS proxy if a direct fetch to the sheet is blocked.

**GPA calculation**

- Credit-weighted CGPA with per-semester breakdowns.
- UWU honours classification (First Class, Second Class Upper/Lower, General
  Pass) computed from the live CGPA.
- Zero-credit courses are tracked but correctly excluded from the GPA
  denominator.
- **Target GPA planner** — set a goal and remaining credits, and it reports the
  average GPA you need over the semesters left to hit it.
- **Prior GPA support** for returning students, folded into a combined CGPA.

**Organisation and analysis**

- Semester cards grouped by `Year.Term` code, with inline grade, name, and
  credit editing.
- Analytics view with grade distribution and a semester-over-semester GPA trend.
- A grade scale reference page documenting every conversion used in the maths.
- Per-semester bulk grade entry.

**Data ownership**

- Custom courses for anything not in the official curriculum.
- Everything persists to `localStorage` and survives refreshes.
- CSV export of a full academic summary, including degree, CGPA, and per-course
  grades.

**Interface**

- First-run onboarding captures your degree and current semester, so you only
  ever see semesters you have actually reached.
- Responsive down to 320px, with an off-canvas drawer, keyboard-dismissible
  dialogs, and focus-visible states.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Styling | Tailwind CSS v4 for the preflight reset, plus hand-written CSS in `src/global.css` |
| Routing | React Router 7 |
| Server state | TanStack Query 5 |
| Icons | lucide-react |
| Lint | ESLint 10 + typescript-eslint |
| Hosting | GitHub Pages (Actions) |

Components carry no CSS framework utility classes. Styling goes through a small
set of semantic classes and CSS custom properties in `src/global.css`, with
Tailwind v4 present only for its preflight reset. That keeps the design tokens —
type scale, radius scale, and palette — in one reviewable place, and means the
type scale cannot drift between a `var(--text-sm)` in the stylesheet and a
`text-sm` utility in a component.

---

## Getting started

**Prerequisites:** Node.js 20.19+ (or 22.12+) and npm.

```bash
git clone https://github.com/CSTUWU/uni-mate.git
cd uni-mate
npm install
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the dev server with HMR (default port 5173) |
| `npm run build` | Type-check with `tsc -b`, then produce a production build in `dist/` |
| `npm run preview` | Serve the production build locally to verify it |
| `npm run lint` | Run ESLint across the project |

`npm run build` runs the TypeScript compiler before bundling, so type errors
fail the build rather than shipping.

---

## Project structure

```
src/
├── components/
│   ├── GpaCalculator/   # Dashboard, semester cards, analytics, modals
│   ├── Nav/             # Sidebar and programme selector
│   ├── Navbar/          # Top bar, mobile drawer toggle, reset
│   ├── Onboarding/      # First-run wizard (degree + semester)
│   └── UI/              # Reusable primitives: Button, Modal, CustomSelect, …
├── hooks/
│   ├── useProgrammeSync.ts  # Degree/sheet state and course queries
│   ├── useGradeBook.ts      # Grades, custom courses, derived course list
│   ├── usePriorGpa.ts       # Prior CGPA and combined-CGPA maths
│   ├── useGpaData.ts        # TanStack Query hooks for TSV data
│   └── usePersistedState.ts # localStorage-backed state
├── pages/Landing.tsx    # The only route; composes the hooks above
├── types/gpa.ts         # Shared domain types
└── utils/
    ├── gpaCalculator.ts # Grade scale, CGPA, honours, target planner
    ├── tsvParser.ts     # Google Sheet TSV parsing and degree discovery
    ├── csvExporter.ts   # Academic summary export
    └── semesterUtils.ts # Year.Term semester code handling
```

State lives in focused hooks rather than in the page component, so each concern
— programme sync, the grade book, prior GPA — can be read and tested on its own.

---

## How the data works

UniMate does not host a curriculum database. The published spreadsheet at
[`tsvParser.ts`](src/utils/tsvParser.ts) (`DEFAULT_GOOGLE_SHEET_TSV_URL`) is the
source of truth:

1. **Discovery** — the sheet's `pubhtml` index is fetched and scanned for
   `items.push({name: "...", gid: "..."})` entries. Each sheet becomes a degree
   programme. An optional sheet named `[Degree]` is read separately to attach
   full names, years, and level.
2. **Curriculum** — the selected programme's sheet is fetched as TSV and parsed
   by header name.
3. **Grades** — entered grades are stored in the browser, keyed by course code,
   so they survive curriculum re-syncs.

Recognised headers are matched by substring, so `Subject Code`, `Course Code`,
and `code` all work, and column order does not matter.

### Local storage keys

| Key | Contents |
| --- | --- |
| `unimate_tsv_url_v2` | Active curriculum URL |
| `unimate_active_degree_id_v2` | Selected degree identifier |
| `unimate_custom_degrees_v3` | User-added degree programmes |
| `unimate_custom_courses_v3` | User-added courses |
| `unimate_grade_overrides_v3` | Entered grades, keyed by course code |
| `unimate_prior_gpa_v2` | Prior CGPA and credit count |
| `unimate_onboarding_v3` | Onboarding selections |
| `unimate_tsv_cache_v3` | Cached fetched curriculum |

Clearing site data resets the app to the onboarding wizard.

---

## Grading and calculation

The UWU grade-to-point scale used throughout the app:

| Grade | Points | Grade | Points |
| --- | --- | --- | --- |
| A+ | 4.0 | C+ | 2.3 |
| A | 4.0 | C | 2.0 |
| A− | 3.7 | C− | 1.7 |
| B+ | 3.3 | D+ | 1.3 |
| B | 3.0 | D | 1.0 |
| B− | 2.7 | E | 0.0 |

CGPA is credit-weighted over **earned** credits only:

```
CGPA = Σ(points × credits) / Σ(credits of graded, credit-bearing courses)
```

Courses with zero credits, and courses still marked `Pending`, are excluded from
the denominator. Honours classification follows from the result:

| CGPA | Classification |
| --- | --- |
| ≥ 3.7 | First Class Honours |
| ≥ 3.3 | Second Class Upper |
| ≥ 3.0 | Second Class Lower |
| ≥ 2.0 | General Pass |
| < 2.0 | Below Passing |

The target planner solves for the average needed over remaining credits:

```
required = (target × (earned + remaining) − (current CGPA × earned)) / remaining
```

---

## Deployment

The site is published to GitHub Pages at
[unimate.cstuwu.org](https://unimate.cstuwu.org) from the `main` branch via
[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Every push to
`main` runs `npm ci`, produces `dist/`, and deploys the artifact.

**One-time repository setup:** under **Settings → Pages → Source**, select
**GitHub Actions**. Pages must not be set to "Deploy from a branch", or it will
serve the repository source (`index.html` pointing at `/src/main.tsx`) instead of
the build, and the site will render blank.

Two details the workflow handles:

- `CNAME` is copied into `dist/`, because Vite only copies `public/` and the
  custom domain would otherwise be lost from the artifact.
- No `base` path is set in `vite.config.ts`, which is correct because the custom
  domain is served from the domain root.

To verify a build locally before pushing:

```bash
npm run build && npm run preview
```

---

## Contributing

Contributions are welcome.

1. Fork the repository and create a branch from `main`.
2. Make your change, keeping the type scale and radius tokens in
   `src/global.css` as the single source of truth for styling.
3. Verify with both checks — `npm run build` and `npm run lint` must pass.
4. Open a pull request describing the change and the reasoning behind it.

Grade and credit rules live in `src/utils/gpaCalculator.ts`; curriculum parsing
lives in `src/utils/tsvParser.ts`. Keep new logic in those modules rather than
in components so the maths stays in one reviewable place.
