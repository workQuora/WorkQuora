import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../data/models/talent_profile_model.dart';
import '../../domain/repositories/talent_profile_repository.dart';
import '../../data/talent_profile_providers.dart';
import '../widgets/review_tile.dart';
import '../widgets/stat_block.dart';
import '../widgets/review_modal.dart';

class TalentProfileScreen extends ConsumerWidget {
  const TalentProfileScreen({super.key, required this.userId});
  final String userId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bundleAsync = ref.watch(talentProfileProvider(userId));

    return Scaffold(
      body: bundleAsync.when(
        loading: () => const _ProfileSkeleton(),
        error: (error, _) => _ProfileError(
          message: error.toString(),
          onRetry: () => ref.invalidate(talentProfileProvider(userId)),
        ),
        data: (bundle) => _ProfileContent(bundle: bundle),
      ),
    );
  }
}

class _ProfileContent extends StatelessWidget {
  const _ProfileContent({required this.bundle});
  final TalentProfileBundle bundle;

  @override
  Widget build(BuildContext context) {
    final profile = bundle.profile;
    final textTheme = Theme.of(context).textTheme;

    return Stack(
      children: [
        CustomScrollView(
          slivers: [
            SliverAppBar(
              pinned: true,
              expandedHeight: 220,
              backgroundColor: AppColors.surface,
              foregroundColor: AppColors.onSurface,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryContainer],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                  ),
                  child: SafeArea(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        _HeaderAvatar(url: profile.profilePic, isVerified: profile.kycVerified),
                        const SizedBox(height: AppSpacing.stackSm),
                        Text(
                          profile.name,
                          style: textTheme.headlineMedium?.copyWith(color: Colors.white),
                        ),
                        if (profile.title.isNotEmpty)
                          Padding(
                            padding: const EdgeInsets.only(top: 2),
                            child: Text(
                              profile.title,
                              style: textTheme.bodyMedium?.copyWith(color: Colors.white.withValues(alpha: 0.85)),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.containerMargin,
                  AppSpacing.stackLg,
                  AppSpacing.containerMargin,
                  100, // leave room for the sticky bottom bar
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _AvailabilityRow(profile: profile),
                    const SizedBox(height: AppSpacing.stackLg),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(AppSpacing.cardPadding),
                        child: Row(
                          children: [
                            Expanded(
                              child: StatBlock(
                                value: profile.averageRating.toStringAsFixed(1),
                                label: 'Rating',
                                icon: Icons.star_rounded,
                              ),
                            ),
                            _StatDivider(),
                            Expanded(
                              child: StatBlock(
                                value: '${profile.completedProjects}',
                                label: 'Completed',
                                icon: Icons.task_alt_rounded,
                              ),
                            ),
                            _StatDivider(),
                            Expanded(
                              child: StatBlock(
                                value: '${profile.jobSuccessRate.toStringAsFixed(0)}%',
                                label: 'Success rate',
                                icon: Icons.trending_up_rounded,
                              ),
                            ),
                            _StatDivider(),
                            Expanded(
                              child: StatBlock(
                                value: '${profile.responseTimeMinutes}m',
                                label: 'Response',
                                icon: Icons.bolt_rounded,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.stackLg),
                    if (profile.bio.isNotEmpty) ...[
                      Text('About', style: textTheme.headlineSmall),
                      const SizedBox(height: AppSpacing.stackSm),
                      Text(
                        profile.bio,
                        style: textTheme.bodyLarge?.copyWith(color: AppColors.onSurfaceVariant),
                      ),
                      const SizedBox(height: AppSpacing.stackLg),
                    ],
                    if (profile.skills.isNotEmpty) ...[
                      Text('Skills', style: textTheme.headlineSmall),
                      const SizedBox(height: AppSpacing.stackSm),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: profile.skills.map((s) => Chip(label: Text(s))).toList(),
                      ),
                      const SizedBox(height: AppSpacing.stackLg),
                    ],
                    Row(
                      children: [
                        Text('Reviews', style: textTheme.headlineSmall),
                        const SizedBox(width: 8),
                        Text('(${bundle.reviews.length})',
                            style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant)),
                        const Spacer(),
                        TextButton.icon(
                          onPressed: () {
                            showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (ctx) => Padding(
                                padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom),
                                child: ReviewModal(
                                  jobId: '658bf4e8c1b2c45e88bb68b3', // Mock valid MongoDB ObjectId
                                  revieweeId: profile.id,
                                  revieweeName: profile.name,
                                ),
                              ),
                            );
                          },
                          icon: const Icon(Icons.rate_review_rounded, size: 16, color: AppColors.primary),
                          label: Text(
                            'Write a Review',
                            style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700),
                          ),
                        ),
                      ],
                    ),
                    if (bundle.reviews.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: AppSpacing.stackMd),
                        child: Text(
                          'No reviews yet.',
                          style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
                        ),
                      )
                    else
                      // Reviews are usually a short list for a single profile —
                      // a plain Column inside the scroll view is fine here;
                      // ListView.builder would only matter for hundreds+ items.
                      Column(
                        children: bundle.reviews.map((r) => ReviewTile(review: r)).toList(),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: _StickyActionBar(profile: profile),
        ),
      ],
    );
  }
}

class _StatDivider extends StatelessWidget {
  const _StatDivider();
  @override
  Widget build(BuildContext context) => Container(width: 1, height: 36, color: AppColors.surfaceContainerHigh);
}

class _AvailabilityRow extends StatelessWidget {
  const _AvailabilityRow({required this.profile});
  final TalentProfileModel profile;

  @override
  Widget build(BuildContext context) {
    final isAvailable = profile.availabilityStatus == 'AVAILABLE' || profile.availabilityStatus == 'ONLINE';
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: isAvailable ? AppColors.secondary : AppColors.outline,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Text(
          isAvailable ? 'Available for work' : 'Currently unavailable',
          style: Theme.of(context).textTheme.labelMedium?.copyWith(color: AppColors.onSurfaceVariant),
        ),
        const Spacer(),
        if (profile.hourlyRate > 0)
          Text(
            '\$${profile.hourlyRate}/hr',
            style: Theme.of(context)
                .textTheme
                .titleLarge
                ?.copyWith(color: AppColors.secondary, fontWeight: FontWeight.w700),
          ),
      ],
    );
  }
}

class _HeaderAvatar extends StatelessWidget {
  const _HeaderAvatar({required this.url, required this.isVerified});
  final String? url;
  final bool isVerified;

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        Container(
          width: 84,
          height: 84,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: Colors.white, width: 3),
          ),
          child: ClipOval(
            child: url == null || url!.isEmpty
                ? Container(
                    color: AppColors.surfaceContainer,
                    child: const Icon(Icons.person_rounded, size: 36, color: AppColors.outline),
                  )
                : CachedNetworkImage(
                    imageUrl: url!,
                    fit: BoxFit.cover,
                    memCacheWidth: 168,
                    memCacheHeight: 168,
                  ),
          ),
        ),
        if (isVerified)
          Positioned(
            bottom: 2,
            right: 2,
            child: Container(
              padding: const EdgeInsets.all(2),
              decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
              child: const Icon(Icons.verified_rounded, size: 18, color: AppColors.verifiedBlue),
            ),
          ),
      ],
    );
  }
}

class _StickyActionBar extends StatelessWidget {
  const _StickyActionBar({required this.profile});
  final TalentProfileModel profile;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.containerMargin,
        AppSpacing.stackSm,
        AppSpacing.containerMargin,
        AppSpacing.stackMd,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        boxShadow: [BoxShadow(color: AppColors.outlineVariant.withValues(alpha: 0.3), blurRadius: 12, offset: const Offset(0, -2))],
      ),
      child: SafeArea(
        top: false,
        child: Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _showMessageInfo(context),
                icon: const Icon(Icons.mail_outline_rounded, size: 18),
                label: const Text('Message'),
              ),
            ),
            const SizedBox(width: AppSpacing.gutter),
            Expanded(
              flex: 2,
              child: PrimaryButton(
                label: 'Hire ${profile.name.toString().split(' ').first}',
                icon: Icons.bolt_rounded,
                onPressed: () => _showHireInfo(context),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Backend requires a jobId to start a chat thread (messageController.sendMessage),
  // so direct messaging from a profile only opens once a job links the two
  // users — this is intentional, not a missing feature.
  void _showMessageInfo(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Post a job and invite this freelancer to start messaging.')),
    );
  }

  void _showHireInfo(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Job posting flow is coming in a later phase.')),
    );
  }
}

class _ProfileSkeleton extends StatelessWidget {
  const _ProfileSkeleton();
  @override
  Widget build(BuildContext context) {
    return const Center(child: CircularProgressIndicator());
  }
}

class _ProfileError extends StatelessWidget {
  const _ProfileError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline_rounded, size: 40, color: AppColors.outline),
              const SizedBox(height: AppSpacing.stackMd),
              Text(message, textAlign: TextAlign.center, style: Theme.of(context).textTheme.bodyLarge),
              const SizedBox(height: AppSpacing.stackMd),
              OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
            ],
          ),
        ),
      ),
    );
  }
}
