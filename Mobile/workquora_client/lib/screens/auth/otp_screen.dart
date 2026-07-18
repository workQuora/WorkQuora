import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';

class OtpScreen extends StatefulWidget {
  final String title;
  final String subtitle;
  final bool isMobileOtp;

  /// When set, this screen operates in "re-verification" mode for an
  /// ALREADY-authenticated user's own still-unverified email/mobile (e.g.
  /// Post Job's verification gate) instead of the pending-registration flow.
  /// Same UI, different AuthProvider calls, and pops back to the caller on
  /// success instead of navigating to /home.
  final String? reverifyEmail;

  const OtpScreen({super.key, required this.title, required this.subtitle, required this.isMobileOtp, this.reverifyEmail});

  @override
  State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _pinCtrl = TextEditingController();
  final _focusNode = FocusNode();
  bool _verifying = false;
  bool _resending = false;
  int _secondsLeft = 60;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _startCountdown();
  }

  void _startCountdown() {
    _timer?.cancel();
    setState(() => _secondsLeft = 60);
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (_secondsLeft <= 1) {
        t.cancel();
        setState(() => _secondsLeft = 0);
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  @override
  void dispose() {
    _pinCtrl.dispose();
    _focusNode.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _showSnack(String message, {required bool isError}) {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: isError ? tokens.danger : tokens.success),
    );
  }

  Future<void> _verify(String otp) async {
    if (otp.length != 6 || _verifying) return;
    setState(() => _verifying = true);
    final auth = context.read<AuthProvider>();
    final reverify = widget.reverifyEmail;
    final ok = reverify != null
        ? (widget.isMobileOtp
            ? await auth.verifyMobileReverification(reverify, otp)
            : await auth.verifyEmailReverification(reverify, otp))
        : (widget.isMobileOtp ? await auth.verifyMobileOtp(otp) : await auth.verifyEmailOtp(otp));
    if (!mounted) return;
    setState(() => _verifying = false);

    if (ok) {
      if (reverify != null) {
        // Re-verification — pop back to whichever screen showed the gate
        // (e.g. Post Job), which re-checks user.isEmailVerified/isMobileVerified.
        context.pop();
      } else {
        // Email OTP is the sole registration gate now — it issues the token
        // directly, so there's no follow-up mobile-OTP screen to push to.
        context.go('/home');
      }
    } else {
      _pinCtrl.clear();
      _showSnack(auth.error ?? 'Invalid OTP', isError: true);
    }
  }

  Future<void> _resend() async {
    if (_secondsLeft > 0 || _resending) return;
    setState(() => _resending = true);
    final auth = context.read<AuthProvider>();
    final reverify = widget.reverifyEmail;
    final ok = reverify != null
        ? (widget.isMobileOtp
            ? await auth.sendMobileVerificationOtp(reverify)
            : await auth.resendEmailVerificationOtp(reverify))
        : (widget.isMobileOtp ? await auth.resendMobileOtp() : await auth.resendEmailOtp());
    if (!mounted) return;
    setState(() => _resending = false);
    if (ok) {
      _startCountdown();
      _showSnack('OTP resent', isError: false);
    } else {
      _showSnack(auth.error ?? 'Failed to resend OTP', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    final defaultPinTheme = PinTheme(
      width: 48,
      height: 48,
      textStyle: theme.textTheme.titleLarge,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.button),
        border: Border.all(color: tokens.border),
      ),
    );
    final focusedPinTheme = defaultPinTheme.copyWith(
      decoration: defaultPinTheme.decoration!.copyWith(border: Border.all(color: theme.colorScheme.primary, width: 2)),
    );
    final submittedPinTheme = defaultPinTheme.copyWith(
      decoration: defaultPinTheme.decoration!.copyWith(border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.5))),
    );

    return Scaffold(
      appBar: AppBar(leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20), onPressed: () => context.pop())),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(color: theme.colorScheme.primary, borderRadius: BorderRadius.circular(16)),
                child: ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.asset('assets/logo.png', fit: BoxFit.cover)),
              ),
              const SizedBox(height: AppSpace.lg),
              Text(widget.title, style: theme.textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text(widget.subtitle, style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
              const SizedBox(height: AppSpace.xl),
              Center(
                child: Pinput(
                  length: 6,
                  controller: _pinCtrl,
                  focusNode: _focusNode,
                  autofocus: true,
                  defaultPinTheme: defaultPinTheme,
                  focusedPinTheme: focusedPinTheme,
                  submittedPinTheme: submittedPinTheme,
                  keyboardType: TextInputType.number,
                  inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  onCompleted: _verify,
                ),
              ),
              const SizedBox(height: AppSpace.xl),
              PrimaryButton(label: 'Verify', loading: _verifying, onPressed: () => _verify(_pinCtrl.text)),
              const SizedBox(height: AppSpace.lg),
              Center(
                child: TextButton(
                  onPressed: _secondsLeft == 0 && !_resending ? _resend : null,
                  child: _resending
                      ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.primary))
                      : Text(
                          _secondsLeft == 0 ? 'Resend OTP' : 'Resend OTP in ${_secondsLeft}s',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: _secondsLeft == 0 ? theme.colorScheme.primary : tokens.muted,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
