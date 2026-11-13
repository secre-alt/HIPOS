# HIPOS PWA architecture

The app has no runtime server, remote fonts, CDN scripts, analytics, or automatic report uploads. QR libraries are bundled into the app before deployment. A connection is needed for the initial page load; the service worker caches the full application shell for later use.

## Files

- `pwa/`: application HTML, CSS, guide content, validated report protocol, staff PIN logic, and browser UI.
- `scripts/build-pwa.mjs`: bundles JavaScript, generates PNG app icons, and creates a content-versioned service worker in `dist/`.
- `scripts/serve-pwa.mjs`: builds and serves `dist/` on localhost for development. Restart after editing source.
- `tests/core.test.mjs`: report validation, actual QR encode/decode, duplicate protection, PIN verifier, and HTML escaping.
- `tests/browser.mjs`: Edge flows, persistence, offline caching, and mobile viewport checks.

The service worker uses a cache name derived from all shell files. An updated worker waits for existing app windows to close before activating. Activation removes only obsolete HIPOS shell caches for its own scope. Browser report storage is independent of these caches.

## Data

Student and staff records use `localStorage` under `hipos.pwa.v1`. Storage writes fail visibly rather than showing a false saved state. Student records use the Android `HIPOS1` protocol (`type`, `id`, `category`, `area`, `description`, `createdAt`), a 650-byte payload cap, and matching input limits. Unknown fields are discarded. Staff copies add their own local review status.

The old standalone browser preview's demo storage is separate and is not automatically migrated. Android SQLite storage is also separate; use HIPOS1 QR transfer for individual records. Data belongs to a browser profile and origin; changing the hosting domain does not move records. Browser storage is not a backup and may be cleared or evicted.

Staff PINs use a randomly salted PBKDF2-SHA-256 verifier with 210,000 iterations. The lock is a local UI convenience and does not authenticate school staff or encrypt records. Staff access is kept in memory and locks on reload or backgrounding. The in-memory retry delay applies after five incorrect attempts; it is not a server security boundary.

Camera frames are decoded locally using bundled jsQR, with no dependency on browser BarcodeDetector support. Camera access requires permission and a secure context; manual transfer-text import remains available if permission is denied. Both paths require an explicit import confirmation.

## Hosting

Run `npm run build` and deploy the **contents of `dist/`** to a static HTTPS host. Relative asset URLs, manifest scope, and service worker registration support deployment in a subdirectory. Serve `.webmanifest` as `application/manifest+json` and `.js` as JavaScript. Avoid long-lived HTTP caching of `index.html` and `sw.js`; use revalidation. No SPA rewrite rule is needed because navigation uses URL fragments.

Do not serve the workspace root: it contains Android source and machine-specific configuration. The local development server serves only `dist/` and binds to loopback. Phone access needs a hosted HTTPS URL; `http://<computer-LAN-IP>` does not provide the secure context needed for the full PWA.
