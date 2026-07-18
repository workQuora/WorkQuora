import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show PlatformException;
import 'package:flutter_facebook_auth/flutter_facebook_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../core/providers/auth_provider.dart';
import '../theme/app_theme.dart';

// The WEB OAuth client from the same Google Cloud project as
// Backend/.env's GOOGLE_CLIENT_ID (Backend verifies Google ID tokens against
// this exact audience). google_sign_in's Android implementation needs a
// *web*-type client here (never the Android client) to complete sign-in via
// Credential Manager — omitting it is what produces the raw, unreadable
// PlatformException ("ApiException: 10: ...") instead of a real sign-in.
// Not a secret — OAuth client IDs are meant to ship in client code.
const _googleServerClientId = '618185268672-b7elsrbng8vgq0ll8h43cb8moi4j0kf5.apps.googleusercontent.com';

/// "or continue with" divider + Google/Facebook buttons, shared by Login and
/// Register (both need identical behavior).
///
/// Real SDK flow, both ends: gets a native Google/Facebook ACCESS token on
/// device, POSTs it to the existing `POST /auth/social` endpoint (same one
/// the web app already uses, `tokenType: 'access_token'` — that path has no
/// audience restriction, so this works against the mobile app's own OAuth
/// client with zero backend changes). Not a stub — it will only fail if the
/// native platform config (see CLAUDE.md) isn't filled in yet, and it fails
/// with a real, visible error in that case, never a silent no-op.
class SocialLoginButtons extends StatefulWidget {
  final VoidCallback onSuccess;
  const SocialLoginButtons({super.key, required this.onSuccess});

  @override
  State<SocialLoginButtons> createState() => _SocialLoginButtonsState();
}

class _SocialLoginButtonsState extends State<SocialLoginButtons> {
  bool _googleLoading = false;
  bool _facebookLoading = false;

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Theme.of(context).extension<AppTokens>()!.danger),
    );
  }

  // PlatformException.toString() dumps the code/message/details/stacktrace
  // as one blob (e.g. "PlatformException(sign_in_failed, ApiException: 10: ,
  // null, null)") — showing that raw in a SnackBar reads like a crash, not
  // an error message. Surface just the human part, with a sane fallback for
  // the codes that don't carry a useful .message (10 = misconfigured OAuth
  // client, 12500/7 = Play Services/network issues).
  String _readableGoogleError(Object e) {
    if (e is PlatformException) {
      if (e.message != null && e.message!.trim().isNotEmpty) return 'Google sign-in failed: ${e.message}';
      switch (e.code) {
        case 'sign_in_failed':
          return 'Google sign-in isn\'t configured correctly for this app yet. Try again later.';
        case 'network_error':
          return 'No internet connection. Check your network and try again.';
        default:
          return 'Google sign-in failed (${e.code}). Try again.';
      }
    }
    return 'Google sign-in failed. Try again.';
  }

  Future<void> _continueWithGoogle() async {
    setState(() => _googleLoading = true);
    try {
      final googleSignIn = GoogleSignIn(scopes: ['email', 'profile'], serverClientId: _googleServerClientId);
      final account = await googleSignIn.signIn();
      if (account == null) return; // user cancelled — not an error
      final auth = await account.authentication;
      final accessToken = auth.accessToken;
      if (accessToken == null) {
        _showError('Google did not return an access token. Try again.');
        return;
      }
      if (!mounted) return;
      final ok = await context.read<AuthProvider>().socialLogin(provider: 'google', accessToken: accessToken);
      if (!mounted) return;
      if (ok) {
        widget.onSuccess();
      } else {
        _showError(context.read<AuthProvider>().error ?? 'Google sign-in failed');
      }
    } catch (e) {
      _showError(_readableGoogleError(e));
    } finally {
      if (mounted) setState(() => _googleLoading = false);
    }
  }

  Future<void> _continueWithFacebook() async {
    setState(() => _facebookLoading = true);
    try {
      // "enabled" (not "limited") tracking — the backend's Facebook branch
      // calls the Graph API with this token directly, which needs a classic
      // OAuth access token, not a limited-login JWT.
      final result = await FacebookAuth.instance.login(
        permissions: const ['email', 'public_profile'],
        loginTracking: LoginTracking.enabled,
      );
      if (result.status == LoginStatus.cancelled) return;
      if (result.status != LoginStatus.success || result.accessToken == null) {
        _showError(result.message ?? 'Facebook sign-in failed');
        return;
      }
      if (!mounted) return;
      final ok = await context
          .read<AuthProvider>()
          .socialLogin(provider: 'facebook', accessToken: result.accessToken!.tokenString);
      if (!mounted) return;
      if (ok) {
        widget.onSuccess();
      } else {
        _showError(context.read<AuthProvider>().error ?? 'Facebook sign-in failed');
      }
    } catch (e) {
      _showError('Facebook sign-in failed: $e');
    } finally {
      if (mounted) setState(() => _facebookLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    return Column(
      children: [
        Row(
          children: [
            Expanded(child: Divider(color: tokens.border)),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpace.md),
              child: Text('or continue with', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
            ),
            Expanded(child: Divider(color: tokens.border)),
          ],
        ),
        const SizedBox(height: AppSpace.lg),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: OutlinedButton(
            onPressed: _googleLoading ? null : _continueWithGoogle,
            style: OutlinedButton.styleFrom(
              backgroundColor: Colors.white,
              side: BorderSide(color: tokens.border),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button)),
            ),
            child: _googleLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFFDB4437)))
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('G', style: TextStyle(color: Color(0xFFDB4437), fontSize: 20, fontWeight: FontWeight.w900)),
                      const SizedBox(width: AppSpace.sm),
                      Text('Continue with Google', style: theme.textTheme.titleMedium?.copyWith(color: Colors.black87)),
                    ],
                  ),
          ),
        ),
        const SizedBox(height: AppSpace.sm),
        SizedBox(
          width: double.infinity,
          height: 52,
          child: ElevatedButton(
            onPressed: _facebookLoading ? null : _continueWithFacebook,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF1877F2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button)),
              elevation: 0,
            ),
            child: _facebookLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.facebook_rounded, color: Colors.white, size: 22),
                      const SizedBox(width: AppSpace.sm),
                      Text('Continue with Facebook', style: theme.textTheme.titleMedium?.copyWith(color: Colors.white)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}
