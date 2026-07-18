import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/social_login_buttons.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

// Backend/src/controllers/authController.js's checkUsername/registerUser
// both validate against this exact pattern — kept in sync deliberately.
final _usernamePattern = RegExp(r'^[a-zA-Z0-9_]{3,}$');

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl = TextEditingController();
  final _usernameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;
  bool _acceptedTerms = false;
  String? _usernameError;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _usernameCtrl.dispose();
    _emailCtrl.dispose();
    _phoneCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    setState(() => _usernameError = null);

    if (!_usernamePattern.hasMatch(_usernameCtrl.text.trim())) {
      setState(() => _usernameError = 'At least 3 characters — letters, numbers, underscore only');
      return;
    }
    if (!_acceptedTerms) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: const Text('Please accept the Terms & Privacy Policy to continue'), backgroundColor: tokens.danger),
      );
      return;
    }
    final auth = context.read<AuthProvider>();
    final ok = await auth.register({
      'name': _nameCtrl.text.trim(),
      'username': _usernameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'mobileNumber': _phoneCtrl.text.trim(),
      'password': _passCtrl.text,
      'role': 'CLIENT',
    });
    if (!mounted) return;
    if (ok) {
      context.push('/otp', extra: {
        'title': 'Verify Email',
        'subtitle': 'Enter the OTP sent to your email',
        'isMobileOtp': false,
      });
    } else if (auth.error == 'Username is already taken') {
      // Surfaced inline on the field itself rather than a generic snackbar —
      // this is the one registration failure the user can fix without
      // re-reading the whole form.
      setState(() => _usernameError = auth.error);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(auth.error ?? 'Registration failed'), backgroundColor: tokens.danger),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20), onPressed: () => context.go('/login')),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 8),
              Center(child: SvgPicture.asset('assets/logos/logo_wordmark.svg', width: 160)),
              const SizedBox(height: AppSpace.xl),
              Text('Create account', style: theme.textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text('Post jobs & hire nearby workers', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
              const SizedBox(height: AppSpace.xl),
              TextField(controller: _nameCtrl, decoration: const InputDecoration(hintText: 'Full name', prefixIcon: Icon(Icons.person_outline_rounded))),
              const SizedBox(height: AppSpace.md),
              TextField(
                controller: _usernameCtrl,
                autocorrect: false,
                onChanged: (_) {
                  if (_usernameError != null) setState(() => _usernameError = null);
                },
                decoration: InputDecoration(
                  hintText: 'Username',
                  prefixIcon: const Icon(Icons.alternate_email_rounded),
                  errorText: _usernameError,
                ),
              ),
              const SizedBox(height: AppSpace.md),
              TextField(
                controller: _emailCtrl,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(hintText: 'Email address', prefixIcon: Icon(Icons.email_outlined)),
              ),
              const SizedBox(height: AppSpace.md),
              TextField(
                controller: _phoneCtrl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(hintText: 'Mobile number', prefixIcon: Icon(Icons.phone_outlined)),
              ),
              const SizedBox(height: AppSpace.md),
              TextField(
                controller: _passCtrl,
                obscureText: _obscure,
                decoration: InputDecoration(
                  hintText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline_rounded),
                  suffixIcon: IconButton(
                    icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined),
                    onPressed: () => setState(() => _obscure = !_obscure),
                  ),
                ),
              ),
              const SizedBox(height: AppSpace.md),
              InkWell(
                onTap: () => setState(() => _acceptedTerms = !_acceptedTerms),
                borderRadius: BorderRadius.circular(AppRadius.button),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Checkbox(
                        value: _acceptedTerms,
                        onChanged: (v) => setState(() => _acceptedTerms = v ?? false),
                        activeColor: theme.colorScheme.primary,
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.only(top: 12),
                          child: Text(
                            'I agree to the Terms of Service and Privacy Policy',
                            style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: AppSpace.md),
              PrimaryButton(label: 'Create account', onPressed: _register, loading: auth.isLoading),
              const SizedBox(height: AppSpace.lg),
              // Social sign-up also lands on Home directly (not T&C) — the
              // response has no clean "brand-new account" signal at this
              // call site the way the email/OTP registration flow does,
              // and socialLogin's own controller doesn't collect
              // agreedToTerms/agreedToPrivacy the way registerUser does.
              // Known gap, not silently dropped — see Task 17 report.
              SocialLoginButtons(onSuccess: () => context.go('/success', extra: {'nextRoute': '/home'})),
              const SizedBox(height: AppSpace.lg),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('Already have an account? ', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
                  GestureDetector(
                    onTap: () => context.go('/login'),
                    child: Text('Sign in', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
              const SizedBox(height: AppSpace.xl),
            ],
          ),
        ),
      ),
    );
  }
}
