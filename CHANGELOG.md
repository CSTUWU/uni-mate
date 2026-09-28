# Changelog

All notable changes to UniMate are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

Entries are grouped under **Added**, **Changed**, **Fixed**, and **Removed**.
Dates are the dates changes landed on `main`.

> **Note on versioning:** `package.json` has never been versioned
> (`"version": "0.0.0"`) and the sidebar shows `v2.0`. These are out of sync, so
> entries below are dated rather than versioned. The version story should be
> settled before the next tagged release.

## [Unreleased]

Nothing yet.

## 2026-09-28

### Added

- GitHub Pages deployment workflow (`.github/workflows/deploy.yml`) that builds
  `dist/` and publishes on every push to `main`, with a step to copy `CNAME` into
  the artifact so the custom domain survives the build.
- `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `SUPPORT.md`, and this
  changelog.
- Issue and pull request templates.
- Project README documenting features, data flow, the UWU grading scale, and
  deployment.
- MIT `LICENSE` file, copyright CSTUWU. Previously the repository had no
  license, so the default exclusive copyright applied and the code could not
  legally be reused.

### Changed

- Rewrote the README, replacing leftover Vite template boilerplate with
  project-specific documentation.
- `Landing.tsx` decomposed into focused hooks under the single-responsibility
  principle: `useProgrammeSync` (degree and sheet state), `useGradeBook`
  (grades, custom courses, merged course list), and `usePriorGpa` (combined CGPA).
  The page is now composition rather than a state container.
- Programme selector moved out of the top navbar into the sidebar, so it is
  reachable in both the desktop layout and the mobile drawer.
- Sidebar and top bar combined into a single app shell with a shared brand
  strip; on mobile the sidebar becomes an off-canvas drawer.
- Design tokens centralised in `src/global.css`. The type scale and radius scale
  are now defined once in Tailwind v4 `@theme` and aliased onto CSS custom
  properties, replacing raw per-component pixel values.
- Branding unified through a shared `BrandLockup` component, with a
  light variant for app surfaces and a larger dark variant for the onboarding
  hero. Favicon replaced to match.

### Fixed

- Horizontal overflow on narrow viewports, caused by the programme selector
  competing with the navbar for space. Verified zero overflow from 320px to
  1440px.
- Sidebar brand losing its horizontal inset and bottom border during the
  `BrandLockup` refactor, which left the mark flush to the panel edge and the
  header separator missing.
- Programme dropdown rendering on top of its trigger. The dropdown's
  `animation: fadeUp ... both` fill mode applied a `translateY(0)` transform that
  overrode the inline transform used to position the portalled element; switched
  to an opacity-only animation.
- Spacing and alignment drift between sidebar section labels, nav icons, the
  header insets, and the wizard's step, content, and footer columns.
- Onboarding wizard aside not hiding on mobile, because an inline `display: flex`
  overrode the media query.

### Removed

- Login and registration pages, and the `/login` and `/register` routes. The
  app has no accounts, so the auth flow was dead weight. Unmatched paths now
  redirect to `/` instead of rendering a blank page.
- The entire Tailwind `--color-*` token block, which existed only for the auth
  pages' utility classes. CSS bundle reduced by roughly 7.6 kB.
- Legacy login/registration UI: fake success states, password strength meters,
  consent checkboxes, and dead links.

## 2026-08-26

### Changed

- Academic summary export switched from JSON to CSV.

## 2026-08-05

### Changed

- Reworked the calculator dashboard.

## 2026-07-19

### Added

- Landing page.
- Registration page (removed 2026-09-28).
- Login page (removed 2026-09-28).

### Removed

- Role-changing request flow from registration, dropped because it overlapped
  existing user roles.

## 2026-07-14

### Added

- Initial commit.
