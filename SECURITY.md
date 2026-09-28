# Security Policy

## Supported versions

UniMate is a student-maintained project with no release cadence. Fixes land on
`main` as they are merged; there are no long-term support branches.

| Version | Supported |
| --- | --- |
| `main` (current deployment) | Yes |
| Anything older | No |

Because there is no versioned release line, "running an old version" is not a
distinct security posture — pull the latest `main` build from
<https://unimate.cstuwu.org>.

---

## Reporting a vulnerability

**Please do not open a public issue for a security report.**

Use GitHub's private reporting channel, which does not require an account to be
public and does not open a public thread:

> **Security advisories:** <https://github.com/CSTUWU/uni-mate/security/advisories/new>

Please include:

- What the issue is and where in the code it lives
- Steps to reproduce, or a proof of concept
- The impact you believe it has
- Whether it requires a crafted Google Sheet URL, a stored `localStorage` value,
  or a specific browser

You can expect an acknowledgement within a few days. Because this is a volunteer
project, a fix may take longer; if your report needs a faster response, say so in
the report and someone may be able to prioritise it.

If you are not comfortable with the advisory flow, you can contact a maintainer
directly through their GitHub profile. Note that a direct message is not
confidential in the same way, so prefer the advisory channel for anything
sensitive.

### What counts as a vulnerability

UniMate is a static, client-only app with no server, no accounts, and no
database. It stores grade data in the browser and fetches curricula from a public
Google Sheet. In practice, a genuine vulnerability is usually one of:

- **XSS.** Attacker-controlled content in a Google Sheet (course code, course
  name, or degree name) executing as script in the app. Course names and degree
  names are rendered from remote data, so this is the most plausible class of
  issue and the one we most want to hear about.
- **Injection into generated files.** Attacker-controlled cell values breaking out
  of the CSV export's quoting.
- **Open redirect or code execution via a crafted sheet URL.** The sync flow
  accepts an arbitrary user-supplied URL, including through a CORS proxy
  fallback.
- **A real user's data being exposed** to another user. Note that
  `localStorage` is per-origin and per-browser, so grades are not shared between
  people; a finding that contradicts this is significant and worth reporting.

Out of scope:

- Missing security headers on GitHub Pages, which are not configurable for the
  `*.github.io` platform.
- Findings that require physical access to an unlocked device.
- Denial of service against the free Google Sheets or public CORS proxy
  infrastructure.
- Grade or credit values being wrong in the source spreadsheet. That is a data
  bug — please report it as an issue so it can be fixed, not as a vulnerability.

---

## What we do when we receive a report

1. Acknowledge it.
2. Reproduce it and assess the impact.
3. Fix it on a branch, and open a pull request referencing the advisory.
4. Credit the reporter in the advisory unless they prefer to stay anonymous.
5. Deploy the fix to `main`, which publishes to the live site automatically.

If a report is not a vulnerability, we will say so and explain why, and point you
toward a public issue if that is the right route.

---

## Security posture

For context on what this project does and does not do:

- **No backend, no authentication, no database.** There is nothing to compromise
  server-side.
- **All user data stays in the browser** under `localStorage`, keys prefixed
  `unimate_`. Clearing site data removes it permanently — there is no server-side
  copy and no recovery.
- **Curriculum data is fetched at runtime** from a published Google Sheet. It is
  treated as untrusted input, and anything rendering it should treat it as text,
  never as markup.
- **The app is served as static files** from GitHub Pages, so the effective
  security ceiling is GitHub's own.

If you are reviewing this project, the two places to look first are the TSV
parsing in `src/utils/tsvParser.ts` and the rendering of course and degree names
in `src/components/`.
