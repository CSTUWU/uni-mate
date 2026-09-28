# Support

UniMate is maintained by students of the Computer Science and Technology
Department of Uva Wellassa University. There is no support desk, no SLA, and no
staffed ticket queue — so please pick the channel that gets you help fastest.

- **Live app:** <https://unimate.cstuwu.org>
- **Bug reports and feature requests:** <https://github.com/CSTUWU/uni-mate/issues>
- **Security vulnerabilities:** see [SECURITY.md](SECURITY.md) — not a public issue
- **Contribution guide:** [CONTRIBUTING.md](CONTRIBUTING.md)

---

## Before you report anything

Most reports are caused by one of four things. Check these first — each takes
under a minute and often resolves the problem outright.

**1. Your grades are not being saved.**
Grades live in your browser's `localStorage`, not on a server. Private or
incognito windows, and some browser settings, discard that data when the tab
closes. Check that you are in a normal window, and note that clearing site data
resets the app permanently.

**2. Your degree programme is missing or has the wrong courses.**
The curriculum is not stored in the app. It is read at runtime from a shared
public Google Sheet, and each sheet is discovered automatically. If your
programme is absent, the sheet is not published in that workbook, or its name is
not what the app expects. Raise an issue with the programme name.

**3. A semester will not appear.**
If you completed onboarding, the app shows only semesters up to the point you
selected, so later semesters are hidden by design. Clear site data to revisit the
onboarding wizard, or add the semester with **Add Another Semester**.

**4. A credit value is wrong.**
Credit values come from the source spreadsheet, not from this repository, so it
cannot be fixed with a pull request. Please open an issue naming the course, the
programme, and the correct credit value.

---

## Reporting a bug

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md) and include:

- What you expected, and what happened instead
- Your UWU degree programme and current semester
- Browser and version, and your screen size
- Whether it survives a refresh, and whether it survives clearing site data
- If the console shows an error, the text of it

That is enough for someone else to reproduce it. A screenshot helps, but the
text details matter more.

---

## Requesting a feature

Open an issue with [the feature request template](.github/ISSUE_TEMPLATE/feature_request.md).
Describe the problem you are trying to solve rather than only the interface you
want — it is often possible to solve the problem a different way, and the
maintainers may have a view.

Requests are prioritised roughly by:

1. Correctness — anything that shows a wrong GPA, loses data, or breaks on a
   common device.
2. Accessibility and mobile usability.
3. Curriculum and data accuracy.
4. Everything else.

---

## What we cannot help with

- **Recovering lost grades.** There is no server-side copy. If the data is gone
  from your browser, it cannot be recovered by anyone.
- **Official transcripts or registration.** UniMate is an unofficial,
  self-reported tool for your own tracking. It is not connected to the
  university, and its results are not official.
- **Confirming a grade you believe was recorded incorrectly.** Only the
  university can confirm recorded results.
- **Grading policy disputes.** If a course's credit value or the grading scheme
  is wrong, that has to be raised with the department.

---

## Current known limitations

Honest about what is not finished:

- **No offline support.** The app needs to reach the Google Sheet to load a
  curriculum. Once subjects are loaded, editing grades works offline, but
  switching programmes does not.
- **No accounts or sync.** Grades are per-browser. They do not follow you to
  another device or another browser.
- **No semester-level reset.** To clear everything, use **Reset all grades** in
  the header, or clear site data.
- **CORS fallback dependency.** If a direct fetch to the sheet is blocked, the
  app falls back to a public third-party CORS proxy. That fallback can be slow or
  unavailable, and it means a sheet URL passes through that proxy.
- **No automated tests.** Correctness is currently verified by review and manual
  testing. If you want to add a test suite, that contribution would be very
  welcome — see [CONTRIBUTING.md](CONTRIBUTING.md).
