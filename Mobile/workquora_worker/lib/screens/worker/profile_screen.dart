import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/app_button.dart';

class WorkerProfileScreen extends StatelessWidget {
  const WorkerProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth  = context.watch<AuthProvider>();
    final user  = auth.user ?? {};
    final name  = user['name'] ?? 'Worker';
    final title = user['title'] ?? 'Freelancer';
    final email = user['email'] ?? '';
    final isKyc = user['isKycVerified'] == true;
    final rating= (user['averageRating'] ?? 0.0).toDouble();
    final skills= List<String>.from(user['skills'] ?? []);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          backgroundColor: AppColors.bg, expandedHeight: 220, pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: const BoxDecoration(gradient: LinearGradient(colors: [Color(0xFF065F46), AppColors.emerald, Color(0xFF06B6D4)], begin: Alignment.topLeft, end: Alignment.bottomRight)),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const SizedBox(height: 50),
                Container(width: 80, height: 80, decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle, border: Border.all(color: Colors.white.withOpacity(0.4), width: 2)),
                  child: Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'W', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)))),
                const SizedBox(height: 10),
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Text(title, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  if (rating > 0) ...[
                    const SizedBox(width: 8),
                    const Icon(Icons.star_rounded, color: AppColors.amber, size: 14),
                    Text(' ${rating.toStringAsFixed(1)}', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  ],
                ]),
              ]),
            ),
          ),
        ),
        SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _badge(isKyc ? '✓ KYC Verified' : '! KYC Pending', isKyc ? AppColors.emerald : AppColors.warning),
          ]),
          const SizedBox(height: 24),
          _tile(Icons.email_outlined, 'Email', email),
          _tile(Icons.phone_outlined, 'Mobile', user['mobileNumber'] ?? 'Not added'),
          _tile(Icons.badge_outlined, 'Username', '@${user['username'] ?? ''}'),
          _tile(Icons.work_outline, 'Profession', title),
          if (skills.isNotEmpty) ...[
            const SizedBox(height: 20),
            const Align(alignment: Alignment.centerLeft, child: Text('Skills', style: TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.bold))),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: skills.map((s) => Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.primary.withOpacity(0.3))),
              child: Text(s, style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)))).toList()),
          ],
          const SizedBox(height: 28),
          if (!isKyc)
            Padding(padding: const EdgeInsets.only(bottom: 12), child: AppButton(label: '🔐 Complete KYC to Get Paid', onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('KYC section coming soon!'))))),
          AppButton(label: 'Edit Profile', onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Profile editing coming soon!'))), outlined: true),
          const SizedBox(height: 12),
          AppButton(label: 'Logout', onPressed: () async { await auth.logout(); if (context.mounted) context.go('/login'); }, color: AppColors.error),
          const SizedBox(height: 30),
        ]))),
      ]),
    );
  }

  Widget _badge(String label, Color color) => Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
    decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3))),
    child: Text(label, style: TextStyle(color: color, fontSize: 12, fontWeight: FontWeight.bold)));

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
