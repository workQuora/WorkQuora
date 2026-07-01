import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../auth/application/auth_controller.dart';
import '../../application/profile_controller.dart';
import '../../data/models/profile_model.dart';
import 'edit_profile_screen.dart';
import 'kyc_screen.dart';

// ── Local UI state providers ──────────────────────────────────────────────────
final _bidAlertsProvider     = StateProvider<bool>((ref) => true);
final _projectUpdatesProvider = StateProvider<bool>((ref) => false);
final _themeProvider         = StateProvider<ThemeMode>((ref) => ThemeMode.system);

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileControllerProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: profileAsync.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
        error: (err, _) => _ErrorView(
          message: err.toString(),
          onRetry: () => ref.read(profileControllerProvider.notifier).refresh(),
        ),
        data: (profile) {
          if (profile == null) {
            return _ErrorView(
              message: 'Profile not found.',
              onRetry: () => ref.read(profileControllerProvider.notifier).refresh(),
            );
          }
          return _ProfileBody(profile: profile);
        },
      ),
    );
  }
}

// ── Error view ────────────────────────────────────────────────────────────────
class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 72, height: 72,
              decoration: const BoxDecoration(
                color: AppColors.errorContainer,
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.error_outline_rounded, size: 36, color: AppColors.error),
            ),
            const SizedBox(height: 16),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppTypography.light.bodyLarge?.copyWith(color: AppColors.onSurfaceVariant),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: onRetry,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Main body ────────────────────────────────────────────────────────────────
class _ProfileBody extends ConsumerWidget {
  const _ProfileBody({required this.profile});
  final ProfileModel profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tt = AppTypography.light;
    final shortId = profile.id.length > 4
        ? profile.id.substring(profile.id.length - 4).toUpperCase()
        : profile.id.toUpperCase();

    return RefreshIndicator(
      color: AppColors.primary,
      onRefresh: () => ref.read(profileControllerProvider.notifier).refresh(),
      child: CustomScrollView(
        slivers: [
          // ── App Bar ────────────────────────────────────────────────────────
          SliverAppBar(
            pinned: true,
            expandedHeight: 0,
            backgroundColor: Colors.white,
            elevation: 0,
            title: Row(
              children: [
                Container(
                  width: 32, height: 32,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryContainer],
                    ),
                    borderRadius: AppRadius.mdR,
                  ),
                  child: const Center(
                    child: Text('WQ',
                        style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 11)),
                  ),
                ),
                const SizedBox(width: 8),
                Text('wQ Recruit', style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
              ],
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.notifications_none_rounded, color: AppColors.onSurface),
                onPressed: () => context.push('/notifications'),
              ),
            ],
          ),

          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([

                // ── 1. Profile Card ──────────────────────────────────────────
                _Card(
                  child: Column(
                    children: [
                      // Avatar
                      Center(
                        child: Stack(
                          children: [
                            Container(
                              width: 80, height: 80,
                              decoration: BoxDecoration(
                                gradient: const LinearGradient(
                                  colors: [AppColors.primary, AppColors.primaryContainer],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: ClipRRect(
                                borderRadius: BorderRadius.circular(20),
                                child: CachedNetworkImage(
                                  imageUrl: profile.avatar ?? '',
                                  fit: BoxFit.cover,
                                  errorWidget: (_, __, ___) => Center(
                                    child: Text(
                                      profile.name.isNotEmpty
                                          ? profile.name[0].toUpperCase()
                                          : 'U',
                                      style: const TextStyle(
                                          color: Colors.white,
                                          fontSize: 32,
                                          fontWeight: FontWeight.w800),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                            if (profile.kycVerified)
                              Positioned(
                                right: 0, bottom: 0,
                                child: Container(
                                  width: 22, height: 22,
                                  decoration: const BoxDecoration(
                                    color: AppColors.secondary,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(Icons.check_rounded,
                                      color: Colors.white, size: 14),
                                ),
                              ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Text(
                            _capitalize(profile.name),
                            style: tt.headlineSmall?.copyWith(fontWeight: FontWeight.w800),
                          ),
                          if (profile.kycVerified) ...[
                            const SizedBox(width: 6),
                            const Icon(Icons.verified_rounded,
                                color: AppColors.primary, size: 18),
                          ],
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Client ID: WQ-CLIENT-$shortId',
                        style: tt.labelSmall?.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w700,
                          letterSpacing: 0.5,
                        ),
                      ),
                      if (profile.email.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text(
                          profile.email,
                          style: tt.labelSmall?.copyWith(color: AppColors.outline),
                        ),
                      ],
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                          ),
                          icon: const Icon(Icons.edit_rounded, size: 16),
                          label: const Text('Edit Profile'),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── 2. Quick Action Tiles ─────────────────────────────────────
                GridView.count(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisCount: 2,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.6,
                  children: [
                    _QuickTile(
                      icon: profile.kycVerified
                          ? Icons.verified_user_rounded
                          : Icons.shield_outlined,
                      label: 'KYC',
                      badge: profile.kycVerified ? 'Verified' : 'Pending',
                      badgeColor: profile.kycVerified
                          ? AppColors.secondary
                          : AppColors.promoOrange,
                      bgColor: profile.kycVerified
                          ? const Color(0xFFEAF7ED)
                          : const Color(0xFFFFF3E0),
                      iconColor: profile.kycVerified
                          ? AppColors.secondary
                          : AppColors.promoOrange,
                      onTap: () => Navigator.of(context).push(
                          MaterialPageRoute(builder: (_) => const KycScreen())),
                    ),
                    _QuickTile(
                      icon: Icons.campaign_rounded,
                      label: 'Ads',
                      badge: 'Manage',
                      badgeColor: AppColors.primary,
                      bgColor: const Color(0xFFEEEBFF),
                      iconColor: AppColors.primary,
                      onTap: () {},
                    ),
                    _QuickTile(
                      icon: Icons.account_balance_wallet_rounded,
                      label: 'Wallet',
                      badge: 'Balance',
                      badgeColor: AppColors.secondary,
                      bgColor: const Color(0xFFEAF7ED),
                      iconColor: AppColors.secondary,
                      onTap: () => context.push('/wallet'),
                    ),
                    _QuickTile(
                      icon: Icons.lock_person_rounded,
                      label: 'Security',
                      badge: 'Settings',
                      badgeColor: AppColors.onSurfaceVariant,
                      bgColor: AppColors.surfaceContainerHigh,
                      iconColor: AppColors.onSurfaceVariant,
                      onTap: () {},
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // ── 3. Notifications ──────────────────────────────────────────
                _SectionTitle('Notifications'),
                const SizedBox(height: 8),
                _Card(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      Consumer(builder: (context, ref, _) {
                        return SwitchListTile(
                          contentPadding:
                              const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          title: Text('New Bid Alerts', style: tt.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                          subtitle: Text(
                              'Instant notification when a worker bids on your project',
                              style: tt.labelSmall?.copyWith(color: AppColors.outline)),
                          value: ref.watch(_bidAlertsProvider),
                          activeColor: AppColors.primary,
                          onChanged: (val) =>
                              ref.read(_bidAlertsProvider.notifier).state = val,
                        );
                      }),
                      const Divider(height: 1, indent: 16, endIndent: 16),
                      Consumer(builder: (context, ref, _) {
                        return SwitchListTile(
                          contentPadding:
                              const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                          title: Text('Project Updates', style: tt.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
                          subtitle: Text(
                              'Stay informed about milestone completions',
                              style: tt.labelSmall?.copyWith(color: AppColors.outline)),
                          value: ref.watch(_projectUpdatesProvider),
                          activeColor: AppColors.primary,
                          onChanged: (val) =>
                              ref.read(_projectUpdatesProvider.notifier).state = val,
                        );
                      }),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── 4. Payments Card ──────────────────────────────────────────
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _SectionTitle('Payments'),
                    TextButton(
                      onPressed: () => context.push('/wallet'),
                      child: Text('Manage',
                          style: tt.labelMedium?.copyWith(
                              color: AppColors.primary, fontWeight: FontWeight.w700)),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF1E00A9), Color(0xFF3525CD)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withOpacity(0.3),
                        blurRadius: 16,
                        offset: const Offset(0, 8),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Icon(Icons.credit_card_rounded,
                              color: Colors.white54, size: 28),
                          Text('VISA',
                              style: tt.titleLarge?.copyWith(
                                  color: Colors.white,
                                  fontStyle: FontStyle.italic,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 2)),
                        ],
                      ),
                      const SizedBox(height: 20),
                      Text(
                        '••••  ••••  ••••  8821',
                        style: tt.titleLarge?.copyWith(
                            color: Colors.white,
                            letterSpacing: 2,
                            fontSize: 18,
                            fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 16),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('CARD HOLDER',
                                  style: tt.labelSmall
                                      ?.copyWith(color: Colors.white54)),
                              Text(_capitalize(profile.name),
                                  style: tt.labelMedium?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700)),
                            ],
                          ),
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('Exp:',
                                  style: tt.labelSmall
                                      ?.copyWith(color: Colors.white54)),
                              Text('09/27',
                                  style: tt.labelMedium?.copyWith(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w700)),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── 5. Security ───────────────────────────────────────────────
                _SectionTitle('Security'),
                const SizedBox(height: 8),
                _Card(
                  padding: EdgeInsets.zero,
                  child: Column(
                    children: [
                      _SettingsTile(
                        icon: Icons.history_rounded,
                        label: 'Change Password',
                        trailing: Text('Tap to update',
                            style: tt.labelSmall?.copyWith(color: AppColors.outline)),
                        onTap: () {},
                      ),
                      const Divider(height: 1, indent: 56),
                      _SettingsTile(
                        icon: Icons.fingerprint_rounded,
                        label: 'Two-Factor Auth',
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: profile.twoFactorEnabled
                                ? AppColors.secondary.withOpacity(0.12)
                                : AppColors.error.withOpacity(0.1),
                            borderRadius: AppRadius.fullR,
                          ),
                          child: Text(
                            profile.twoFactorEnabled ? 'Active' : 'Off',
                            style: tt.labelSmall?.copyWith(
                              color: profile.twoFactorEnabled
                                  ? AppColors.secondary
                                  : AppColors.error,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        onTap: () {},
                      ),
                      const Divider(height: 1, indent: 56),
                      _SettingsTile(
                        icon: Icons.shield_outlined,
                        label: 'Identity Verification',
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: profile.kycVerified
                                ? AppColors.secondary.withOpacity(0.12)
                                : AppColors.promoOrange.withOpacity(0.12),
                            borderRadius: AppRadius.fullR,
                          ),
                          child: Text(
                            profile.kycVerified ? 'Verified' : 'Pending',
                            style: tt.labelSmall?.copyWith(
                              color: profile.kycVerified
                                  ? AppColors.secondary
                                  : AppColors.promoOrange,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        onTap: () => Navigator.of(context).push(
                            MaterialPageRoute(builder: (_) => const KycScreen())),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // ── 6. App Theme ──────────────────────────────────────────────
                _SectionTitle('App Theme'),
                const SizedBox(height: 8),
                Consumer(builder: (context, ref, _) {
                  final mode = ref.watch(_themeProvider);
                  return _Card(
                    child: Row(
                      children: [
                        _ThemeOption(
                          icon: Icons.light_mode_rounded,
                          label: 'Light',
                          selected: mode == ThemeMode.light,
                          onTap: () =>
                              ref.read(_themeProvider.notifier).state = ThemeMode.light,
                        ),
                        const SizedBox(width: 8),
                        _ThemeOption(
                          icon: Icons.dark_mode_rounded,
                          label: 'Dark',
                          selected: mode == ThemeMode.dark,
                          onTap: () =>
                              ref.read(_themeProvider.notifier).state = ThemeMode.dark,
                        ),
                        const SizedBox(width: 8),
                        _ThemeOption(
                          icon: Icons.settings_suggest_rounded,
                          label: 'System',
                          selected: mode == ThemeMode.system,
                          onTap: () =>
                              ref.read(_themeProvider.notifier).state = ThemeMode.system,
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 16),

                // ── 7. Logout ─────────────────────────────────────────────────
                Consumer(builder: (context, ref, _) {
                  return SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: BorderSide(color: AppColors.error.withOpacity(0.4), width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                        backgroundColor: AppColors.error.withOpacity(0.04),
                      ),
                      onPressed: () async {
                        final confirmed = await showDialog<bool>(
                          context: context,
                          builder: (_) => AlertDialog(
                            title: const Text('Logout'),
                            content: const Text('Are you sure you want to logout from wQ Recruit?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(context, false),
                                child: const Text('Cancel'),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.error,
                                    foregroundColor: Colors.white),
                                onPressed: () => Navigator.pop(context, true),
                                child: const Text('Logout'),
                              ),
                            ],
                          ),
                        );
                        if (confirmed == true) {
                          ref.read(authControllerProvider.notifier).logout();
                        }
                      },
                      icon: const Icon(Icons.logout_rounded, size: 18),
                      label: const Text('Logout from wQ Recruit',
                          style: TextStyle(fontWeight: FontWeight.w700)),
                    ),
                  );
                }),
                const SizedBox(height: 12),

                // ── 8. Footer ─────────────────────────────────────────────────
                Center(
                  child: Column(
                    children: [
                      Text('Version 4.2.1-stable • Build 1042',
                          style: tt.labelSmall
                              ?.copyWith(color: AppColors.outline, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      Text('Proudly made in India 🇮🇳',
                          style: tt.labelSmall?.copyWith(color: AppColors.outline)),
                    ],
                  ),
                ),
                const SizedBox(height: 40),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : s.split(' ').map((w) => w.isEmpty ? w : w[0].toUpperCase() + w.substring(1)).join(' ');
}

// ── Reusable widgets ──────────────────────────────────────────────────────────

class _Card extends StatelessWidget {
  const _Card({required this.child, this.padding});
  final Widget child;
  final EdgeInsetsGeometry? padding;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: padding ?? const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: AppRadius.xlR,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }
}

class _SectionTitle extends StatelessWidget {
  const _SectionTitle(this.title);
  final String title;

  @override
  Widget build(BuildContext context) {
    return Text(
      title,
      style: AppTypography.light.titleLarge?.copyWith(fontWeight: FontWeight.w800),
    );
  }
}

class _QuickTile extends StatelessWidget {
  const _QuickTile({
    required this.icon,
    required this.label,
    required this.badge,
    required this.badgeColor,
    required this.bgColor,
    required this.iconColor,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final String badge;
  final Color badgeColor;
  final Color bgColor;
  final Color iconColor;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.xlR,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: AppRadius.xlR,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: iconColor, size: 26),
            const Spacer(),
            Text(label,
                style: AppTypography.light.labelMedium
                    ?.copyWith(fontWeight: FontWeight.w800, color: AppColors.onSurface)),
            const SizedBox(height: 2),
            Text(badge,
                style: AppTypography.light.labelSmall
                    ?.copyWith(color: badgeColor, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}

class _SettingsTile extends StatelessWidget {
  const _SettingsTile({
    required this.icon,
    required this.label,
    required this.trailing,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final Widget trailing;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      leading: Container(
        width: 36, height: 36,
        decoration: BoxDecoration(
          color: AppColors.surfaceContainer,
          borderRadius: AppRadius.mdR,
        ),
        child: Icon(icon, color: AppColors.primary, size: 18),
      ),
      title: Text(label,
          style: AppTypography.light.bodyLarge?.copyWith(fontWeight: FontWeight.w600)),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          trailing,
          const SizedBox(width: 4),
          const Icon(Icons.chevron_right_rounded, color: AppColors.outline),
        ],
      ),
      onTap: onTap,
    );
  }
}

class _ThemeOption extends StatelessWidget {
  const _ThemeOption({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: selected ? AppColors.primary : Colors.transparent,
            borderRadius: AppRadius.lgR,
          ),
          child: Column(
            children: [
              Icon(icon,
                  color: selected ? Colors.white : AppColors.onSurfaceVariant, size: 22),
              const SizedBox(height: 4),
              Text(label,
                  style: AppTypography.light.labelSmall?.copyWith(
                    color: selected ? Colors.white : AppColors.onSurfaceVariant,
                    fontWeight: selected ? FontWeight.w800 : FontWeight.w500,
                  )),
            ],
          ),
        ),
      ),
    );
  }
}
