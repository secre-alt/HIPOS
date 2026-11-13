# HIPOS mobile UI review

## Direction

Keep the established forest-green and warm-white school-guide identity. Use readable local system fonts, quiet borders, a compact header, and familiar cards and buttons. Prevention is the primary task; classification and reporting are immediately accessible. Keep the existing bottle/lunchbox artwork on desktop and give phone space to the actions.

## Review findings and changes

- The old illustration and large header pushed key actions down the phone screen. The compact student home now puts one large **Prevent Waste** action above **Check Waste Type** and **Report a Concern**. Reuse and carry-out guides remain below.
- Horizontally scrolling navigation hid reports and staff review. A labelled **Menu** button now expands a wrapping two-column navigation list on phones. It preserves `aria-expanded` and active-page semantics.
- Install and navigation controls were below 44px high. Controls now have minimum 44px dimensions, generally 48px high. Input text stays at 16px, secondary text at 14px, and long labels wrap.
- The empty report list offered no next step. It now explains device-local storage and voluntary sharing, with an action to focus the report field.
- Camera errors previously left the user at a blank view. Permission denial now explains how to recover, offers a retry, and leads directly to manual offline transfer.
- Invalid camera QR and pasted text now state that nothing was imported and explain which code/text to request. Repeated identical invalid camera frames do not repeatedly announce the same error.
- Confirmation language reflects actual state: **Saved on this device**, **QR ready to show**, and **Report imported** after staff confirmation only. Navigation clears stale notices so a staff success message does not follow the user into the student screens.
- Canteen reuse carries **Requires school approval**. The optional dry-waste pouch stays in the carry-out guide.

The local storage key, HIPOS1 protocol, bundled QR libraries, and service-worker caching strategy are preserved. No remote icons or fonts were added.

## Verification

See [PWA test plan](PWA_TEST_PLAN.md) for automated checks, screenshot artifacts and remaining physical-device checks. Mobile browser checks cover 360px and 390px widths, offline guide reloads, saved reports and QR generation.

Design review used the unslop workflow by [Damir Sokolovsky](https://heydamir.design/unslop), licensed CC BY 4.0.
