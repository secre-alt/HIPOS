# HIPOS PWA checks

On Windows PowerShell run `npm.cmd install`, `npm.cmd test`, `npm.cmd run build`, then `npm.cmd run test:browser`.
The browser check uses installed Microsoft Edge, starts a localhost server on port 4174 (separate from development on 4173), and writes screenshots in `test-results/`.

## Mobile UI regression checks

The automated browser suite runs at **360 × 844** and **390 × 844**, in addition to the desktop flow. It checks:

- Navbar-specific checks also run at **1000px**, **1001px**, **1280px**, and **1920px**. At 1000px and below the header is 64px high with a 48px menu toggle; above 1000px it is 72px high with links on one row and an active-page underline. The warm-white dropdown does not shift content. Keyboard focus, icon switching, and reduced-motion behavior are checked. Navbar screenshots are saved as `navbar-<width>.png` or `navbar-<width>-open.png`.

- Home: **Prevent Waste** is the large primary action; **Check Waste Type** and **Report a Concern** open the correct screens and appear in the first viewport.
- Visible buttons, links, inputs, selects, and textareas have both dimensions at least 44px. Long navigation labels wrap without horizontal page overflow.
- The mobile dropdown uses one column, marks the active page, and separates Staff review. The hamburger becomes an × while open. Escape, taps elsewhere (including empty navbar space), selecting the current page, mouse-wheel scrolling, touch scrolling, and page scrolling close it. Escape restores focus to the toggle.
- The carry-out guide has four numbered steps, distinguishes clean dry waste from unsuitable items, keeps the pouch optional, and links to **Check Waste Type**.
- Empty reports explain local storage and voluntary sharing, and **Write your first concern** focuses the description field.
- Saving announces **Saved on this device**. QR generation completes before **QR ready to show** appears.
- A separate staff browser context reviews transfer text before import. Only successful staff confirmation announces **Report imported**.
- Camera denial provides browser-setting instructions, **Try camera again**, and a working **Paste transfer text** action.
- Malformed transfer text and an actual non-HIPOS QR image supplied through a synthetic camera stream show actionable invalid-report feedback and do not import anything.
- Canteen reuse is labelled **Requires school approval**; the carry-out guide still says a pouch is optional.
- After an initial successful load and service-worker activation, switch offline and reload each guide and saved reports. Saved reports and QR generation remain available.
- PIN access, duplicate rejection, status persistence and deletion continue to pass.

Screenshot artifacts: `home-360.png`, `home-390.png`, `qr-360.png`, `qr-390.png`, `camera-denied-360.png`, `camera-denied-390.png`, `invalid-qr-360.png`, and `invalid-qr-390.png` in `test-results/`.

If an already-open development tab still shows the previous UI, close all HIPOS tabs/app windows and reopen. Updated service workers wait for old windows to close; records remain in browser storage.

## Before use on phones

- Serve `dist/` over HTTPS at a stable URL. Open once online and wait for **Ready offline**.
- Install from Chrome/Edge's menu; on iOS use Safari → Share → Add to Home Screen.
- Turn on airplane mode, close and reopen the installed PWA, and visit every guide.
- Save a fictional report, restart, and check that it remains. Show its QR while offline.
- On a second device, set the staff PIN, scan the QR, review, and confirm import.
- Check camera permission denial and the paste-text fallback. Verify the camera stops when the dialog closes or the app is hidden.
- Import an Android HIPOS1 QR and scan a PWA HIPOS1 QR using the Android staff app.
- Reject malformed, oversized and duplicate reports. Imported reports start New; Under Review and Reviewed persist.
- Background the app and confirm staff mode locks. Check incorrect PINs and the wait after five failures.
- Check at 320px width, 200% zoom, keyboard only, and with a screen reader.
- Clear browser storage and confirm app behavior is clear: local records and PIN will be lost. No account or server copy exists.
- Publish changed app files and verify that after closing all old app windows and reopening, the updated service worker becomes active without deleting reports.

Real camera focus, lighting, permission-setting recovery, Android/iOS installation, screen-reader behavior, and mobile background locking require physical-device checks. Automated QR tests encode and decode actual images; browser checks cover permission denial and a synthetic camera stream, which cannot verify a phone's physical camera.
