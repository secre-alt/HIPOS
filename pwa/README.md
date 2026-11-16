# PWA source map

Run `npm run dev` to build and preview, `npm test` for unit checks, and
`npm run test:browser` for the browser flows. Set `PW_CHANNEL=msedge` if
using installed Edge instead of Playwright Chromium.
Run `node tests/game-layout.browser.mjs` for game alignment checks across phone,
tablet, desktop, and landscape viewports in both themes and languages.
Run `node tests/compost-experience.browser.mjs` for held movement, captured
dragging, pause/resume, practice pace, and reward checks.

- `index.html`: shared page shell, navigation, dialogs, and settings markup.
- `app.js`: routing, page rendering, report workflows, and delegated UI events.
- `pwa-runtime.js`: installation, connection status, service worker registration,
  and user-controlled updates. Initialized once by `app.js`.
- `home.js`, `guide.js`, `prevent.js`, `reuse.js`, `carry.js`: page content and interactions.
- `games.js`: the Games hub page, the Home games strip, and the list of game routes
  that keep the single Games menu item highlighted.
- `game-art.js`: shared, decorative SVG illustrations for game previews,
  Compost Catch, and the garden's four growth stages and nine plants.
- `sortgame.js`, `compost.js`, `garden.js`: game rendering and interactions.
  Compost Catch pauses when hidden and requires an explicit resume; it supports
  held controls and an optional slower practice pace between rounds.
  `garden.js` also renders shared garden progress on completed game results.
- `core.js`: report validation, transfer, backup, CSV, and PIN helpers.
- `content.js`, `i18n.js`: guidance content and translations.
- Activity, buddy, audio, and preference modules remain named for their features.

## Styles

`app.css` is the ordered entry point for `styles/`. The build bundles these
files into `dist/app.css`, so the offline shell still loads one stylesheet.
Font URLs in source styles are relative to `styles/`; the build emits fonts
under `dist/fonts/`.

The stylesheet order preserves the existing cascade: base and navigation,
field guide and theme, tools, buddy and games, settings, waste picker,
layout refinements, Prevent and activities, then Reuse, Classify, and Carry out. Later rules can
override earlier rules. Keep this order when editing; grouping every rule
for the same selector together can change the appearance.

Edit source files under `pwa/`, not generated files under `dist/`.
