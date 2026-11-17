# HIPOS PWA checks

On Windows PowerShell run `npm.cmd test`, `npm.cmd run build`, then
`$env:PW_CHANNEL='msedge'; npm.cmd run test:browser` to use installed Edge.
Browser suites start their own localhost servers on ports 4174 and 4175.

## Automated checks

- Desktop and mobile navigation, keyboard focus, reduced motion, and no horizontal overflow.
- Home, Prevent, Reuse, Classify, Carry out, Games, buddy customization, and privacy information.
- Offline guide reloads, quiz progress, daily checklist, challenges, and weekly activity.
- English and Filipino, text size, themes, semantic controls, and touch targets.
- My Concerns and Staff review links, forms, and manifest shortcuts are absent.
- Old reporting URLs open Home and leave legacy browser storage unchanged.
- Waste Guide search, school approval placeholders, games, and garden progress.
- App updates, offline caching, and production security headers.

Screenshots are written under `test-results/`. Legacy report-format unit tests
remain for compatibility; the PWA has no report creation or transfer workflow.

## Physical-device checks

- Serve `dist/` over HTTPS at a stable URL. Open online and wait for **Ready offline**.
- Install from the browser menu; on iOS use Safari ? Share ? Add to Home Screen.
- Turn on airplane mode, restart the installed app, and visit every guide.
- Check saved habits, language, appearance, buddy preferences, and game controls.
- Check narrow screens, 200% zoom, keyboard navigation, and screen-reader behavior.
- Verify an update preserves saved activity. Browser storage can be cleared or evicted;
  there is no account or server copy.

Real phone installation, screen readers, and touch behavior need physical-device checks.
