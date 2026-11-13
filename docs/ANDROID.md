# HIPOS — Offline Android Application (prototype source)

**Hygienic and Intelligent Personal Organization System**  
**Prevent • Reuse • Safely Carry Out**

This is the **first code implementation** of the originally proposed HIPOS app, not a product already deployed at a school. It is intended for a performance-task prototype. It does **not** contain a campus trash-can feature.

## What is included

The project has **two installable Android variants** in one Android Studio project:

1. `studentDebug` → **HIPOS Student** (`ph.edu.hipos.student`): welcome dashboard; offline prevention advice; reusable alternatives; waste classification; safe carry-out guide; create/view/delete local concerns; voluntarily show report QR code; privacy and policy screens.
2. `staffDebug` → **HIPOS Staff** (`ph.edu.hipos.staff`): setup and unlock with a local PIN; bundled-model on-device QR scanning; explicit import confirmation; duplicate ID prevention; offline report list, status tracking, and counts.

**Never grant internet permission** to either APK. The Android dependencies must be downloaded during the **development/build process**, but normal app use requires no Wi-Fi or mobile data. Guidance content is bundled with the app and reporting uses local SQLite. QR exchange requires the two devices to be near each other; it is not network synchronization.

## Build on Windows with Android Studio

Prerequisites: Android Studio, Android SDK Platform 36, Android SDK Build Tools, **JDK 17** (Android Studio's embedded JDK is suitable), an internet connection during the initial Gradle dependency download, and a test Android device running Android 8.0+ (API 26).

**Note:** This archive does not contain the Gradle wrapper JAR, because the build environment used to produce it had no Gradle installation and could not download binaries. Use the official setup script in `scripts/setup-gradle-wrapper.ps1` on Windows to fetch the wrapper JAR from Gradle's official distribution server and verify its SHA-256 checksum, or run `gradle wrapper --gradle-version 8.13` with an installed Gradle distribution.

1. Extract this ZIP and open the **`HIPOS_AndroidStudio`** folder in Android Studio.
2. On Windows PowerShell, in the project folder:
   ```powershell
   powershell -ExecutionPolicy Bypass -File .\scripts\setup-gradle-wrapper.ps1
   .\gradlew.bat :app:assembleStudentDebug :app:assembleStaffDebug
   ```
3. Wait for Gradle dependencies and Android SDK components to install on your **own development computer**. This step needs internet once, unlike app runtime.
4. Install the generated build variants to Android devices or emulators:
   - `app/build/outputs/apk/student/debug/app-student-debug.apk`
   - `app/build/outputs/apk/staff/debug/app-staff-debug.apk`
5. Run student and staff APKs on **different devices** for the QR camera-transfer demonstration, or one device and an emulator using a camera feed.

The project uses **Kotlin 2.2.21, Android Gradle Plugin 8.13.2, Gradle 8.13, and Compose BOM 2025.11.01**. If you use a newer Android Studio, let the IDE guide any compatible updates rather than blindly changing unrelated dependencies.

### How to demonstrate

1. On student phone, open the Prevention Guide in airplane mode.
2. Choose a waste category, read the handling advice, and explain that an optional pouch is for suitable dry waste only.
3. Go to Reports → Create; enter a **fictional** short concern, Save on this phone.
4. In My Reports, tap Show QR. Do **not** describe this as submitted to staff.
5. On the separate staff device, set the local PIN, tap Scan, scan the student's QR, review the preview, and Confirm import.
6. Mark the report Under Review or Reviewed. Scan the same code again and demonstrate duplicate detection.
7. Turn airplane mode on both devices, restart the apps, and confirm local persistence.

### Explicit limitations

- The first version uses platform `SQLiteOpenHelper`, not Room. It **does use local SQLite**, the proposed data-storage technology; Room could be added later.
- The staff PIN is **not proof of employment**. The school must control who receives/installs the staff APK. Staff storage is **not encrypted** in this prototype; deploy only with fictional data until stronger device security and a privacy review are completed.
- The QR is **not encrypted**. Anyone with a QR scanner could read the report text. Students must not include identifying information, and in-person QR showing is not guaranteed anonymous.
- The student app says QR *Ready*, never *Received*. There is no automatic acknowledgement/synchronization.
- Canteen reusable-container returns, permitted disposal options, and staff handling rules must be **approved by the school** before HIPOS makes specific claims about them.
- No automatic AI, internet features, facial recognition, GPS, or individual behavior scoring are included.
- This code was created without a runnable Android SDK/Gradle toolchain and **has not been compiled or installed** in the current environment. Build and device testing are required before calling it a working APK.

## Source tree

- `app/src/main/java/ph/edu/hipos/Content.kt` — bundled waste-prevention rules.
- `app/src/main/java/ph/edu/hipos/HiposDatabase.kt` — local SQLite reports.
- `app/src/main/java/ph/edu/hipos/QrProtocol.kt` — offline short QR payload and bitmap rendering.
- `app/src/student/java/ph/edu/hipos/StudentApp.kt` — student screens.
- `app/src/staff/java/ph/edu/hipos/StaffApp.kt` — staff screens and review statuses.
- `app/src/staff/java/ph/edu/hipos/OfflineScanner.kt` — CameraX and fully bundled ML Kit scanner.
- `app/src/staff/java/ph/edu/hipos/StaffSecurity.kt` — local PBKDF2 PIN verifier.
- `docs/TEST_PLAN.md` — acceptance and security checks.

## Submission scope

Your instructor only requires a nonfunctional miniature, sketch/screens, and paperwork. A complete functioning APK is an **optional extension**. Do not represent this source code as tested or deployed until it builds successfully on your Android Studio device.

## Bonus interactive preview

Open `HIPOS_Offline_Browser_Preview.html` (included at the root of the ZIP) in your browser for a **separate, standalone browser demo** of the main screens. It works without server access and saves demo reports to that browser’s local storage. **It does not implement native Android SQLite, camera QR scanning, or staff authentication**, which are in the Android source.
