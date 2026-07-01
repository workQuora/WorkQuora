import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shimmer/shimmer.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../application/discover_controller.dart';
import '../widgets/category_chip.dart';
import '../widgets/talent_card.dart';
import '../../data/models/talent_model.dart';

class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  final _searchController = TextEditingController();
  final _scrollController = ScrollController();
  
  // Custom filter states
  double selectedRadius = 999; // 999 = Any distance
  String selectedRate = 'All'; // 'All', 'under_25', '25_50', 'over_50'
  bool isSearching = false;

  final List<String> recentSearches = ['UI/UX Designer', 'Flutter Developer', 'React Expert', 'SEO Manager'];
  final List<String> trendingSuggestions = ['Dart', 'Figma', 'NodeJS', 'Copywriting', 'AI Engineer'];

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
    _searchController.addListener(_onSearchTextChanged);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 300) {
      ref.read(discoverControllerProvider.notifier).loadMore();
    }
  }

  void _onSearchTextChanged() {
    setState(() {
      isSearching = _searchController.text.isNotEmpty;
    });
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    _searchController.removeListener(_onSearchTextChanged);
    _searchController.dispose();
    super.dispose();
  }

  List<TalentModel> _applyFilters(List<TalentModel> talents) {
    return talents.where((t) {
      // 1. Distance filter
      if (selectedRadius != 999 && t.distance > selectedRadius) {
        return false;
      }
      // 2. Hourly rate filter
      if (selectedRate == 'under_25' && t.hourlyRate >= 25) {
        return false;
      } else if (selectedRate == '25_50' && (t.hourlyRate < 25 || t.hourlyRate > 50)) {
        return false;
      } else if (selectedRate == 'over_50' && t.hourlyRate <= 50) {
        return false;
      }
      return true;
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(discoverControllerProvider);
    final textTheme = AppTypography.light;

    // Apply distance and rate filters
    final filteredResults = _applyFilters(state.allResults);
    final visibleResults = filteredResults.take(state.visibleCount).toList();
    final canLoadMore = state.visibleCount < filteredResults.length;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => ref.read(discoverControllerProvider.notifier).refresh(),
          child: CustomScrollView(
            controller: _scrollController,
            slivers: [
              // Header & Search box
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.containerMargin,
                    16,
                    AppSpacing.containerMargin,
                    AppSpacing.stackMd,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Discover Elite Talent',
                        style: textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: AppColors.onSurface,
                        ),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        "Connect with the world's most distinguished independent professionals for your high-impact projects.",
                        style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
                      ),
                      const SizedBox(height: AppSpacing.stackLg),
                      // Pill search bar
                      Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: AppRadius.fullR,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.03),
                              blurRadius: 8,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: TextField(
                          controller: _searchController,
                          onChanged: (value) => ref.read(discoverControllerProvider.notifier).setKeyword(value),
                          style: textTheme.bodyLarge,
                          decoration: InputDecoration(
                            hintText: 'Search expertise, skills, or roles...',
                            hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                            prefixIcon: const Icon(Icons.search_rounded, color: AppColors.primary),
                            suffixIcon: _searchController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear_rounded, color: AppColors.outline),
                                    onPressed: () {
                                      _searchController.clear();
                                      ref.read(discoverControllerProvider.notifier).setKeyword('');
                                    },
                                  )
                                : const Icon(Icons.mic_none_rounded, color: AppColors.outline),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                            border: InputBorder.none,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),

              // Filter Chips Row
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 38,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                    children: [
                      // Distance Filter
                      _buildFilterChip(
                        label: selectedRadius == 999 ? 'Location: Any' : 'Location: Within ${selectedRadius.toInt()}km',
                        isActive: selectedRadius != 999,
                        onTap: _showLocationFilterSheet,
                      ),
                      const SizedBox(width: 8),
                      // Rate Filter
                      _buildFilterChip(
                        label: selectedRate == 'All'
                            ? 'Hourly Rate'
                            : selectedRate == 'under_25'
                                ? 'Rate: Under \$25/hr'
                                : selectedRate == '25_50'
                                    ? 'Rate: \$25-\$50/hr'
                                    : 'Rate: \$50+/hr',
                        isActive: selectedRate != 'All',
                        onTap: _showRateFilterSheet,
                      ),
                    ],
                  ),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.stackMd)),

              // Horizontal Category Chips
              SliverToBoxAdapter(
                child: CategoryChipRow(
                  selected: state.category,
                  onSelected: (c) => ref.read(discoverControllerProvider.notifier).setCategory(c),
                ),
              ),
              const SliverToBoxAdapter(child: SizedBox(height: AppSpacing.stackMd)),

              // Search results view / empty screens
              ..._buildBody(state, visibleResults, canLoadMore),
              const SliverToBoxAdapter(child: SizedBox(height: 24)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFilterChip({required String label, required bool isActive, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      borderRadius: AppRadius.fullR,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isActive ? AppColors.primary.withOpacity(0.08) : Colors.white,
          borderRadius: AppRadius.fullR,
          border: Border.all(
            color: isActive ? AppColors.primary : AppColors.outlineVariant.withOpacity(0.4),
            width: isActive ? 1.5 : 1.0,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: AppTypography.light.labelSmall?.copyWith(
                color: isActive ? AppColors.primary : AppColors.onSurfaceVariant,
                fontWeight: isActive ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
            const SizedBox(width: 4),
            Icon(
              Icons.keyboard_arrow_down_rounded,
              size: 14,
              color: isActive ? AppColors.primary : AppColors.outline,
            ),
          ],
        ),
      ),
    );
  }

  void _showLocationFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(AppSpacing.cardPadding),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Filter by Distance', style: AppTypography.light.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 16),
                  _buildRadioOption(setModalState, 'Any Distance', 999.0, selectedRadius),
                  _buildRadioOption(setModalState, 'Within 10 km', 10.0, selectedRadius),
                  _buildRadioOption(setModalState, 'Within 25 km', 25.0, selectedRadius),
                  _buildRadioOption(setModalState, 'Within 50 km', 50.0, selectedRadius),
                  const SizedBox(height: 20),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildRadioOption(StateSetter setModalState, String label, double value, double current) {
    return RadioListTile<double>(
      title: Text(label, style: AppTypography.light.bodyMedium),
      value: value,
      groupValue: current,
      activeColor: AppColors.primary,
      onChanged: (val) {
        if (val != null) {
          setModalState(() {
            selectedRadius = val;
          });
          setState(() {
            selectedRadius = val;
          });
          Navigator.pop(context);
        }
      },
    );
  }

  void _showRateFilterSheet() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: const EdgeInsets.all(AppSpacing.cardPadding),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Filter by Hourly Rate', style: AppTypography.light.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                  const SizedBox(height: 16),
                  _buildRateRadioOption(setModalState, 'All Rates', 'All', selectedRate),
                  _buildRateRadioOption(setModalState, 'Under \$25 / hr', 'under_25', selectedRate),
                  _buildRateRadioOption(setModalState, '\$25 - \$50 / hr', '25_50', selectedRate),
                  _buildRateRadioOption(setModalState, 'Over \$50 / hr', 'over_50', selectedRate),
                  const SizedBox(height: 20),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildRateRadioOption(StateSetter setModalState, String label, String value, String current) {
    return RadioListTile<String>(
      title: Text(label, style: AppTypography.light.bodyMedium),
      value: value,
      groupValue: current,
      activeColor: AppColors.primary,
      onChanged: (val) {
        if (val != null) {
          setModalState(() {
            selectedRate = val;
          });
          setState(() {
            selectedRate = val;
          });
          Navigator.pop(context);
        }
      },
    );
  }

  List<Widget> _buildBody(DiscoverState state, List<TalentModel> visibleResults, bool canLoadMore) {
    if (state.isLocating) {
      return [const SliverFillRemaining(hasScrollBody: false, child: _CenteredMessage(message: 'Finding talent near you…'))];
    }

    if (state.error != null && state.allResults.isEmpty) {
      return [
        SliverFillRemaining(
          hasScrollBody: false,
          child: _ErrorState(
            message: state.error!.message,
            onRetry: () => state.hasLocation
                ? ref.read(discoverControllerProvider.notifier).refresh()
                : ref.read(discoverControllerProvider.notifier).retryLocation(),
          ),
        ),
      ];
    }

    // Default or focused empty search state: show recent & trending searches
    if (!isSearching && state.allResults.isEmpty && !state.isLoading) {
      return [
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.containerMargin),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Recent Searches
                Text('Recent Searches', style: AppTypography.light.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 10),
                ...recentSearches.map((s) => ListTile(
                      leading: const Icon(Icons.history_rounded, color: AppColors.outline),
                      title: Text(s, style: AppTypography.light.bodyMedium),
                      trailing: const Icon(Icons.arrow_outward_rounded, size: 16, color: AppColors.outline),
                      onTap: () {
                        _searchController.text = s;
                        ref.read(discoverControllerProvider.notifier).setKeyword(s);
                      },
                    )),
                const SizedBox(height: AppSpacing.stackLg),

                // Trending Suggestions
                Text('Trending Suggestions', style: AppTypography.light.titleLarge?.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: trendingSuggestions.map((s) {
                    return ActionChip(
                      label: Text(s),
                      labelStyle: AppTypography.light.labelSmall?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700),
                      backgroundColor: AppColors.primary.withOpacity(0.05),
                      shape: RoundedRectangleBorder(borderRadius: AppRadius.fullR, side: BorderSide(color: AppColors.primary.withOpacity(0.2))),
                      onPressed: () {
                        _searchController.text = s;
                        ref.read(discoverControllerProvider.notifier).setKeyword(s);
                      },
                    );
                  }).toList(),
                ),
                const SizedBox(height: AppSpacing.stackLg),
                
                // Agency team card
                _buildAgencyTeamCard(),
              ],
            ),
          ),
        )
      ];
    }

    if (state.isLoading && state.allResults.isEmpty) {
      return [
        SliverPadding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
          sliver: SliverList.separated(
            itemCount: 4,
            separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.stackMd),
            itemBuilder: (context, index) => const _TalentCardShimmer(),
          ),
        ),
      ];
    }

    if (visibleResults.isEmpty) {
      return [
        const SliverFillRemaining(
          hasScrollBody: false,
          child: _CenteredMessage(message: 'No talent found nearby matching your filters.\nTry adjusting your filters or search category.'),
        ),
      ];
    }

    return [
      SliverPadding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
        sliver: SliverList.separated(
          itemCount: visibleResults.length + (canLoadMore ? 1 : 0) + 1, // Add 1 for the team banner at the end
          separatorBuilder: (_, __) => const SizedBox(height: AppSpacing.stackMd),
          itemBuilder: (context, index) {
            if (index == visibleResults.length + (canLoadMore ? 1 : 0)) {
              // Specialized squad card at the bottom of results list
              return Padding(
                padding: const EdgeInsets.only(top: 8, bottom: 16),
                child: _buildAgencyTeamCard(),
              );
            }
            if (index >= visibleResults.length) {
              return const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Center(child: CircularProgressIndicator(strokeWidth: 2.4)),
              );
            }
            final talent = visibleResults[index];
            return TalentCard(
              talent: talent,
              onTap: () => context.push('/discover/${talent.id}'),
              onMessage: () => context.push('/messages'),
              onHire: () => context.push('/discover/${talent.id}'),
            );
          },
        ),
      ),
    ];
  }

  Widget _buildAgencyTeamCard() {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.onSurface, Color(0xFF2E3132)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.secondary.withOpacity(0.2),
                  borderRadius: AppRadius.mdR,
                ),
                child: Row(
                  children: [
                    const Icon(Icons.groups_rounded, size: 14, color: AppColors.secondaryContainer),
                    const SizedBox(width: 4),
                    Text(
                      'SQUAD LEAGUE',
                      style: AppTypography.textTheme(AppColors.secondaryContainer).labelSmall?.copyWith(
                            fontWeight: FontWeight.w800,
                          ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            'Need a specialized team?',
            style: AppTypography.textTheme(Colors.white).titleLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Hire pre-vetted agency teams or assemble custom squads for large-scale operations in just a few clicks.',
            style: AppTypography.textTheme(Colors.white.withOpacity(0.7)).bodyMedium?.copyWith(
                  height: 1.3,
                ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 38,
            child: ElevatedButton(
              onPressed: () async {
                final uri = Uri.parse('mailto:support@workquora.com?subject=Agency%20Recruitment%20Request');
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.onPrimary,
                shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                elevation: 0,
              ),
              child: Text(
                'Contact Agency Recruiter',
                style: AppTypography.textTheme(AppColors.onPrimary).labelMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _CenteredMessage extends StatelessWidget {
  const _CenteredMessage({required this.message});
  final String message;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Text(
          message,
          textAlign: TextAlign.center,
          style: AppTypography.light.bodyLarge?.copyWith(color: AppColors.onSurfaceVariant),
        ),
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
            const Icon(Icons.wifi_off_rounded, size: 40, color: AppColors.outline),
            const SizedBox(height: AppSpacing.stackMd),
            Text(message, textAlign: TextAlign.center, style: AppTypography.light.bodyLarge),
            const SizedBox(height: AppSpacing.stackMd),
            OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
          ],
        ),
      ),
    );
  }
}

class _TalentCardShimmer extends StatelessWidget {
  const _TalentCardShimmer();

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceContainer,
      highlightColor: AppColors.surfaceContainerLow,
      child: Container(
        height: 168,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
        ),
      ),
    );
  }
}
