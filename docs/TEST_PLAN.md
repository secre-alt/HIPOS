# HIPOS first build QA checklist

## Build and runtime
- [ ] Android Studio sync resolves all Gradle dependencies and SDK packages.
- [ ] `:app:assembleStudentDebug` generates student APK.
- [ ] `:app:assembleStaffDebug` generates staff APK.
- [ ] Install each variant on a separate Android 8.0+ device.
- [ ] Verify **neither** merged Android manifest includes `android.permission.INTERNET`.
- [ ] Enable airplane mode, restart app and open every guide screen successfully.

## Student
- [ ] Welcome dashboard is readable at standard and large font sizes.
- [ ] Prevention, reuse, classification, carry-out screens have accurate approved guidance.
- [ ] Unsuitable waste is never recommended for personal dry-pouch storage.
- [ ] Student can decline pouch and still use the app.
- [ ] Save a 5–160 character fictional report; close and reopen app; report remains.
- [ ] Reject empty and oversized description.
- [ ] Delete report; it disappears from local database after relaunch.
- [ ] Show QR; label reads **QR ready**, not received.

## Staff
- [ ] First-run PIN 6–12 digits; confirm mismatch rejected.
- [ ] Correct PIN unlocks; wrong PIN fails.
- [ ] App locks when backgrounded.
- [ ] Camera permission can be denied without crashing; other screens still work.
- [ ] Scan student QR offline; check confirmation screen before import.
- [ ] Valid QR imports; duplicate UUID rejected.
- [ ] Random/oversized JSON or malformed QR is rejected without app crash.
- [ ] Report status New → Under Review → Reviewed persists across restart.
- [ ] Staff app does not upload or synchronize reports.

## Privacy and usability
- [ ] Do not put personal details in test reports.
- [ ] Staff can scan sample QR only when student presents it voluntarily.
- [ ] Confirm scanned QR text is public to anyone who scans it; do not claim encryption.
- [ ] Verify local staff data with school privacy coordinator before any real deployment.
- [ ] Test with accessibility font size 150%, 320dp-wide viewport, TalkBack labels.
- [ ] Ask 5–10 volunteers whether the prevention guide is understandable using fictional scenarios.

## Unresolved real-world decisions
- [ ] School confirms staff handling instructions for unsuitable waste.
- [ ] School confirms lawful permitted off-campus disposal arrangements.
- [ ] Canteen confirms if student-owned containers are permitted.
- [ ] Any canteen return program receives school approval before being marked available.
- [ ] Instructor approves proposal originality and academic scope.
