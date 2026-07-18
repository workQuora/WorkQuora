# WorkQuora Client — Status

Handoff doc for the redesign + hardening arc (Tasks 0–13). Everything below
reflects the code as of commit `a2444df9`. Nothing in this arc has been
pushed to a remote — only committed locally on `main`.

## What's built and working

**Design system** — `lib/theme/app_theme.dart` is the single source of truth
(colors, type, spacing, radii) via `Theme.of(context)` + a
`ThemeExtension<AppTokens>`. No mutable global flag anywhere; light/dark is
correct on every rebuild. Plus Jakarta Sans is bundled locally
(`assets/fonts/`), not fetched from Google Fonts at runtime, so first launch
and offline both render correctly.

**Auth** — Login, Register (with a real username field, validated and
uniqueness-checked against the backend), OTP verify/resend, Splash. Google
and Facebook sign-in are code-complete against the existing `POST
/auth/social` endpoint — they'll work the moment the credentials in
"Blocked on my input" below are filled in. A shared re-verification flow
(`lib/core/utils/reverify.dart`) is reused by both Post Job's verification
gate and Profile's verified badges — not two parallel implementations.

**Client home & jobs** — 7-category grid → Post a Job (verification-gated,
auto-location with reverse geocoding, manual override, multi-image upload),
Job Detail (accept/reject proposals, cancel flow), My Jobs, and live map
tracking (`job_tracking_screen.dart`) over the existing
`join_job_room`/`receive_location` socket events — no new channel.

**Chat & notifications** — Chat thread and conversations list on the
existing socket transport, with date separators and shimmer loading.
Notifications use the real per-type backend model (not guessed strings) with
deep-link routing to the right screen, and subscribe to the already-emitted
`receive_notification` socket event.

**Profile, Settings, Wallet, Terms** — Profile aggregates what already
exists rather than duplicating it. Settings has real per-category
notification preferences (replacing fake local-only toggles), change
email/mobile, and a sessions list with per-device revoke. Wallet only offers
Add Money — Withdraw is freelancer-only server-side, so it isn't offered
here at all (not hidden, removed).

**Session hygiene** — Every provider resets its state and unsubscribes on
logout (traced for listener stacking and cross-account data leaks — none
found after the fix). The socket disconnects on logout, reconnects on
resume if the OS killed it while backgrounded, and re-joins whatever room a
currently-open Chat/JobTracking screen needs.

**Error handling** — Walked all 51 network call sites in the app. No screen
silently no-ops on a failed request anymore; the shared `ErrorHelper` is
used consistently (a duplicate implementation in `JobDetailProvider` was
collapsed onto it).

**Builds** — `flutter analyze`: 0 issues, clean. `flutter build apk --debug`,
`flutter build ios --debug --no-codesign`, `flutter build apk --release`
(59.5MB), and `flutter build appbundle --release` (58.5MB) all verified
passing.

## Blocked on my input

Everything below is a placeholder today — grep confirms these are the only
`REPLACE_WITH_*` strings left in the app:

| # | What | Where | Status |
|---|---|---|---|
| 1 | Facebook Client Token | `android/.../strings.xml`, `ios/Runner/Info.plist` | placeholder |
| 2 | Google OAuth client — Android | Google Cloud Console (debug **and** release SHA-1) | not created |
| 3 | Google OAuth client — iOS | `ios/Runner/Info.plist` (`GIDClientID` + URL scheme) | placeholder |
| 4 | Google OAuth client — web | `web/index.html` meta tag | placeholder |
| 5 | Google Maps API key — Android | `AndroidManifest.xml` | placeholder |
| 6 | Google Maps API key — iOS | `AppDelegate.swift` | placeholder |
| 7 | **Android release signing** | release builds currently sign with the **debug key** — this is what actually blocks a Play Store upload, not just credentials | not created (deliberately — I don't generate production signing keys) |
| 8 | Real app icon | `assets/icons/client_icon.png` still the old "WQ"-only mark; the described indigo-rounded-square + wordmark version never actually landed on disk (checked by MD5, twice) | old file unchanged |
| 9 | Category images | `assets/images/categories/` — 7 files, exact names/spec in this file's CLAUDE.md | empty, falls back to icon tiles (not broken) |

Full console-by-console steps for each are in `CLAUDE.md`'s "Native config
checklist" — this table is just the tracker.

## Hand-test checklist

No emulator/device was available while building this. Everything below
needs verification on real hardware before shipping:

1. Register → email OTP → mobile OTP, including the new username field's
   duplicate-username inline error
2. Google Sign-In / Facebook Sign-In (blocked on items 1–4 above)
3. Location permission prompt — both grant and deny paths, on Post Job and
   Home
4. Post a job with multiple images end to end
5. Live map tracking screen (blocked on items 5–6 for the key; the live
   marker itself needs the worker-app gap below closed first)
6. Chat send/receive and typing indicator in real time, across a forced
   disconnect/reconnect (e.g. airplane mode toggle) to confirm the room
   re-join actually works
7. Notifications arriving live, and tapping through to the right screen for
   each type
8. Theme toggle (Light/Dark/System) — instant repaint including OTP/Splash
9. Font renders as Plus Jakarta Sans on a fresh install with **no network
   connection**
10. Log out, log back in as a **different account** — confirm no stale data
    from the first account appears anywhere (jobs, chats, notifications,
    wallet) before its own first fetch completes
11. Background the app for an extended period (10+ minutes, or toggle
    airplane mode while backgrounded) then resume — confirm the socket
    reconnects and a currently-open chat/tracking screen keeps working
12. Wallet Add Money flow (in-app payment isn't wired yet — see known gaps)

## Known gaps carried forward

These are real, understood, and deliberately not fixed in this arc — either
out of scope, or requiring changes outside this client app:

- **Worker app doesn't emit live location.** `job_tracking_screen.dart`
  listens for `receive_location` correctly, but nothing in
  `workquora_worker` calls `send_location` yet. The live marker will stay in
  "last seen" mode (using the worker's profile location) until that app is
  updated. Same root cause affects `_fetchWorkerProfile`'s fallback below.
- **`_fetchWorkerProfile` (job_tracking_screen.dart) degrades to a generic
  "Worker" label with no explicit error banner on failure.** The map and
  location tracking stay fully functional either way — judged low-priority
  rather than fixed, but flagging rather than leaving unmentioned.
- **Messaging endpoints (`POST /messages`, `GET /messages/:jobId/:otherUserId`)
  have no job-participant authorization on the backend** — any authenticated
  user can hit them for any `jobId`/`otherUserId` pair, not just the job's
  actual client/assigned freelancer. Pre-existing, found during the Task 4
  KYC-gate investigation, not introduced or fixed in this arc. Worth a
  backend fix, but backend authorization hardening was never in this client
  app's scope.
- **In-app wallet top-up isn't wired to a real payment flow.** `Add Money`
  creates a Razorpay-style order server-side but the client just shows
  "complete this top-up from the WorkQuora web app for now" — no in-app
  payment SDK integration exists yet (`lib/screens/client/wallet_screen.dart`).
- **Google Maps on web** is not configured — this app has a `web/` build
  target and `google_maps_flutter` does support it, but it needs its own
  Maps JavaScript API key + script tag in `web/index.html`, scoped out when
  native config was done since only Android/iOS were asked for.
- **`flutter_facebook_auth`/`smart_auth`/`share_plus` apply their own Kotlin
  Gradle Plugin**, which Flutter's build output warns will become a hard
  error in a future Flutter version. Not broken today; worth watching for
  plugin updates.

## Final sweep (Task 13)

- **Routes**: every route in `app.dart` is reachable (cross-checked against
  every `context.push`/`context.go` call site, including the tab-array-driven
  ones in `ClientShell`); no dead routes or orphaned screens from Phase A.
- **Removed features**: grepped for Discover, client-KYC gating, and
  worker-only actions — none referenced in `lib/`. Found and removed 3 truly
  dead identifiers left over from the Wallet redesign
  (`WalletProvider.withdraw()`, `ApiConstants.withdraw`,
  `ApiConstants.setWithdrawalPin` — none had any caller left).
- **Analyze infos**: all 5 remaining were trivial and worth fixing rather
  than leaving — `flutter analyze` is now **0 issues**, not just "0
  errors/warnings, 5 pre-existing infos."
- **TODO/FIXME**: none in `lib/`. The only real placeholder-shaped string is
  Wallet's "in-app payment is coming soon" message (an honest, user-facing
  statement of the known gap above, not leftover dead code).
