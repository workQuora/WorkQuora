import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});
  @override State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _nameCtrl  = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _userCtrl  = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _passCtrl  = TextEditingController();
  final _titleCtrl = TextEditingController();
  bool _obscure = true;

  @override void dispose() { _nameCtrl.dispose(); _emailCtrl.dispose(); _userCtrl.dispose(); _phoneCtrl.dispose(); _passCtrl.dispose(); _titleCtrl.dispose(); super.dispose(); }

  Future<void> _register() async {
    final auth = context.read<AuthProvider>();
    final ok = await auth.register({'name': _nameCtrl.text.trim(), 'email': _emailCtrl.text.trim(), 'username': _userCtrl.text.trim(), 'mobileNumber': _phoneCtrl.text.trim(), 'password': _passCtrl.text, 'title': _titleCtrl.text.trim(), 'role': 'FREELANCER'});
    if (!mounted) return;
    if (ok) {
      context.push('/otp', extra: {
        'title': 'Verify Email',
        'subtitle': 'Enter the OTP sent to your email',
        'isMobileOtp': false,
      });
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(auth.error ?? 'Registration failed'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(backgroundColor: AppColors.background, elevation: 0, leading: IconButton(icon:  Icon(Icons.arrow_back_ios, color: AppColors.textPrimary, size: 20), onPressed: () => context.go('/login'))),
      body: SafeArea(child: SingleChildScrollView(padding: const EdgeInsets.symmetric(horizontal: 24), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const SizedBox(height: 8),
         Text('Join as a Worker 🔧', style: TextStyle(fontSize: 28, fontWeight: FontWeight.w900, color: AppColors.textPrimary)),
        const SizedBox(height: 6),
         Text('Find jobs, earn money, grow your career', style: TextStyle(color: AppColors.textSecondary)),
        const SizedBox(height: 28),
        AppTextField(controller: _nameCtrl, hint: 'Full Name', icon: Icons.person_outline),
        const SizedBox(height: 12),
        AppTextField(controller: _titleCtrl, hint: 'Your Profession (e.g. Plumber)', icon: Icons.work_outline),
        const SizedBox(height: 12),
        AppTextField(controller: _emailCtrl, hint: 'Email Address', icon: Icons.email_outlined, keyboardType: TextInputType.emailAddress),
        const SizedBox(height: 12),
        AppTextField(controller: _userCtrl, hint: 'Username', icon: Icons.alternate_email),
        const SizedBox(height: 12),
        AppTextField(controller: _phoneCtrl, hint: 'Mobile Number', icon: Icons.phone_outlined, keyboardType: TextInputType.phone),
        const SizedBox(height: 12),
        AppTextField(controller: _passCtrl, hint: 'Password', icon: Icons.lock_outline, obscure: _obscure, suffix: IconButton(icon: Icon(_obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppColors.textSecondary, size: 20), onPressed: () => setState(() => _obscure = !_obscure))),
        const SizedBox(height: 28),
        AppButton(label: 'Start Earning', onPressed: _register, loading: auth.isLoading),
        const SizedBox(height: 20),
        Row(mainAxisAlignment: MainAxisAlignment.center, children: [
           Text('Already have an account? ', style: TextStyle(color: AppColors.textSecondary)),
          GestureDetector(onTap: () => context.go('/login'), child:  Text('Sign In', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
        ]),
        const SizedBox(height: 32),
      ]))),
    );
  }
}
