import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});
  @override State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() { _emailCtrl.dispose(); _passCtrl.dispose(); super.dispose(); }

  Future<void> _login() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (!mounted) return;
    if (ok) {
      context.go('/home');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.error ?? 'Login failed'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 48),
              Container(
                width: 56, height: 56,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF8B5CF6)]),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: ClipRRect(borderRadius: BorderRadius.circular(16), child: Image.asset('assets/logo.png', fit: BoxFit.cover)),
              ),
              const SizedBox(height: 28),
              const Text('Welcome back 👋', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppColors.text)),
              const SizedBox(height: 6),
              const Text('Sign in to hire trusted workers', style: TextStyle(color: AppColors.textMuted, fontSize: 15)),
              const SizedBox(height: 36),
              AppTextField(controller: _emailCtrl, hint: 'Email address', icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress),
              const SizedBox(height: 14),
              AppTextField(
                controller: _passCtrl, hint: 'Password', icon: Icons.lock_outline,
                obscure: _obscure,
                suffix: IconButton(
                  icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppColors.textMuted, size: 20),
                  onPressed: () => setState(() => _obscure = !_obscure)
                ),
              ),
              const SizedBox(height: 28),
              AppButton(label: 'Sign In', onPressed: _login, loading: auth.isLoading),
              const SizedBox(height: 20),
              Row(children: [
                const Expanded(child: Divider(color: AppColors.border)),
                Padding(padding: const EdgeInsets.symmetric(horizontal: 12), child: Text('or', style: TextStyle(color: AppColors.textMuted, fontSize: 13))),
                const Expanded(child: Divider(color: AppColors.border)),
              ]),
              const SizedBox(height: 20),
              Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                const Text("Don't have an account? ", style: TextStyle(color: AppColors.textMuted)),
                GestureDetector(onTap: () => context.go('/register'), child: const Text('Register', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
              ]),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}
