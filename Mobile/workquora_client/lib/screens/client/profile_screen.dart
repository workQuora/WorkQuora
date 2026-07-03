import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/app_button.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user ?? {};
    final name = user['name'] ?? 'User';
    final email = user['email'] ?? '';
    final isKyc = user['isKycVerified'] == true;
    final isEmail = user['isEmailVerified'] == true;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          backgroundColor: AppColors.bg, expandedHeight: 200, pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.primary, Color(0xFF7C3AED), Color(0xFF06B6D4)], begin: Alignment.topLeft, end: Alignment.bottomRight)),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const SizedBox(height: 40),
                Container(width: 80, height: 80, decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle, border: Border.all(color: Colors.white.withOpacity(0.4), width: 2)),
                  child: Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)))),
                const SizedBox(height: 10),
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 4),
                const Text('Client', style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1)),
              ]),
            ),
          ),
        ),
        SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _badge(isEmail ? '✉ Email Verified' : '✉ Email Unverified', isEmail ? AppColors.emerald : AppColors.textMuted),
            const SizedBox(width: 10),
            _badge(isKyc ? '✓ KYC Verified' : '! KYC Pending', isKyc ? AppColors.emerald : AppColors.warning),
          ]),
          const SizedBox(height: 28),
          _tile(Icons.email_outlined, 'Email', email),
          _tile(Icons.phone_outlined, 'Mobile', user['mobileNumber'] ?? 'Not added'),
          _tile(Icons.badge_outlined, 'Username', '@${user['username'] ?? ''}'),
          _tile(Icons.shield_outlined, 'KYC Status', isKyc ? 'Verified ✓' : 'Pending — Complete KYC'),
          const SizedBox(height: 28),
          if (!isKyc)
            Padding(padding: const EdgeInsets.only(bottom: 12), child: AppButton(label: '🔐 Complete KYC Verification', onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('KYC section coming soon!'))))),
          AppButton(label: 'Logout', onPressed: () async { await auth.logout(); if (context.mounted) context.go('/login'); }, color: AppColors.error),
          const SizedBox(height: 20),
        ]))),
      ]),
    );
  }

  Widget _badge(String label, Color color) => Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
    decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3))),
    child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)));

  Widget _tile(IconData icon, String label, String value) => Container(margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
    child: Row(children: [
      Icon(icon, color: AppColors.textMuted, size: 18), const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        Text(value, style: const TextStyle(color: AppColors.text, fontSize: 14, fontWeight: FontWeight.w600)),
      ])),
    ]));
}
