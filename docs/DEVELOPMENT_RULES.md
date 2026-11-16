# HIPOS product rules

These are the current product conventions. A new explicit user request may
change them; update the relevant documentation when it does.

## Navigation and back to top

- Keep desktop navigation and mobile bottom navigation usable without covering
  page controls.
- Back to top floats at the lower right, aligned with the desktop content edge
  and above mobile navigation and the device safe area.
- Show it when the last visible content card enters the viewport on each page;
  keep it available through the footer. Hide it when scrolling above that card.
- Include custom card markup: Prevent uses `.prevent-tip`; Reuse ends with
  `.reuse-scheme`, after its `.reuse-item` cards.
- The Games hub and game pages mark their content cards with
  `data-back-to-top-card`. Use the last visible marked card as the trigger,
  including after a game updates its content or shows results.
- Mobile shows only the arrow icon with an accessible name and a 48px tap target.
  Desktop shows the arrow and text.
- Return keyboard focus to the page heading. Use smooth scrolling only when
  reduced motion is not requested.

## Appearance and reading

- Appearance offers System default, Light, and Dark. System default follows
  live device changes; explicit choices override them and persist locally.
- Apply the saved appearance before first paint. Keep form controls and browser
  theme colors consistent with the resolved theme.
- Light mode uses soft sage `#EDF3E8`, warm white surfaces `#FFFEFA`,
  borders `#D5E0CF`, and main text `#173D2C`.
- Preserve the display-font combinations and readable Nunito body text.
  Keep bundled fonts and their licenses available offline.
- Checked daily checklist text has a line through it; unchecking removes it.

## Buddy and sound

- Background music and sound effects have separate controls; music is off by
  default. Respect saved volume and browser requirements for a user gesture.
- Keep music styles distinct, with a translated mood description and a
  ten-second preview that does not enable the saved music preference.
- Stop temporary previews when Settings closes or the document becomes hidden.
- Cheers respect their switch, cooldown, and reduced-motion settings. Their
  sounds also respect the sound-effects switch.
- Briefly soften music during audible cheers, then restore the user's volume.
  Restoring volume must not restart stopped music.
- Daily returning greetings rotate without immediate repetition. Celebrate
  daily completion once per local calendar day, after all three habits, the
  challenge, and a quiz finished that day. Reloading must not replay it.

## Data and guidance

- Reports and activity remain on the current browser and device. Do not imply
  that a saved report has been sent to school staff.
- Keep report sharing voluntary and staff import explicitly confirmed.
- A local staff PIN is a convenience lock, not identity verification or data
  encryption. Preserve locking when the app is hidden.
- Keep school approval placeholders until verified content and all required
  metadata are supplied. Use fictional reports when testing.
