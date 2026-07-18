## Context
- Repo: `workquora_client` (Flutter). India local-services + freelance marketplace, KYC-verified.
- Backend already exists (Node/Express + MongoDB, Socket.io, 2dsphere geo, 25km-radius discovery, INR, 12% commission). Do NOT rebuild it. Explore repo first; reuse existing providers/services/endpoints; match existing patterns and folder layout.
- Phase A done: client KYC deprecated (client posts jobs without KYC); worker KYC mandatory. Flow: client posts job → workers propose/accept.
- Scope: **client app only.** Ignore worker app, web, admin.
- Goal: redesign UI to the new design system + add the features below.

## Standing rules (apply to every screen — never violate)
1. Single source of truth = `lib/theme/app_theme.dart`. **Never hardcode** colors, font sizes, radii, or spacing. Always `Theme.of(context)` + `AppColors` / `AppType` / `AppSpace` / `AppRadius`.
2. Every screen must render correctly in **light AND dark**. Verify both.
3. Currency **₹ (INR)**; commission **12%**. Never `$` or `5%`.
4. Extract shared UI into `lib/widgets/` (e.g. `PrimaryButton`, `AppCard`, `StatusChip`, `SectionHeader`, `CategoryTile`, `AppBarBrand`, `BottomNav`). No duplicated widget code.
5. `flutter analyze` clean — zero new warnings — after each screen.
6. Reuse existing auth/user/job/chat providers + API calls; add new only when missing.
7. Bottom nav is fixed across screens: `Home · Messages · Post (center, raised) · History · Profile`.
8. Search is a **client-only** feature. Do not port it elsewhere.

## Design system (quick ref — full values live in app_theme.dart)
- Brand blue `#2B5CE6` light / `#6E93F5` dark. Off-white surfaces. Dark mode built-in.
- Font **Plus Jakarta Sans**, bundled locally as `assets/fonts/PlusJakartaSans-Variable.ttf`
  (+ `-Italic-Variable.ttf`) — not fetched from Google Fonts at runtime, so first
  launch and offline both render correctly with no system-font fallback flash.
  `AppType.fontFamily` = `'PlusJakartaSans'`. Sizes only from `AppType`
  (display/h1/h2/title/body/label/caption).
- Radii: card 16, button 14, chip 20. Full-width bottom CTA. Soft 0.5px borders, no heavy shadows.
- Category tiles are **image-forward**: photo on top, label below. See "Category images" below.
- Status = pill chips using `chipBg`/`chipText`. App bar: menu · "WorkQuora" wordmark · bell w/ unread dot.

## Category images

`CategoryTile` (`lib/widgets/category_tile.dart`) already degrades gracefully —
`Image.asset(...).errorBuilder` falls back to an icon-on-tint tile when the
file doesn't exist, so the app never ships a broken image. `assets/images/categories/`
is currently **empty**; drop in these exact 7 filenames (referenced by
`lib/screens/client/home_screen.dart`'s `_kCategories`) to have real photos
take over automatically, no code change needed:

| Category | Filename |
|---|---|
| Electrician | `electrician.jpg` |
| Plumber | `plumber.jpg` |
| AC Repair | `ac_repair.jpg` |
| Painter | `painter.jpg` |
| Maid | `maid.jpg` |
| Cook | `cook.jpg` |
| Mechanic | `mechanic.jpg` |

Spec: **1.4:1 aspect ratio** (matches `CategoryTile`'s `AspectRatio(aspectRatio: 1.4)`),
at least **1000×714px** so they stay sharp on high-density phones, JPEG, ideally
under ~200KB each (these load in a scrolling grid — don't ship unoptimized photos).

## Native config checklist — every placeholder still needing a real value

One list. Each row: what it's for, where the placeholder lives, exact console steps.

| # | What | Placeholder location | How to get the real value |
|---|---|---|---|
| 1 | **Facebook Client Token** | `android/app/src/main/res/values/strings.xml` → `facebook_client_token`; `ios/Runner/Info.plist` → `FacebookClientToken` | developers.facebook.com → your app → Settings → Advanced → Client Token. App ID is already real (`1968251410635776`, same as `Frontend/.env`'s `VITE_FACEBOOK_APP_ID`) — only the token is a placeholder. |
| 2 | **Facebook Android Key Hash** | Not a file placeholder — registered in the Facebook Developer Console itself, under Settings → Basic → Android → Key Hashes | Extract: `keytool -exportcert -alias androiddebugkey -keystore ~/.android/debug.keystore -storepass android \| openssl sha1 -binary \| openssl base64`. **Current debug key hash: `U+M53JNx9v9mSS1/6rKyCjIKj0U=`** (extracted 2026-07 — regenerate if the debug keystore is ever recreated, e.g. a fresh machine/CI). Paste into developers.facebook.com → your app → Settings → Basic → scroll to Android → Key Hashes. Without this, Facebook Login fails on-device (works in web testing tools, not on a real APK). Needs the **release** keystore's key hash too, once #8 below is done — same command with `-keystore <path-to-upload-keystore.jks>`. |
| 3 | **Google OAuth client — Android** | No manifest entry needed; discovered automatically via package name + SHA-1 | console.cloud.google.com → APIs & Services → Credentials → Create Credentials → OAuth client ID → Android. Package name `com.workquora.workquora_client`. Needs the **debug** SHA-1: `keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android` (look for the `SHA1:` line). **Current debug SHA-1: `53:E3:39:DC:93:71:F6:FF:66:49:2D:7F:EA:B2:B2:0A:32:0A:8F:45`** (extracted 2026-07 — regenerate if the debug keystore is ever recreated). **And** the **release** keystore's SHA-1 once #8 below is done — add both as separate OAuth clients (or both fingerprints on one, Google Cloud allows either). Same Google Cloud project as `Backend/.env`'s `GOOGLE_CLIENT_ID`. If this step is skipped, Google Sign-In fails on-device with `PlatformException(sign_in_failed, ApiException: 10: ...)` — **error code 10 is `DEVELOPER_ERROR`, meaning specifically this: the SHA-1 + package name pair isn't registered for any OAuth client in this Google Cloud project.** Not a code bug — see `social_login_buttons.dart`'s own `_readableGoogleError` mapping, which already surfaces this as a readable message rather than the raw exception. |
| 4 | **Google OAuth client — iOS** | `ios/Runner/Info.plist` → `GIDClientID`, and the reversed client ID in the `CFBundleURLSchemes` entry marked for Google | Same Credentials page → Create Credentials → OAuth client ID → iOS. Bundle ID `com.workquora.workquoraClient`. Paste the client ID into `GIDClientID`; paste its reversed form (`com.googleusercontent.apps.XXXXXXXX`) into the URL scheme. |
| 5 | **Google Maps API key — Android** | `android/app/src/main/AndroidManifest.xml` → `com.google.android.geo.API_KEY` meta-data (currently `REPLACE_WITH_ANDROID_MAPS_API_KEY`) | Same Google Cloud project → APIs & Services → Library → enable "Maps SDK for Android" → Credentials → Create Credentials → API Key. Restrict to Android + this package name. |
| 6 | **Google Maps API key — iOS** | `ios/Runner/AppDelegate.swift` → `GMSServices.provideAPIKey(...)` (currently `REPLACE_WITH_IOS_MAPS_API_KEY`) | Same project → enable "Maps SDK for iOS" → new API key restricted to iOS + this bundle ID. |
| 7 | **Google Maps — web** | Not wired at all | `google_maps_flutter` auto-includes `google_maps_flutter_web`, but it additionally needs a Maps JavaScript API key + `<script>` tag in `web/index.html` (this app does have a `web/` build target). Out of scope until requested — the map will fail to render on a web build until this is added. |
| 8 | **Android release signing** | `android/app/build.gradle.kts` → `buildTypes { release { signingConfig = signingConfigs.getByName("debug") } }` — **release builds are currently signed with the debug key**, which Play Store will reject | Generate a real upload keystore yourself (I won't generate a production signing secret): `keytool -genkey -v -keystore ~/upload-keystore.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload`. Create `android/key.properties` (gitignored) with `storePassword`, `keyPassword`, `keyAlias`, `storeFile`, then add a `signingConfigs { create("release") { ... } }` block in `build.gradle.kts` reading from it, and point `buildTypes.release.signingConfig` at it instead of `"debug"`. Standard Flutter deploy-Android docs cover the exact Gradle snippet. **Do this before item #3's and #2's release fingerprint steps** — you'll need this keystore's SHA-1/key hash. |
| 9 | **Category images** | `assets/images/categories/` (empty) | See "Category images" above — 7 files, exact names/spec given. |
| 10 | **iOS code signing / provisioning** | Not configured (only verified with `--no-codesign`) | Needs your Apple Developer Team ID selected in Xcode (Signing & Capabilities tab) and a provisioning profile before `flutter build ios` (without `--no-codesign`) or a TestFlight/App Store upload will work. |

**Note on running `keytool` locally**: the plain shell's `java`/`keytool` may not be on `PATH` even if Flutter itself works — Flutter's own JDK config (`flutter config --jdk-dir`) is tool-specific, not a shell `PATH` change. If `keytool` fails with "Unable to locate a Java Runtime", find a JDK (e.g. `find /opt/homebrew/opt -maxdepth 1 -iname "openjdk*"` on a Homebrew Mac) and invoke it directly: `JAVA_HOME=/opt/homebrew/opt/openjdk /opt/homebrew/opt/openjdk/bin/keytool ...`.

Live location tracking itself needs **no new backend or socket work** — the
client only listens; `Backend/src/Sockets/socketHandler.js` already implements
`join_job_room` (authorization-checked) and broadcasts `receive_location`
whenever a freelancer emits `send_location`. Today, **nothing in
`workquora_worker` emits `send_location`**, so until that app is updated to
stream its position while a job is in-progress, the client's live marker will
stay in "last seen" mode (using the worker's profile `location`, the same
field their nearby-jobs radius search already keeps up to date) rather than
animating — this is the intended fallback, not a bug.
