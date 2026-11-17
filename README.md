# HIPOS — Offline-first PWA

**Hygienic and Intelligent Personal Organization System**  
Prevent · Reuse · Safely Carry Out

HIPOS runs as an installable web app with offline waste guides, daily habits, quizzes, games, and a customizable buddy.

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

Deploy the contents of `dist/` to an HTTPS static host. Open that URL on each phone once online, then install. HTTPS is required for production installation and offline support. Opening the HTML file directly or using a computer's plain HTTP LAN address does not provide the full PWA experience.

This change is implemented locally; no hosted site has been published.

## Everyday use

- The home waste checker shows illustrated choices and item-specific handling guidance.
- A three-question sorting quiz draws from nine school scenarios, gives immediate explanations and a related guide, and saves progress across reloads. Retrying chooses three questions outside the previous set. It works offline.
- An optional daily checklist saves bottle, lunchbox, and utensil reminders on this device. It resets by the device's local calendar day and makes no environmental impact estimates.
- A rotating daily challenge can be completed, skipped, or undone. A private seven-day view records checklist and challenge activity; missing days have no penalty. Recent guides can be reopened from Home. Activity history is trimmed to about 35 days when new activity is saved on the device.
- Choose English or Filipino, and the text size, in Settings (the gear in the header). The choice is saved locally and works offline.
- School information has an explicit awaiting-approval state until verified content is supplied. See [school information setup](docs/SCHOOL_INFORMATION.md) for the approval fields required before publishing procedures or contacts.
- Mobile quick navigation keeps Home and Waste Guide within reach. Installation appears in the page flow without covering guides.
- Browse prevention, reuse, classification, and carry-out guides.

School handling procedures, disposal arrangements, and any canteen return program still need approval. Browser storage may be cleared or evicted; it is not a backup.

My Concerns and Staff review are retired. Existing browser report storage is left untouched; old reporting links open Home.

## Validate

```powershell
npm.cmd test
npm.cmd run test:browser
```

The browser suites check desktop/mobile layouts, offline guides, activity persistence, translations, accessibility basics, and app updates. Set `PW_CHANNEL=msedge` to use installed Edge. Screenshots go to `test-results/`. Physical phone installation still requires device testing.

See [PWA test plan](docs/PWA_TEST_PLAN.md) and [PWA architecture and hosting](docs/PWA.md).

## Existing Android source

The Android source remains in `app/` as a reference. You do not need Gradle, Android Studio, an SDK, or APK installation to build or run the PWA. Reporting is retired in the PWA; Android reference features remain unchanged. See [Android reference documentation](docs/ANDROID.md).

`HIPOS_Offline_Browser_Preview.html` is the original standalone mockup. Use the PWA for the current app and offline installation.
