## What this changes

<!-- One or two sentences. If this solves an issue, end with "Closes #123". -->

Closes #

## Why

<!-- The reasoning, not the diff. What problem does this solve, and why this
     approach? Link to an issue if there is one. -->

## How it was verified

<!-- Be specific — "looks good" is not verification. -->

- [ ] `npm run lint` passes
- [ ] `npm run build` passes *(this runs `tsc -b`, so it catches type errors)*
- [ ] Tested in a real browser at a desktop width
- [ ] Tested in a real browser at a mobile width
- [ ] Checked for horizontal overflow at 320px

<!-- If you touched styling, confirm the type and radius tokens in
     src/global.css were used rather than new raw pixel values. -->

## Screenshots

<!-- Before and after for any visual change. Required if this changes layout,
     spacing, or branding. -->

| Before | After |
| --- | --- |
|  |  |

## Review notes

<!-- Anything a reviewer should pay particular attention to, or anything you are
     unsure about. Naming the uncertain part up front is much cheaper than
     having it found in review. -->

---

<!-- Reminders for the PR author:
     - One concern per pull request.
     - Do not commit node_modules/, dist/, or build output.
     - Base the branch on development where possible; never commit to main.
     - "Update" or "fix bug" are not acceptable commit messages.
     See CONTRIBUTING.md for the full guide. -->
