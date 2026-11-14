# HIPOS — Offline-first PWA

**Hygienic and Intelligent Personal Organization System**  
Prevent · Reuse · Safely Carry Out

HIPOS now runs as an installable web app for students and staff. It includes offline guides, local concern reports, generated QR codes, camera scanning, explicit import confirmation, a local staff PIN, and persistent review status.

## Run on your computer

Install Node.js 22 or later, then run in this project folder:

```powershell
npm.cmd install
npm.cmd run dev
```

Open **http://localhost:4173**. Wait for **Ready offline** before disconnecting. The development server builds on startup; restart it after source changes.

Use the browser's install menu or the **Install app** button. On iPhone or iPad, use Safari → Share → Add to Home Screen.

## Build for phones and hosting

```powershell
npm.cmd run build
```

Deploy the contents of `dist/` to an HTTPS static host. Open that URL on each phone once online, then install. HTTPS is required for production camera access and offline support. Opening the HTML file directly or using a computer's plain HTTP LAN address does not provide the full PWA experience.

This change is implemented locally; no hosted site has been published.

## Student and staff workflows

- The home waste checker shows illustrated choices and item-specific handling guidance.
- A three-question sorting quiz draws from nine school scenarios, gives immediate explanations and a related guide, and saves progress across reloads. Retrying chooses three questions outside the previous set. It works offline.
- An optional daily checklist saves bottle, lunchbox, and utensil reminders on this device. It resets by the device's local calendar day and makes no environmental impact estimates.
- A rotating daily challenge can be completed, skipped, or undone. A private seven-day view records checklist and challenge activity; missing days have no penalty. Recent guides can be reopened from Home. Activity history is trimmed to about 35 days when new activity is saved on the device.
- Choose English or Filipino in the header. The choice is saved locally and works offline; report descriptions and transfer data retain their original contents.
- School information has an explicit awaiting-approval state until verified content is supplied. See [school information setup](docs/SCHOOL_INFORMATION.md) for the approval fields required before publishing procedures or contacts.
- Mobile quick navigation keeps Home, Waste Guide, and My Concerns within reach. Installation appears in the page flow without covering guides.
- Students browse prevention, reuse, classification, and carry-out guides, then optionally save a nonidentifying concern and show its QR.
- Staff open **Staff review**, create a local PIN, scan a student's QR or paste its transfer text, review the contents, and confirm import.
- Imported concerns start **New** and can move to **Under Review** or **Reviewed**. Duplicate report IDs are rejected.
- Staff access locks when the app is hidden or reloaded. PINs are hashed; the local PIN does not prove employment or encrypt browser data.
- Reports stay on the current browser and device. There is no automatic submission, account, server database, or synchronization. QR contents are readable by anyone who scans them.

Use fictional reports for this school prototype. School handling procedures, disposal arrangements, and any canteen return program still need approval. Browser storage may be cleared or evicted; it is not a backup.

## Validate

```powershell
npm.cmd test
npm.cmd run test:browser
```

The browser test uses installed Microsoft Edge and checks storage, PIN access, import confirmation, duplicate detection, status persistence, camera denial, offline reload/QR, deletion, and mobile layout. Screenshots go to `test-results/`. Real phone installation and live camera scanning still require device testing.

See [PWA test plan](docs/PWA_TEST_PLAN.md) and [PWA architecture and hosting](docs/PWA.md).

## Existing Android source

The Android source remains in `app/` as a reference. You do not need Gradle, Android Studio, an SDK, or APK installation to build or run the PWA. Android HIPOS1 QR reports use the same protocol; existing native SQLite records are not migrated automatically. See [Android reference documentation](docs/ANDROID.md).

`HIPOS_Offline_Browser_Preview.html` is the original standalone mockup. Use the new PWA for offline installation and QR features.
