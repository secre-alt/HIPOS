# Working on HIPOS

These instructions apply throughout this repository. Follow the user's current
request; preserve unrelated work already present in the working tree.

## Project and source

- HIPOS is an offline-first PWA built with JavaScript ES modules and esbuild.
- Read `pwa/README.md` for the source map and
  `docs/DEVELOPMENT_RULES.md` for product behavior to preserve.
- Edit source under `pwa/`, `scripts/`, and `tests/`. Do not manually edit
  generated `dist/` files, distribution archives, or `node_modules/`.
- The Android project under `app/` is reference source. Change it only when
  the task involves Android.
- `pwa/app.css` is an ordered import entry point. Edit the appropriate file in
  `pwa/styles/`; preserve import order and inspect later overrides before adding
  selectors. Avoid accumulating duplicate override blocks.
- Keep page-specific rendering and interactions in their existing modules.
  Keep shared routing and delegated events in `app.js`.
- Inspect the actual current markup before selecting cards or other UI elements;
  Prevent and Reuse use custom card classes.

## Implementation rules

- Keep changes focused and compatible with saved preferences and existing data.
- Preserve offline operation. Bundle assets locally and include new shell assets
  in the build's service-worker cache when needed.
- Do not add remote fonts, audio, scripts, analytics, accounts, or synchronization
  without a request that calls for them.
- Validate imported data and escape user text before rendering HTML. Preserve
  report validation, duplicate checks, explicit import confirmation, and CSV
  formula protection.
- Keep English and Filipino UI translations in `pwa/i18n.js`. Preserve report
  text and transfer payloads in their original language.
- Use semantic controls, accessible names, keyboard focus, visible focus styles,
  and touch targets of at least 44px. Respect reduced motion.
- Handle unavailable or damaged browser storage without breaking the page.
- Do not invent school procedures or approval. Follow
  `docs/SCHOOL_INFORMATION.md` for school-specific content.

## Verification

- For code or asset changes, run `npm.cmd run build` on Windows
  (`npm run build` on other shells).
- Run focused unit tests for changed logic with
  `node --test tests/<name>.test.mjs`; use `npm.cmd test` for shared behavior.
- For changes to layout or interactions, check the affected route at desktop
  and mobile widths. Check both themes when changing colors.
- Use meaningful behavior tests for new logic and bug fixes; do not add tests
  solely to duplicate implementation details or for documentation-only edits.
- Full browser validation: `npm.cmd run test:browser`. On Windows, installed
  Edge can be selected with `$env:PW_CHANNEL='msedge'` in PowerShell.
- `npm.cmd run dev` builds and serves on port 4173. Restart or rebuild after
  source changes; it is not a watch server. Use a different `PORT` if occupied,
  and stop only processes started for your task.
- Report what changed, what was actually checked, and any unresolved failures.
  Do not claim browser or device verification based only on a successful build.

## Collaboration

- Start with `git status --short`; never discard unrelated edits.
- Prefer targeted searches and small patches over broad rewrites.
- Do not commit, push, publish, or deploy unless requested.
- Keep these rules and the source map accurate when architecture changes.
