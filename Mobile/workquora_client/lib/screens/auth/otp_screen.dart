import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/app_button.dart';

class OtpScreen extends StatefulWidget {
  final String title;
  final String subtitle;
  final bool isMobileOtp;

  const OtpScreen({super.key, required this.title, required this.subtitle, required this.isMobileOtp});

  @override State<OtpScreen> createState() => _OtpScreenState();
}

class _OtpScreenState extends State<OtpScreen> {
  final _pinCtrl = TextEditingController();
  final _focusNode = FocusNode();
  bool _verifying = false;
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

  Future<void> _verify(String otp) async {
    if (otp.length != 6 || _verifying) return;
    setState(() => _verifying = true);
    final auth = context.read<AuthProvider>();
    final ok = widget.isMobileOtp ? await auth.verifyMobileOtp(otp) : await auth.verifyEmailOtp(otp);
    if (!mounted) return;
    setState(() => _verifying = false);

    if (ok) {
      // Email OTP is the sole registration gate now — it issues the token
      // directly, so there's no follow-up mobile-OTP screen to push to.
      context.go('/home');
    } else {
      _pinCtrl.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Invalid OTP'), backgroundColor: AppColors.error),
      );
    }
  }

  Future<void> _resend() async {
    if (_secondsLeft > 0) return;
    final auth = context.read<AuthProvider>();
    final ok = widget.isMobileOtp ? await auth.resendMobileOtp() : await auth.resendEmailOtp();
    if (!mounted) return;
    if (ok) {
      _startCountdown();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('OTP resent'), backgroundColor: AppColors.success),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Failed to resend OTP'), backgroundColor: AppColors.error),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final defaultPinTheme = PinTheme(
      width: 48,
      height: 48,
      textStyle: TextStyle(color: AppColors.text, fontSize: 20, fontWeight: FontWeight.bold),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.border),
      ),
    );
    final focusedPinTheme = defaultPinTheme.copyWith(
      decoration: defaultPinTheme.decoration!.copyWith(border: Border.all(color: AppColors.primary, width: 2)),
    );
    final submittedPinTheme = defaultPinTheme.copyWith(
      decoration: defaultPinTheme.decoration!.copyWith(border: Border.all(color: AppColors.primary.withOpacity(0.5))),
    );

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        leading: IconButton(icon: Icon(Icons.arrow_back_ios, color: AppColors.text, size: 20), onPressed: () => context.pop()),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const SizedBox(height: 8),
            Container(
              width: 56, height: 56,
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF8B5CF6)]),
                borderRadius: BorderRadius.circular(16),
              ),
              child: ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.asset('assets/logo.png', fit: BoxFit.cover)),
            ),
            const SizedBox(height: 28),
            Text(widget.title, style: TextStyle(fontSize: 26, fontWeight: FontWeight.w900, color: AppColors.text)),
            const SizedBox(height: 6),
            Text(widget.subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
            const SizedBox(height: 36),
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
            const SizedBox(height: 32),
            AppButton(label: 'Verify', loading: _verifying, onPressed: () => _verify(_pinCtrl.text)),
            const SizedBox(height: 20),
            Center(
              child: TextButton(
                onPressed: _secondsLeft == 0 ? _resend : null,
                child: Text(
                  _secondsLeft == 0 ? 'Resend OTP' : 'Resend OTP in ${_secondsLeft}s',
                  style: TextStyle(
                    color: _secondsLeft == 0 ? AppColors.primary : AppColors.textMuted,
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                  ),
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
