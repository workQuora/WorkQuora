import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../auth/application/auth_controller.dart';
import '../../application/profile_controller.dart';
import 'edit_profile_screen.dart';
import 'kyc_screen.dart';

final bidAlertsProvider = StateProvider<bool>((ref) => true);
final projectUpdatesProvider = StateProvider<bool>((ref) => false);
final appThemeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileControllerProvider);
    final textTheme = AppTypography.light;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'wQ Recruit Profile',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.onSurface,
      ),
      body: SafeArea(
        child: profileAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (error, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.error),
                  const SizedBox(height: 16),
                  Text(
                    error.toString(),
                    textAlign: TextAlign.center,
                    style: textTheme.bodyLarge,
                  ),
                  const SizedBox(height: AppSpacing.stackMd),
                  OutlinedButton(
                    onPressed: () => ref.read(profileControllerProvider.notifier).refresh(),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
          data: (profile) {
            if (profile == null) return const SizedBox.shrink();

            final clientShortId = profile.id.length > 6
                ? profile.id.substring(profile.id.length - 6).toUpperCase()
                : 'XXXXXX';

            return RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () => ref.read(profileControllerProvider.notifier).refresh(),
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.containerMargin),
                children: [
                  // 1. Company Card
                  Container(
                    padding: const EdgeInsets.all(AppSpacing.cardPadding),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: AppRadius.xlR,
                      border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.015),
                          blurRadius: 8,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            ClipRRect(
                              borderRadius: AppRadius.mdR,
                              child: CachedNetworkImage(
                                imageUrl: profile.avatar ?? 'https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}',
                                width: 64,
                                height: 64,
                                fit: BoxFit.cover,
                                placeholder: (_, __) => Container(color: AppColors.surfaceContainer, width: 64, height: 64),
                                errorWidget: (_, __, ___) => const Icon(Icons.business_rounded, size: 64, color: AppColors.outline),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.gutter),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Text(
                                          profile.name,
                                          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                      if (profile.kycVerified)
                                        const Icon(Icons.verified_rounded, color: AppColors.primary, size: 18),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Client ID: WQ-CLIENT-$clientShortId',
                                    style: textTheme.labelSmall?.copyWith(
                                      color: AppColors.outline,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            style: OutlinedButton.styleFrom(
                              shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                              side: BorderSide(color: AppColors.outlineVariant.withOpacity(0.6)),
                            ),
                            onPressed: () => Navigator.of(context).push(
                              MaterialPageRoute(builder: (_) => const EditProfileScreen()),
                            ),
                            icon: const Icon(Icons.mode_edit_outline_rounded, size: 16, color: AppColors.primary),
                            label: Text(
                              'Edit Profile',
                              style: textTheme.labelMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.stackLg),

                  // 2. 2x2 tiles
                  GridView.count(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisCount: 2,
                    mainAxisSpacing: 12,
                    crossAxisSpacing: 12,
                    childAspectRatio: 1.45,
                    children: [
                      // Tile 1: KYC status
                      _buildTile(
                        icon: profile.kycVerified ? Icons.verified_user_rounded : Icons.shield_outlined,
                        title: 'KYC Status',
                        subtitle: profile.kycVerified ? 'Verified' : 'Pending Verification',
                        color: profile.kycVerified ? AppColors.secondary : AppColors.promoOrange,
                        background: profile.kycVerified ? AppColors.secondaryFixedDim.withOpacity(0.2) : AppColors.errorContainer.withOpacity(0.3),
                        onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const KycScreen())),
                      ),
                      // Tile 2: Ads
                      _buildTile(
                        icon: Icons.campaign_rounded,
                        title: 'My Ads',
                        subtitle: 'Manage & Track',
                        color: AppColors.primary,
                        background: AppColors.primaryFixed.withOpacity(0.3),
                        onTap: () {},
                      ),
                      // Tile 3: Wallet
                      _buildTile(
                        icon: Icons.account_balance_wallet_rounded,
                        title: 'Wallet',
                        subtitle: 'Deposits & Invoices',
                        color: AppColors.secondary,
                        background: AppColors.secondaryFixed.withOpacity(0.3),
                        onTap: () => context.push('/wallet'),
                      ),
                      // Tile 4: Security
                      _buildTile(
                        icon: Icons.lock_person_rounded,
                        title: 'Security',
                        subtitle: 'Password & 2FA',
                        color: AppColors.onSurface,
                        background: AppColors.surfaceContainerHigh,
                        onTap: () {},
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.stackLg),

                  // 3. Visa Gradient Card (Payments Card)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(AppSpacing.cardPadding),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF29323C), Color(0xFF485563)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(20),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.12),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'wQ Payments',
                              style: AppTypography.textTheme(Colors.white).labelMedium?.copyWith(
                                    fontWeight: FontWeight.w800,
                                    letterSpacing: 1.0,
                                  ),
                            ),
                            Text(
                              'VISA',
                              style: AppTypography.textTheme(Colors.white).titleLarge?.copyWith(
                                    fontStyle: FontStyle.italic,
                                    fontWeight: FontWeight.w900,
                                  ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Text(
                          '••••  ••••  ••••  4892',
                          style: AppTypography.textTheme(Colors.white).titleLarge?.copyWith(
                                wordSpacing: 6,
                                letterSpacing: 1.5,
                                fontSize: 20,
                              ),
                        ),
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'CARD HOLDER',
                                  style: AppTypography.textTheme(Colors.white.withOpacity(0.5)).labelSmall,
                                ),
                                Text(
                                  profile.name.toUpperCase(),
                                  style: AppTypography.textTheme(Colors.white).labelMedium?.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                ),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'EXPIRES',
                                  style: AppTypography.textTheme(Colors.white.withOpacity(0.5)).labelSmall,
                                ),
                                Text(
                                  '12 / 29',
                                  style: AppTypography.textTheme(Colors.white).labelMedium?.copyWith(
                                        fontWeight: FontWeight.w700,
                                      ),
                                ),
                              ],
                            ),
                            GestureDetector(
                              onTap: () {},
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.white.withOpacity(0.2),
                                  borderRadius: AppRadius.mdR,
                                ),
                                child: Text(
                                  'Manage',
                                  style: AppTypography.textTheme(Colors.white).labelSmall?.copyWith(
                                        fontWeight: FontWeight.w800,
                                      ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.stackLg),

                  // 4. Notifications Section
                  Text(
                    'Notifications Preferences',
                    style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: AppRadius.xlR,
                      border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
                    ),
                    child: Column(
                      children: [
                        SwitchListTile(
                          title: Text('New Bid Alerts', style: textTheme.bodyLarge),
                          subtitle: Text('Get notified when freelancers bid on your jobs', style: textTheme.labelSmall?.copyWith(color: AppColors.outline)),
                          value: ref.watch(bidAlertsProvider),
                          activeColor: AppColors.primary,
                          onChanged: (val) => ref.read(bidAlertsProvider.notifier).state = val,
                        ),
                        const Divider(height: 1),
                        SwitchListTile(
                          title: Text('Project Updates', style: textTheme.bodyLarge),
                          subtitle: Text('Status changes on milestone submissions', style: textTheme.labelSmall?.copyWith(color: AppColors.outline)),
                          value: ref.watch(projectUpdatesProvider),
                          activeColor: AppColors.primary,
                          onChanged: (val) => ref.read(projectUpdatesProvider.notifier).state = val,
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.stackLg),

                  // 5. Security List
                  Text(
                    'Account Settings & Security',
                    style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: AppRadius.xlR,
                      border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
                    ),
                    child: Column(
                      children: [
                        ListTile(
                          leading: const Icon(Icons.lock_outline_rounded, color: AppColors.primary),
                          title: Text('Change Password', style: textTheme.bodyLarge),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Updated 3mo ago', style: textTheme.labelSmall?.copyWith(color: AppColors.outline)),
                              const SizedBox(width: 4),
                              const Icon(Icons.chevron_right_rounded, color: AppColors.outline),
                            ],
                          ),
                          onTap: () {},
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: const Icon(Icons.fingerprint_rounded, color: AppColors.primary),
                          title: Text('Two-Factor Auth', style: textTheme.bodyLarge),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text('Off', style: textTheme.labelSmall?.copyWith(color: AppColors.error, fontWeight: FontWeight.w800)),
                              const SizedBox(width: 4),
                              const Icon(Icons.chevron_right_rounded, color: AppColors.outline),
                            ],
                          ),
                          onTap: () {},
                        ),
                        const Divider(height: 1),
                        ListTile(
                          leading: const Icon(Icons.shield_outlined, color: AppColors.primary),
                          title: Text('Identity Verification', style: textTheme.bodyLarge),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                profile.kycVerified ? 'Verified' : 'Pending',
                                style: textTheme.labelSmall?.copyWith(
                                  color: profile.kycVerified ? AppColors.secondary : AppColors.promoOrange,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(width: 4),
                              const Icon(Icons.chevron_right_rounded, color: AppColors.outline),
                            ],
                          ),
                          onTap: () => Navigator.of(context).push(MaterialPageRoute(builder: (_) => const KycScreen())),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.stackLg),

                  // 6. App Theme Selector
                  Text(
                    'App Interface Settings',
                    style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 10),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: AppRadius.xlR,
                      border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Theme Select', style: textTheme.bodyLarge),
                        DropdownButton<ThemeMode>(
                          value: ref.watch(appThemeProvider),
                          underline: const SizedBox.shrink(),
                          items: const [
                            DropdownMenuItem(value: ThemeMode.light, child: Text('Light Mode')),
                            DropdownMenuItem(value: ThemeMode.dark, child: Text('Dark Mode')),
                            DropdownMenuItem(value: ThemeMode.system, child: Text('System Default')),
                          ],
                          onChanged: (mode) {
                            if (mode != null) {
                              ref.read(appThemeProvider.notifier).state = mode;
                            }
                          },
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: AppSpacing.stackLg),

                  // 7. Logout Button
                  SizedBox(
                    width: double.infinity,
                    height: 48,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.error.withOpacity(0.1),
                        foregroundColor: AppColors.error,
                        elevation: 0,
                        shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                        side: const BorderSide(color: AppColors.error, width: 1.5),
                      ),
                      onPressed: () => ref.read(authControllerProvider.notifier).logout(),
                      icon: const Icon(Icons.logout_rounded, size: 18),
                      label: Text(
                        'Logout from wQ Recruit',
                        style: textTheme.labelMedium?.copyWith(
                          color: AppColors.error,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // 8. Version Footer
                  Center(
                    child: Column(
                      children: [
                        Text(
                          'wQ Recruit v1.0.0 (Build 1)',
                          style: textTheme.labelSmall?.copyWith(color: AppColors.outline, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Proudly made in India 🇮🇳',
                          style: textTheme.labelSmall?.copyWith(color: AppColors.outline),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required Color color,
    required Color background,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.xlR,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: background,
          borderRadius: AppRadius.xlR,
          border: Border.all(color: color.withOpacity(0.15)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(height: 10),
            Text(
              title,
              style: AppTypography.light.labelMedium?.copyWith(
                fontWeight: FontWeight.w800,
                color: AppColors.onSurface,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              subtitle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: AppTypography.light.labelSmall?.copyWith(
                color: AppColors.onSurfaceVariant,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
