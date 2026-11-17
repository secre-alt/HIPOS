# HIPOS product rules

These are the current product conventions. A new explicit user request may
change them; update the relevant documentation when it does.

## Navigation and back to top

- Mobile bottom navigation has Home, Prevent, raised Classify, Reuse, and More.
  More opens Carry out and Games; it closes on outside click, Escape, or navigation.
  Game routes highlight More. The header menu remains available above phone widths.

- Keep desktop navigation and mobile bottom navigation usable without covering
  page controls.
- Back to top floats at the lower right, aligned with the desktop content edge
  and above mobile navigation and the device safe area.
- Show it when the last visible content card enters the viewport on non-game pages;
  keep it available through the footer. Hide it when scrolling above that card.
- Include custom card markup: Prevent uses `.prevent-tip`; Reuse ends with
  `.reuse-scheme`, after its `.reuse-item` cards.
- Hide Back to top on the Games hub, Sorting game, Compost Catch, and Buddy
  garden, including their result screens. Use the shared `gamePages` route list.
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

- Local feedback uses queued, dismissible toasts. Routine messages expire after
  five seconds and show remaining time as a shrinking border (seconds when
  reduced motion is enabled); errors stay until dismissed
  without a countdown. Pause the countdown and expiration during hover,
  keyboard focus, or a hidden document. Place toasts at the upper right below
  the header, respecting safe areas, and keep them usable inside open dialogs. Use translated plain text,
  polite screen-reader announcements, and reduced-motion support.

- Buddy voice is independently optional and off by default. Use only installed local
  voices matching the UI language; fall back to synthesized chirps. Alternate speech
  and chirps with a seven-second cooldown, no queued chatter, and a user gesture.
  Stop speech on hiding, voice/cheers disabling, language changes, or Settings closing.
  The default Voice pack is a cute synthesized babble (Bubbly, Squeaky, Chipmunk or Sleepy, generated
  in `audio.js`, so it works offline on every device in English and Filipino). "Device voice"
  keeps the installed-voice behavior, choosing the friendliest local voice and shaping pitch
  and pace to the sentence. Babble uses a short cooldown and never overlaps itself.

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

## Games and garden

- Sorting keeps answered items readable and labels the chosen and correct
  destinations. Show a short explanation with expandable original safety guidance.
  Keep Next item visible after answering, including on small and landscape screens.
  Keep the item above the two destinations on regular screens, using shared buddy
  faces for items, the pouch, and the school helper. Keep the destination artwork
  visible in the answered state.

- Compost Catch supports held movement buttons, arrow keys, and captured pointer
  dragging. Clear held input on release, cancellation, pause, window blur, and exit.
  Pause preserves the visible field. Pace is selected between rounds; practice
  slows falling items and spawning while preserving the same care reward rules.
  Show resolved-item progress and plastic kept out separately from food catches.
  Space pauses the focused field; Escape toggles pause within the game. Keep
  button keyboard activation working and use the shared buddy face artwork.
- Buddy keeps its shared floating position on game routes.
  Individual games share a centered 880px content column.
  Keep the object and destinations, or the compost field and movement controls,
  visible between navigation bars during play, including short landscape screens.
- The garden grows from existing care points: treats, completed sorting and
  compost rounds, and challenge days. Each of nine plots needs three points.
  Game results show the actual stage changes after rewards are recorded; replaying
  still earns a round point, with only one treat per game per local day.
  Nothing wilts, and a completed garden must not claim further plant growth.

## Data and guidance

- HIPOS focuses on waste guidance, habits, games, and buddy progress. My Concerns
  and Staff review are retired; do not reintroduce reporting navigation or workflows.
- Leave legacy report storage (`hipos.pwa.v1`) untouched. Existing records are not
  migrated, deleted, or loaded by the current UI.
- Activity stays in the current browser and device; there is no synchronization.
- Keep school approval placeholders until verified content and all required
  metadata are supplied.
