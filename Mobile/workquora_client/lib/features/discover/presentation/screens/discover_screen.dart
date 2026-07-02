import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../application/discover_controller.dart';
import '../../data/models/talent_model.dart';

/// Discover screen — matches the "Discover Elite Talent" target design.
/// All data comes from the real backend (geo/nearby-freelancers) through
/// [discoverControllerProvider]; nothing here is mocked.
class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  final _searchCtrl = TextEditingController();
  final _scrollCtrl = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollCtrl.addListener(() {
      if (_scrollCtrl.position.pixels > _scrollCtrl.position.maxScrollExtent - 300) {
        ref.read(discoverControllerProvider.notifier).loadMore();
      }
    });
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(discoverControllerProvider);
    final tt = AppTypography.light;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => ref.read(discoverControllerProvider.notifier).refresh(),
          child: CustomScrollView(
            controller: _scrollCtrl,
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              // ── Header ────────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                  colors: [AppColors.primary, AppColors.primaryContainer]),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Icon(Icons.person_rounded, color: Colors.white, size: 22),
                          ),
                          const SizedBox(width: 10),
                          Text('wQ Recruit',
                              style: tt.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w800, color: AppColors.primary)),
                        ],
                      ),
                      IconButton(
                        icon: const Icon(Icons.notifications_none_rounded,
                            color: AppColors.onSurface),
                        onPressed: () => context.push('/notifications'),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Hero copy ─────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                       Text('Discover Elite Talent',
                          style: tt.headlineLarge?.copyWith(fontWeight: FontWeight.w900)),
                      const SizedBox(height: 8),
                      Text(
                        "Connect with the world's most distinguished independent professionals for your high-impact projects.",
                        style: tt.bodyLarge?.copyWith(color: AppColors.onSurfaceVariant),
                      ),
                    ],
                  ),
                ),
              ),

              // ── Search bar ────────────────────────────────────────────────
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 20, 16, 0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: AppColors.surfaceContainer,
                      borderRadius: AppRadius.fullR,
                    ),
                    child: TextField(
                      controller: _searchCtrl,
                      onChanged: (v) =>
                          ref.read(discoverControllerProvider.notifier).setKeyword(v),
                      decoration: InputDecoration(
                        hintText: 'Search expertise, skills, or roles...',
                        hintStyle: tt.bodyLarge?.copyWith(color: AppColors.outline),
                        prefixIcon:
                            const Icon(Icons.search_rounded, color: AppColors.outline),
                        border: InputBorder.none,
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                      ),
                    ),
                  ),
                ),
              ),

              // ── Category chips ────────────────────────────────────────────
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 64,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
                    itemCount: kDiscoverCategories.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (context, i) {
                      final cat = kDiscoverCategories[i];
                      final selected = state.category == cat;
                      return GestureDetector(
                        onTap: () =>
                            ref.read(discoverControllerProvider.notifier).setCategory(cat),
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 180),
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: selected ? AppColors.primary : AppColors.surfaceContainer,
                            borderRadius: AppRadius.fullR,
                          ),
                          child: Text(cat,
                              style: tt.labelMedium?.copyWith(
                                color: selected ? Colors.white : AppColors.onSurfaceVariant,
                                fontWeight: FontWeight.w700,
                              )),
                        ),
                      );
                    },
                  ),
                ),
              ),

              // ── Body states ───────────────────────────────────────────────
              if (state.isLoading || state.isLocating)
                const SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                )
              else if (state.error != null)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: _ErrorState(
                    message: state.error!.message,
                    onRetry: () =>
                        ref.read(discoverControllerProvider.notifier).retryLocation(),
                  ),
                )
              else if (state.visibleResults.isEmpty)
                SliverFillRemaining(
                  hasScrollBody: false,
                  child: Center(
                    child: Text('No talent found nearby.',
                        style: tt.bodyLarge?.copyWith(color: AppColors.outline)),
                  ),
                )
              else
                SliverPadding(
                  padding: const EdgeInsets.fromLTRB(16, 8, 16, 100),
                  sliver: SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (context, i) {
                        if (i == state.visibleResults.length) {
                          return state.canLoadMore
                              ? const Padding(
                                  padding: EdgeInsets.all(16),
                                  child: Center(
                                      child: CircularProgressIndicator(
                                          color: AppColors.primary, strokeWidth: 2)),
                                )
                              : const SizedBox.shrink();
                        }
                        return _TalentCard(talent: state.visibleResults[i]);
                      },
                      childCount: state.visibleResults.length + 1,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Talent card — matches target design ───────────────────────────────────────
class _TalentCard extends ConsumerWidget {
  const _TalentCard({required this.talent});
  final TalentModel talent;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tt = AppTypography.light;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 3)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar with verified badge
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(14),
                    child: SizedBox(
                      width: 64, height: 64,
                      child: CachedNetworkImage(
                        imageUrl: talent.avatar ?? '',
                        fit: BoxFit.cover,
                        errorWidget: (_, __, ___) => Container(
                          color: AppColors.primaryFixed,
                          child: Center(
                            child: Text(
                              talent.name.isNotEmpty ? talent.name[0].toUpperCase() : '?',
                              style: tt.headlineSmall?.copyWith(
                                  color: AppColors.primary, fontWeight: FontWeight.w800),
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (talent.isVerified)
                    Positioned(
                      right: 0, bottom: 0,
                      child: Container(
                        width: 20, height: 20,
                        decoration: const BoxDecoration(
                            color: AppColors.primary, shape: BoxShape.circle),
                        child:
                            const Icon(Icons.check_rounded, color: Colors.white, size: 13),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 12),
              // Name / title / rating
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(talent.name,
                        style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                    if (talent.title.isNotEmpty)
                      Text(talent.title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: tt.labelMedium
                              ?.copyWith(color: AppColors.onSurfaceVariant)),
                    const SizedBox(height: 4),
                    Row(
                      children: [
                        const Icon(Icons.star_rounded,
                            color: AppColors.starRating, size: 18),
                        Text(' ${talent.averageRating.toStringAsFixed(1)}',
                            style: tt.labelMedium?.copyWith(fontWeight: FontWeight.w700)),
                        Text('  •  ', style: tt.labelMedium),
                        Text('₹${talent.hourlyRate}/hr',
                            style: tt.labelMedium?.copyWith(
                                color: AppColors.secondary, fontWeight: FontWeight.w800)),
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.bookmark_border_rounded, color: AppColors.outline),
            ],
          ),
          const SizedBox(height: 12),
          // Skill chips
          if (talent.skills.isNotEmpty)
            Wrap(
              spacing: 8, runSpacing: 8,
              children: talent.skills.take(4).map((s) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                      color: AppColors.surfaceContainer, borderRadius: AppRadius.fullR),
                  child: Text(s,
                      style: tt.labelSmall?.copyWith(
                          color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w600)),
                );
              }).toList(),
            ),
          const SizedBox(height: 14),
          // Actions
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.onSurface,
                    backgroundColor: AppColors.surfaceContainer,
                    side: BorderSide.none,
                    shape: RoundedRectangleBorder(borderRadius: AppRadius.fullR),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () => context.push('/messages'),
                  icon: const Icon(Icons.mail_outline_rounded, size: 18),
                  label: const Text('Message',
                      style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: AppRadius.fullR),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                  onPressed: () => context.push('/post'),
                  icon: const Icon(Icons.bolt_rounded, size: 18),
                  label: const Text('Hire', style: TextStyle(fontWeight: FontWeight.w800)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
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
            const Icon(Icons.wifi_off_rounded, size: 42, color: AppColors.outline),
            const SizedBox(height: 12),
            Text(message,
                textAlign: TextAlign.center,
                style: AppTypography.light.bodyLarge
                    ?.copyWith(color: AppColors.onSurfaceVariant)),
            const SizedBox(height: 16),
            OutlinedButton(
              onPressed: onRetry,
              style: OutlinedButton.styleFrom(
                foregroundColor: AppColors.primary,
                shape: RoundedRectangleBorder(borderRadius: AppRadius.fullR),
              ),
              child: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
