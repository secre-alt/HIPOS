# PWA source map

Run `npm run dev` to build and preview, `npm test` for unit checks, and
`npm run test:browser` for the browser flows. Set `PW_CHANNEL=msedge` if
using installed Edge instead of Playwright Chromium.
Run `node tests/toast.browser.mjs` for notification timing, dialog visibility,
translations, and mobile/desktop checks in both themes.
Run `node tests/sorting-feedback.browser.mjs` for answer labels, readable items,
feedback modals, Escape/review behavior, safety guidance, and visible Next controls.
Run `node tests/game-layout.browser.mjs` for game alignment checks across phone,
tablet, desktop, and landscape viewports in both themes and languages.
Run `node tests/compost-experience.browser.mjs` for held movement, captured
dragging, pause/resume, practice pace, and reward checks.

- `index.html`: shared page shell, navigation, dialogs, and settings markup.
- `app.js`: routing, page rendering, delegated UI events, and app information.
- `toast.js`: queued local notifications with duplicate suppression, pauseable timers,
  dismissible errors, and a host that follows open dialogs. `#notice` remains the
  shared message input for existing settings modules; `styles/toasts.css` styles the host.
- `pwa-runtime.js`: installation, connection status, service worker registration,
  and user-controlled updates. Initialized once by `app.js`.
- `home.js`, `guide.js`, `prevent.js`, `reuse.js`, `carry.js`: page content and interactions.
- `games.js`: the Games hub page, the Home games strip, and the list of game routes
  that keep the single Games menu item highlighted. It also renders shared Back
  and Proceed links in hub order, ending at All games.
- `game-art.js`: shared, decorative SVG illustrations for game previews,
  Compost Catch, and the garden's four growth stages and nine plants.
- `sortgame.js`, `compost.js`, `garden.js`: game rendering and interactions.
  Sorting uses the shared buddy faces for local SVG item and destination
  characters, with a stacked item-above-choices layout and compact landscape mode.
  Compost Catch pauses when hidden and requires an explicit resume; it supports
  held controls, Space/Escape pause shortcuts, buddy-style artwork, completed-item
  progress, a plastic-avoidance summary, and slower practice pace between rounds.
  `garden.js` also renders shared garden progress on completed game results.
- `core.js`: shared HTML escaping and legacy report-format helpers (reporting UI is retired).
- `content.js`, `i18n.js`: guidance content and translations.
- `buddy-voice.js`: optional local speech and chirp alternation, cooldown, and cancellation.
- Activity, buddy, audio, and preference modules remain named for their features.

## Styles

`app.css` is the ordered entry point for `styles/`. The build bundles these
files into `dist/app.css`, so the offline shell still loads one stylesheet.
Font URLs in source styles are relative to `styles/`; the build emits fonts
under `dist/fonts/`.

The stylesheet order preserves the existing cascade: base and navigation,
field guide and theme, tools, buddy and games, settings, waste picker,
layout refinements, Prevent and activities, then Reuse, Classify, Carry out, and shared toast overlays. Later rules can
override earlier rules. Keep this order when editing; grouping every rule
for the same selector together can change the appearance.

Edit source files under `pwa/`, not generated files under `dist/`.
`about.js` supplies the translated About HIPOS modal, opened from the footer or App & offline settings; `styles/about.css` styles its responsive reading layout.
