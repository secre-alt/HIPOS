# HIPOS PWA architecture

The app has no runtime server, remote fonts, CDN scripts, analytics, or automatic report uploads. QR libraries are bundled into the app before deployment. A connection is needed for the initial page load; the service worker caches the full application shell for later use.

## Files

- `pwa/`: application HTML, CSS, guide content, validated report protocol, staff PIN logic, and browser UI.
- `scripts/build-pwa.mjs`: bundles JavaScript, generates PNG app icons, and creates a content-versioned service worker in `dist/`.
- `scripts/serve-pwa.mjs`: builds and serves `dist/` on localhost for development. Restart after editing source.
- `tests/core.test.mjs`: report validation, actual QR encode/decode, duplicate protection, PIN verifier, and HTML escaping.
- `tests/browser.mjs`: Edge flows, persistence, offline caching, and mobile viewport checks.

The service worker uses a cache name derived from all shell files. An updated worker waits to activate until the person taps **Update now** in the in-app "A new version of HIPOS is ready." banner (or closes every app window). The app checks for updates on launch, when it returns to the foreground, when the connection comes back, and every 30 minutes while open and online. The first install never shows the banner or reloads the page. Tapping **Update now** sends `SKIP_WAITING` to the waiting worker and reloads once it takes control. Activation removes only obsolete HIPOS shell caches for its own scope. Browser report storage is independent of these caches.

## Data

Student and staff records use `localStorage` under `hipos.pwa.v1`. Storage writes fail visibly rather than showing a false saved state. Student records use the Android `HIPOS1` protocol (`type`, `id`, `category`, `area`, `description`, `createdAt`), a 650-byte payload cap, and matching input limits. Unknown fields are discarded. Staff copies add their own local review status.

The old standalone browser preview's demo storage is separate and is not automatically migrated. Android SQLite storage is also separate; use HIPOS1 QR transfer for individual records. Data belongs to a browser profile and origin; changing the hosting domain does not move records. Browser storage is not a backup and may be cleared or evicted.

**Back up and restore.** My Concerns has **Download backup** and **Restore from backup**. A backup is a readable, unencrypted JSON file (`type: HIPOS-BACKUP`, `version: 1`) holding only the student's own reports; the staff PIN verifier and imported reports are never included. Restore re-validates every report with the same rules as QR import, discards unknown fields, skips reports already on the device (by `id`), and reports how many could not be read. On phones the backup uses the share sheet so it can be saved to Files or Drive. After the first saved report the app also asks the browser for persistent storage and shows whether it was granted; the request is best-effort and does not replace backups.

Staff PINs use a randomly salted PBKDF2-SHA-256 verifier with 210,000 iterations. The lock is a local UI convenience and does not authenticate school staff or encrypt records. Staff access is kept in memory and locks on reload or backgrounding. The in-memory retry delay applies after five incorrect attempts; it is not a server security boundary.

Camera frames are decoded locally using bundled jsQR, with no dependency on browser BarcodeDetector support. Camera access requires permission and a secure context; manual transfer-text import remains available if permission is denied. Both paths require an explicit import confirmation.

## Hosting

Run `npm run build` and deploy the **contents of `dist/`** to a static HTTPS host. Relative asset URLs, manifest scope, and service worker registration support deployment in a subdirectory. Serve `.webmanifest` as `application/manifest+json` and `.js` as JavaScript. Avoid long-lived HTTP caching of `index.html` and `sw.js`; use revalidation. No SPA rewrite rule is needed because navigation uses URL fragments.

`vercel.json` sets the production response headers: a strict Content-Security-Policy (same-origin scripts, styles, images and connections only, with no inline code), `Permissions-Policy` limiting the camera to this site, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and revalidation for `index.html`, `sw.js` and the manifest. Keep the app free of inline `style=` attributes, inline event handlers and `eval`, or the policy will block them. `npm run dev` and the browser tests serve `dist/` with these same headers, so a policy problem shows up locally. Do not add long-lived caching to files listed in the service worker's precache: the worker would then cache stale copies.

## Waste Guide and staff tools

The Waste Guide lists the six core items plus ten more (`moreWaste` in `pwa/content.js`) with a search box and filter chips. Search matches English and Filipino words, including the keywords stored with each item, so "juice box" and "baterya" both work. Anything wet, sharp, liquid, chemical or electronic says to keep it out of the pouch and ask school staff, and an empty search result says the same, so the safe default is always visible. New items should follow that rule and must not name school-specific procedures that have not been approved.

Staff review can filter imported reports by status, category and school area, and **Export CSV** downloads the reports currently shown (on phones, through the share sheet). The CSV starts with a UTF-8 byte-order mark so Excel reads Filipino text correctly, and any cell that begins with `=`, `+`, `-` or `@` gets a leading apostrophe so spreadsheets do not run it as a formula. The file is not encrypted.

## Streak, badges and text size

The Weekly activity card shows a streak (days in a row with at least one habit checked or the daily challenge completed), the best streak, four badges, and **Save my week as an image**. Everything is computed on the device from the activity log (`pwa/streak.js`). The image is drawn on a canvas (`pwa/summary-card.js`) in the chosen language, contains no name or personal details, and is saved or shared as a PNG. It records completed actions, not environmental impact. Confetti respects reduced-motion settings.

The **Text size** control (in **Settings**, the gear in the header) (Standard, Large, Extra large) is stored in `hipos.textsize` and sets `data-text` on the root element. All type is in `rem`, so it scales with this control and with the phone's own font setting. The browser tests check that nothing overflows horizontally at Extra large from 360 to 1920 px wide, and run basic accessibility checks (names, labels, one `h1`, unique ids) on every page.

## Tests

`npm test` runs the unit tests (including backup and restore parsing). `npm run test:browser` runs the browser suites against a local server: `tests/browser.mjs` (navigation, install, reports, staff review) and `tests/features.browser.mjs` (production headers and CSP, dark mode, scroll motion, Filipino completeness on every page, back up and restore, Waste Guide and staff tools, streak and weekly image, text size, accessibility basics, and the update banner flow). Browsers use bundled Chromium; set `PW_CHANNEL=msedge` to use Edge. GitHub Actions (`.github/workflows/ci.yml`) runs all of this on every push and pull request.

Do not serve the workspace root: it contains Android source and machine-specific configuration. The local development server serves only `dist/` and binds to loopback. Phone access needs a hosted HTTPS URL; `http://<computer-LAN-IP>` does not provide the secure context needed for the full PWA.
