# Contributing to UniMate

Thanks for your interest in improving UniMate. This document covers how to get
set up, what we expect from a change, and how to get it reviewed.

UniMate is a student project maintained by the Computer Science and Technology
Department of Uva Wellassa University. Contributions of all sizes are welcome —
a typo fix is a real contribution.

- **Live site:** <https://unimate.cstuwu.org>
- **Repository:** <https://github.com/CSTUWU/uni-mate>
- **Issues:** <https://github.com/CSTUWU/uni-mate/issues>

---

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Before you start](#before-you-start)
- [Setting up](#setting-up)
- [Making a change](#making-a-change)
- [Where code belongs](#where-code-belongs)
- [Checks that must pass](#checks-that-must-pass)
- [Commit messages](#commit-messages)
- [Pull requests](#pull-requests)
- [Good first issues](#good-first-issues)
- [Reporting bugs](#reporting-bugs)

---

## Code of conduct

This project follows a [Code of Conduct](CODE_OF_CONDUCT.md). By taking part you
are agreeing to uphold it. Unacceptable behaviour can be reported through a
[private security advisory](https://github.com/CSTUWU/uni-mate/security/advisories/new)
or by contacting a maintainer directly.

---

## Before you start

**For a bug fix or small feature**, open an issue first. It takes two minutes and
prevents you from building something we have already decided to do differently.
Describe what you expected, what happened, and your UWU degree programme — the
curriculum data is loaded per degree, so most calculation bugs are
programme-specific.

**For a large change**, open an issue before writing code. If you are proposing
new behaviour, a short design note is worth more than a finished pull request we
cannot merge.

**Check existing issues and pull requests first** so you are not duplicating
work that is already in flight.

---

## Setting up

**Prerequisites:** Node.js `20.19+` or `22.12+` (this is Vite 8's supported
range) and npm.

```bash
git clone https://github.com/CSTUWU/uni-mate.git
cd uni-mate
npm install
npm run dev
```

The dev server starts on port 5173 with hot module replacement.

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server with HMR |
| `npm run build` | Type-check (`tsc -b`) then build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

Run `npm run build` before opening a pull request. It is the same check CI runs,
and it catches type errors that the dev server will happily ignore.

### Branches

- `main` — the deployed branch. Every push here triggers the GitHub Pages
  deploy, so keep it stable.
- `development` — shared work in progress.
- `feature/<name>` — one feature or fix per branch, branched from
  `development` where possible.

Do not commit directly to `main`.

---

## Making a change

1. **Branch** off `development` (or `main` if the change is urgent).
2. **Keep the change focused.** One concern per pull request. A styling fix and
   a parser rewrite belong in separate pull requests, because they get reviewed
   separately and they roll back separately.
3. **Match the surrounding code.** Follow the conventions already in the file
   rather than importing preferences from elsewhere.
4. **Comment the non-obvious, not the obvious.** Explain *why* a calculation or
   a fallback exists. Do not narrate what the next line does.
5. **Verify in a real browser** at both a desktop and a mobile width. UniMate has
   an off-canvas drawer below 900px, and layout bugs hide at exactly one size.

### Do not commit

- `node_modules/`, `dist/`, or build output
- Secrets, tokens, or personal Google Sheet URLs
- Editor configuration (`.vscode/`, `.idea/`)
- Unrelated reformatting

`.gitignore` already covers the generated paths; the workflow copies `CNAME`
into `dist/` at deploy time, so it never needs committing from `public/`.

---

## Where code belongs

Keeping the maths and the parsing in one reviewable place is the single most
important convention in this codebase, because both are easy to get subtly wrong
and hard to notice.

| Concern | Location |
| --- | --- |
| Grade scale, CGPA, honours, target planner | `src/utils/gpaCalculator.ts` |
| Google Sheet TSV parsing, degree discovery | `src/utils/tsvParser.ts` |
| `Year.Term` semester codes | `src/utils/semesterUtils.ts` |
| CSV export format | `src/utils/csvExporter.ts` |
| Degree / sheet state and queries | `src/hooks/useProgrammeSync.ts` |
| Grades, custom courses, merged list | `src/hooks/useGradeBook.ts` |
| Prior CGPA and combined CGPA | `src/hooks/usePriorGpa.ts` |
| Design tokens, layout, responsive rules | `src/global.css` |

Two rules that follow from this:

- **Do not compute GPA inside a component.** Add a function to
  `gpaCalculator.ts` and call it. If two places need the same number, they must
  call the same function.
- **Do not add styling to components with utility classes.** The type and radius
  scales are CSS custom properties in `src/global.css`. Adding a raw `px` font
  size or a one-off radius reintroduces exactly the drift the tokens exist to
  prevent.

State belongs in a focused hook, not in `src/pages/Landing.tsx`. That page should
read as composition — call the hooks, wire the results into the components — not
as a container for business logic.

---

## Checks that must pass

```bash
npm run lint
npm run build
```

`npm run build` runs `tsc -b` before bundling, so an unused variable or a wrong
prop type fails the build. ESLint must also be clean. Both run in CI on every
pull request.

If you touch the styling, also check the app at 320px, 375px, 768px, and 1440px
wide. UniMate has had horizontal-overflow bugs at small widths before, and they
are not caught by the type checker.

---

## Commit messages

Write in the imperative mood and describe the change, not the process.

```
Add CSV export for the academic summary
Fix dropdown clipped by the sidebar scroll container
Scope onboarding to semesters the student has reached
```

Avoid `update`, `fix bug`, `changes`, and similar. They make the history
unsearchable, which is the main thing a log is for.

---

## Pull requests

1. Push your branch and open a pull request against `development` (or `main` if
   that is where it branched from).
2. Fill in the pull request template: what changed, why, and how you verified it.
3. Link the related issue with `Closes #123`.
4. Request review from a maintainer. Adding yourself as a reviewer does not
   substitute for this.
5. Respond to review comments. Pushing new commits is fine; force-pushing
   shared branches is not.

Expect review to ask about the *why*. If a calculation changes, be ready to
justify it against the official UWU grading scheme — and cite the source in the
description.

---

## Good first issues

Looking for something to start on? Issues labelled `good first issue` and
`help wanted` are scoped so a newcomer can finish them. Two reliable starting
points if none are open:

- Add a course or performance note to the grade scale reference page.
- Improve an empty or error state in the calculator.

The curriculum is maintained in a shared Google Sheet rather than in the
repository, so data corrections are usually not pull requests. If you spot a
wrong credit value, raise an issue describing the course and the sheet.

---

## Reporting bugs

Please use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).
Include:

- What you expected and what actually happened
- Your UWU degree programme and current semester
- Browser and screen size
- Whether the problem persists after a refresh and after clearing site data

UniMate stores everything in `localStorage`. Clearing site data resets it to the
onboarding wizard, so ask the reporter to try that before investigating deeply.

**Please do not report security vulnerabilities in a public issue.** Follow
[SECURITY.md](SECURITY.md) instead.
