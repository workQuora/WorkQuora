import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../../theme/app_theme.dart';

/// Sends a fresh OTP and pushes the shared OtpScreen in re-verification mode
/// for an already-authenticated user's own still-unverified email/mobile.
/// The single entry point for this flow — VerificationGate (Post Job) and
/// ProfileScreen's unverified badges both call these instead of each
/// building their own OTP round trip, so there is exactly one
/// re-verification flow, not parallel ones.
Future<void> startEmailReverification(BuildContext context, String email) async {
  final auth = context.read<AuthProvider>();
  final ok = await auth.resendEmailVerificationOtp(email);
  if (!context.mounted) return;
  if (!ok) {
    _showError(context, auth.error ?? 'Could not send OTP. Try again.');
    return;
  }
  context.push('/otp', extra: {
    'title': 'Verify Email',
    'subtitle': 'Enter the OTP sent to $email',
    'isMobileOtp': false,
    'reverifyEmail': email,
  });
}

Future<void> startMobileReverification(BuildContext context, String email) async {
  final auth = context.read<AuthProvider>();
  final ok = await auth.sendMobileVerificationOtp(email);
  if (!context.mounted) return;
  if (!ok) {
    _showError(context, auth.error ?? 'Could not send OTP. Try again.');
    return;
  }
  context.push('/otp', extra: {
    'title': 'Verify Mobile',
    'subtitle': 'Enter the OTP sent to your mobile number',
    'isMobileOtp': true,
    'reverifyEmail': email,
  });
}

void _showError(BuildContext context, String message) {
  final tokens = Theme.of(context).extension<AppTokens>()!;
  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: tokens.danger));
}
