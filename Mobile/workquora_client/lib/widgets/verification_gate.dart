import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/providers/auth_provider.dart';
import '../core/utils/reverify.dart';
import '../theme/app_theme.dart';
import 'primary_button.dart';

/// Blocks [child] behind the logged-in user's email + mobile verification
/// status. Renders [child] only once BOTH are verified; otherwise shows an
/// inline blocker card with real "Verify now" CTAs that send a fresh OTP and
/// push the shared OtpScreen in re-verification mode. Reactive — once the
/// OTP screen updates AuthProvider's user (on successful verify), this
/// widget rebuilds and un-blocks automatically without any manual
/// "re-check on return" step.
class VerificationGate extends StatelessWidget {
  final Widget child;
  const VerificationGate({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user ?? {};
    final emailVerified = user['isEmailVerified'] == true;
    final mobileVerified = user['isMobileVerified'] == true;
    final email = user['email']?.toString() ?? '';
    final hasMobile = (user['mobileNumber']?.toString() ?? '').isNotEmpty;

    if (emailVerified && mobileVerified) return child;

    return _BlockerCard(emailVerified: emailVerified, mobileVerified: mobileVerified, hasMobile: hasMobile, email: email);
  }
}

class _BlockerCard extends StatefulWidget {
  final bool emailVerified;
  final bool mobileVerified;
  final bool hasMobile;
  final String email;
  const _BlockerCard({required this.emailVerified, required this.mobileVerified, required this.hasMobile, required this.email});

  @override
  State<_BlockerCard> createState() => _BlockerCardState();
}

class _BlockerCardState extends State<_BlockerCard> {
  bool _sendingEmail = false;
  bool _sendingMobile = false;

  Future<void> _verifyEmail() async {
    setState(() => _sendingEmail = true);
    await startEmailReverification(context, widget.email);
    if (mounted) setState(() => _sendingEmail = false);
  }

  Future<void> _verifyMobile() async {
    setState(() => _sendingMobile = true);
    await startMobileReverification(context, widget.email);
    if (mounted) setState(() => _sendingMobile = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpace.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72, height: 72,
              decoration: BoxDecoration(color: tokens.warning.withValues(alpha: 0.15), shape: BoxShape.circle),
              child: Icon(Icons.verified_user_outlined, color: tokens.warning, size: 32),
            ),
            const SizedBox(height: AppSpace.lg),
            Text('Verification required', style: theme.textTheme.headlineMedium, textAlign: TextAlign.center),
            const SizedBox(height: AppSpace.sm),
            Text(
              'Verify your email and mobile number before posting a job — this keeps WorkQuora trustworthy for everyone.',
              style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: AppSpace.xl),
            if (!widget.emailVerified) ...[
              PrimaryButton(label: 'Verify email', icon: Icons.email_outlined, onPressed: _verifyEmail, loading: _sendingEmail),
              const SizedBox(height: AppSpace.sm),
            ],
            if (!widget.mobileVerified)
              widget.hasMobile
                  ? PrimaryButton(label: 'Verify mobile number', icon: Icons.phone_outlined, onPressed: _verifyMobile, loading: _sendingMobile, outlined: !widget.emailVerified)
                  : Padding(
                      padding: const EdgeInsets.only(top: AppSpace.xs),
                      child: Column(
                        children: [
                          Text('No mobile number on file.', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
                          TextButton(
                            onPressed: () => context.push('/settings'),
                            child: Text('Add one in Settings', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                          ),
                        ],
                      ),
                    ),
          ],
        ),
      ),
    );
  }
}
