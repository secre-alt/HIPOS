# HIPOS PWA architecture

The app has no runtime server, remote fonts, CDN scripts, analytics, or automatic report uploads. A connection is needed for the initial page load; the service worker caches the full application shell for later use.

## Files

- `pwa/`: application HTML, CSS, guide content, browser UI, and legacy report-format helpers.
- `scripts/build-pwa.mjs`: bundles JavaScript, generates PNG app icons, and creates a content-versioned service worker in `dist/`.
- `scripts/serve-pwa.mjs`: builds and serves `dist/` on localhost for development. Restart after editing source.
- `tests/core.test.mjs`: report validation, actual QR encode/decode, duplicate protection, PIN verifier, and HTML escaping.
- `tests/browser.mjs`: navigation, activity persistence, offline caching, and mobile viewport checks.

The service worker uses a cache name derived from all shell files. An updated worker waits to activate until the person taps **Update now** in the in-app "A new version of HIPOS is ready." banner (or closes every app window). The app checks for updates on launch, when it returns to the foreground, when the connection comes back, and every 30 minutes while open and online. The first install never shows the banner or reloads the page. Tapping **Update now** sends `SKIP_WAITING` to the waiting worker and reloads once it takes control. Activation removes only obsolete HIPOS shell caches for its own scope. Browser report storage is independent of these caches.

## Data

Activity and preferences remain local to the current browser profile and origin.
My Concerns and Staff review have been removed, including QR transfer, camera
scanning, PIN entry, report backup/restore, and staff CSV export. Old reporting
URLs render Home. There is no reporting shortcut or automatic submission.

Legacy report data under `hipos.pwa.v1` is left untouched and is not loaded by
this version. Legacy format helpers and their unit tests remain for compatibility.
Browser storage may be cleared or evicted; changing domains does not move data.

## Hosting

Run `npm run build` and deploy the **contents of `dist/`** to a static HTTPS host. Relative asset URLs, manifest scope, and service worker registration support deployment in a subdirectory. Serve `.webmanifest` as `application/manifest+json` and `.js` as JavaScript. Avoid long-lived HTTP caching of `index.html` and `sw.js`; use revalidation. No SPA rewrite rule is needed because navigation uses URL fragments.

`vercel.json` sets the production response headers: a strict Content-Security-Policy (same-origin scripts, styles, images and connections only, with no inline code), `Permissions-Policy` limiting the camera to this site, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and revalidation for `index.html`, `sw.js` and the manifest. Keep the app free of inline `style=` attributes, inline event handlers and `eval`, or the policy will block them. `npm run dev` and the browser tests serve `dist/` with these same headers, so a policy problem shows up locally. Do not add long-lived caching to files listed in the service worker's precache: the worker would then cache stale copies.

## Waste Guide

The Waste Guide lists the six core items plus ten more (`moreWaste` in `pwa/content.js`) with a search box and filter chips. Search matches English and Filipino words, including the keywords stored with each item, so "juice box" and "baterya" both work. Anything wet, sharp, liquid, chemical or electronic says to keep it out of the pouch and ask school staff, and an empty search result says the same, so the safe default is always visible. New items should follow that rule and must not name school-specific procedures that have not been approved.


## Streak, badges and text size

The Weekly activity card shows a streak (days in a row with at least one habit checked or the daily challenge completed), the best streak, four badges, and **Save my week as an image**. Everything is computed on the device from the activity log (`pwa/streak.js`). The image is drawn on a canvas (`pwa/summary-card.js`) in the chosen language, contains no name or personal details, and is saved or shared as a PNG. It records completed actions, not environmental impact. Confetti respects reduced-motion settings.

The **Text size** control (in **Settings**, the gear in the header) (Standard, Large, Extra large) is stored in `hipos.textsize` and sets `data-text` on the root element. All type is in `rem`, so it scales with this control and with the phone's own font setting. The browser tests check that nothing overflows horizontally at Extra large from 360 to 1920 px wide, and run basic accessibility checks (names, labels, one `h1`, unique ids) on every page.

**Compost Catch** (Games → Compost Catch, or `#compost`) is a short falling-scraps game. The buddy's basket moves with the arrow keys, the Left and Right buttons, or by dragging across the field. Only compostable scraps should be caught. Nothing is stored or sent. Its round-building rules are unit tested in `tests/compost.test.mjs`.

All games are grouped under one **Games** item in the main menu (`#games`, built in `pwa/games.js`) and in a "Need a short break?" strip on Home. The Games page links to the Sorting game, Compost Catch and the Buddy garden; each of those pages has an **All games** link back, and Games stays highlighted in the menu while any of them is open. New games belong on that page, not in the main menu. Finishing a Compost Catch or Sorting round earns a sticker (Compost helper, Compost champ for a perfect round) and one treat per game per day. The garden has nine plots that grow from care already recorded on the device (habit treats, sorting and compost rounds, challenge days), three points per plot; nothing wilts or is lost, and two garden stickers (Green thumb, Garden party) are earned along the way. The rules (`gardenState`, game treats) are unit tested in `tests/buddy-fx.test.mjs`.

The **Font style** picker (Settings → Text & readability) uses bundled game fonts as combos: the chosen font styles headings, the buddy greeting bubble, streak and badge chips and buttons, while body text keeps Nunito (falling back to Segoe UI or the system font if Nunito is not installed). Pixelify Sans is limited to small accents. "Use this font for all text" applies it everywhere. A live preview in Settings shows the combo.

## Buddy personality, sorting game and stickers

Everything here is cosmetic, optional and stays on the device. The code is in `pwa/buddy-fx.js` (reactions, moods, stickers, sounds), `pwa/sortgame.js` and `pwa/avatar.js`; progress is saved in `hipos.buddy.v1`.

- **Reactions:** the buddy speaks in a bubble when habits are checked, the challenge or quiz is answered, a Waste Guide item is chosen, or a page opens. Tapping it cycles through a giggle, a spin, a tip and a fun fact. Its mood (sleepy at night, excited on a streak, calm otherwise) changes its animation. Small helper buddies in the checklist, challenge, quiz, Waste Guide and sorting cards give a hint when tapped.
- **Buddy dock:** the buddy and its greeting stay on screen while scrolling. On phones it is a small pill above the bottom bar, on desktop a larger one in the bottom-left corner, and on wide screens (1600 px and up) a big card in the left margin. Reaction bubbles appear next to it.
- **Treats:** checking a habit gives the buddy one treat per habit per day, so ticking and unticking cannot farm them.
- **Sorting game (`#sort`):** six items per round (three for the pouch, three for staff), drawn from the Waste Guide data so the safe default always matches the guide. Drag the item onto a bin, tap a bin, or use the keyboard. Nothing is graded; only sticker progress is kept.
- **Sticker book and extras:** eleven stickers (streaks, challenges, sorting rounds, taps, treats, a seasonal theme). New buddy extras unlock from the same actions and are kept once earned.
- **Settings:** Buddy cheers (bubbles, sparkles, haptics; on by default), Sound (soft tones made with Web Audio, off by default) and Theme (Default, Christmas, Earth Day, Buwan ng Wika; accents and top bar only). Animations respect reduced motion.
- **Week image and launch:** the weekly image includes the buddy drawing; a short branded splash covers app start and never blocks the app if scripts fail.

## Tests

`npm test` runs the unit tests (including backup and restore parsing). `npm run test:browser` runs the browser suites against a local server: `tests/browser.mjs` (navigation, install, offline activity and mobile layouts) and `tests/features.browser.mjs` (production headers and CSP, dark mode, scroll motion, Filipino completeness on every page, retired reporting routes and legacy storage preservation, Waste Guide, streak and weekly image, text size, accessibility basics, and the update banner flow). Browsers use bundled Chromium; set `PW_CHANNEL=msedge` to use Edge. GitHub Actions (`.github/workflows/ci.yml`) runs all of this on every push and pull request.

Do not serve the workspace root: it contains Android source and machine-specific configuration. The local development server serves only `dist/` and binds to loopback. Phone access needs a hosted HTTPS URL; `http://<computer-LAN-IP>` does not provide the secure context needed for the full PWA.
