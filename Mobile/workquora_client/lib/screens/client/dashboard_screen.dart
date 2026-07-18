import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/categories.dart';
import '../../core/providers/jobs_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bar_brand.dart';
import '../../widgets/app_card.dart';
import '../../widgets/section_header.dart';
import '../../widgets/shimmer_list.dart';
import '../../widgets/status_chip.dart';

/// Replaces the old bottom-nav "History" tab (which used to show
/// MyJobsScreen's raw job list directly). That list still exists — it's just
/// reachable from Profile → My Jobs now, not a tab of its own — while this
/// tab becomes a richer, dashboard-style summary: active job, quick stats,
/// recent activity, and a popular-services rail.
class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<JobsProvider>().fetchMyJobs());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final jobsProvider = context.watch<JobsProvider>();
    final allJobs = jobsProvider.myJobs.cast<Map>().toList();

    final activeJobs = allJobs.where((j) => j['status'] == 'in-progress').toList();
    final completedJobs = allJobs.where((j) => j['status'] == 'completed').toList();
    // Approximate — there's no wallet/transactions ledger anymore, so this
    // sums completed jobs' own budget field rather than claiming a precise
    // payments total.
    final spent = completedJobs.fold<num>(0, (sum, j) {
      final budget = j['budget'] ?? j['budgetRange']?['min'] ?? 0;
      return sum + (budget is num ? budget : num.tryParse(budget.toString()) ?? 0);
    });

    final recent = [...allJobs]..sort((a, b) {
      final ad = DateTime.tryParse(a['createdAt']?.toString() ?? '') ?? DateTime(2000);
      final bd = DateTime.tryParse(b['createdAt']?.toString() ?? '') ?? DateTime(2000);
      return bd.compareTo(ad);
    });
    final recentFive = recent.take(5).toList();

    return Scaffold(
      appBar: const AppBarBrand(),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          color: theme.colorScheme.primary,
          backgroundColor: theme.colorScheme.surface,
          onRefresh: () => context.read<JobsProvider>().fetchMyJobs(force: true),
          child: jobsProvider.isLoadingMyJobs && allJobs.isEmpty
              ? const ShimmerList()
              : ListView(
                  padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.md, AppSpace.lg, AppSpace.xl),
                  children: [
                    Text('Dashboard', style: theme.textTheme.headlineMedium),
                    const SizedBox(height: 4),
                    Text('Your activity at a glance', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
                    const SizedBox(height: AppSpace.xl),

                    if (activeJobs.isNotEmpty) ...[
                      _ActiveJobSummaryCard(job: activeJobs.first, count: activeJobs.length),
                      const SizedBox(height: AppSpace.xl),
                    ],

                    const SectionHeader(title: 'Quick Stats'),
                    const SizedBox(height: AppSpace.md),
                    SizedBox(
                      height: 96,
                      child: ListView(
                        scrollDirection: Axis.horizontal,
                        children: [
                          SizedBox(width: 110, child: _StatTile(label: 'Posted', value: '${allJobs.length}', icon: Icons.work_outline_rounded, highlighted: true)),
                          const SizedBox(width: AppSpace.sm),
                          SizedBox(width: 110, child: _StatTile(label: 'Completed', value: '${completedJobs.length}', icon: Icons.check_circle_outline_rounded)),
                          const SizedBox(width: AppSpace.sm),
                          SizedBox(width: 110, child: _StatTile(label: 'Spent', value: '₹${spent.toInt()}', icon: Icons.currency_rupee_rounded)),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpace.xl),

                    const SectionHeader(title: 'Recent Activity'),
                    const SizedBox(height: AppSpace.md),
                    if (recentFive.isEmpty)
                      Padding(
                        padding: const EdgeInsets.symmetric(vertical: AppSpace.xl),
                        child: Center(
                          child: Column(children: [
                            Text('No activity yet', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
                            const SizedBox(height: AppSpace.xs),
                            Text('Jobs you post will show up here', style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
                          ]),
                        ),
                      )
                    else
                      ...recentFive.map((job) {
                        final id = (job['_id'] ?? job['id'] ?? '').toString();
                        return Padding(
                          padding: const EdgeInsets.only(bottom: AppSpace.sm),
                          child: AppCard(
                            padding: const EdgeInsets.all(AppSpace.md),
                            onTap: id.isEmpty ? null : () => context.push('/job/$id'),
                            child: Row(children: [
                              Expanded(
                                child: Text(job['title']?.toString() ?? 'Job', maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodyMedium),
                              ),
                              const SizedBox(width: AppSpace.sm),
                              StatusChip.forJobStatus(context, job['status']?.toString() ?? ''),
                            ]),
                          ),
                        );
                      }),
                    const SizedBox(height: AppSpace.xl),

                    const SectionHeader(title: 'Popular Services'),
                    const SizedBox(height: AppSpace.md),
                    SizedBox(
                      height: 180,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: kCategories.length,
                        separatorBuilder: (_, __) => const SizedBox(width: AppSpace.md),
                        itemBuilder: (_, i) {
                          final cat = kCategories[i];
                          return SizedBox(
                            width: 140,
                            child: _PopularServiceCard(
                              label: cat.label,
                              imagePath: cat.image,
                              fallbackIcon: cat.icon,
                              onTap: () => context.push('/post-job', extra: {'category': cat.label}),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}

class _ActiveJobSummaryCard extends StatelessWidget {
  final Map job;
  final int count;
  const _ActiveJobSummaryCard({required this.job, required this.count});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final id = (job['_id'] ?? job['id'] ?? '').toString();

    return AppCard(
      onTap: id.isEmpty ? null : () => context.push('/job/$id/track'),
      child: Row(children: [
        Container(
          width: 44,
          height: 44,
          decoration: BoxDecoration(color: tokens.brandSoft, borderRadius: BorderRadius.circular(AppRadius.button)),
          child: Icon(Icons.near_me_rounded, color: theme.colorScheme.primary),
        ),
        const SizedBox(width: AppSpace.md),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('$count Active Job${count > 1 ? 's' : ''}', style: theme.textTheme.titleMedium),
            const SizedBox(height: 2),
            Text(job['title']?.toString() ?? '', maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
          ]),
        ),
        Icon(Icons.chevron_right_rounded, color: tokens.muted),
      ]),
    );
  }
}

class _StatTile extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final bool highlighted;
  const _StatTile({required this.label, required this.value, required this.icon, this.highlighted = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    if (!highlighted) {
      return AppCard(
        padding: const EdgeInsets.symmetric(vertical: AppSpace.md, horizontal: AppSpace.sm),
        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: theme.colorScheme.primary, size: 20),
          const SizedBox(height: AppSpace.xs),
          Text(value, style: theme.textTheme.titleMedium),
          const SizedBox(height: 2),
          Text(label, style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
        ]),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpace.md, horizontal: AppSpace.sm),
      decoration: BoxDecoration(
        color: theme.colorScheme.primary,
        borderRadius: BorderRadius.circular(AppRadius.card),
      ),
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, color: theme.colorScheme.onPrimary, size: 20),
        const SizedBox(height: AppSpace.xs),
        Text(value, style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.onPrimary)),
        const SizedBox(height: 2),
        Text(label, style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.onPrimary.withValues(alpha: 0.85))),
      ]),
    );
  }
}

class _PopularServiceCard extends StatelessWidget {
  final String label;
  final String imagePath;
  final IconData fallbackIcon;
  final VoidCallback onTap;
  const _PopularServiceCard({required this.label, required this.imagePath, required this.fallbackIcon, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: tokens.border, width: 0.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          AspectRatio(
            aspectRatio: 1.6,
            child: Image.asset(
              imagePath,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                color: tokens.brandSoft,
                child: Icon(fallbackIcon, color: theme.colorScheme.primary, size: 28),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpace.sm, AppSpace.sm, AppSpace.sm, AppSpace.xs),
            child: Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(AppSpace.sm, 0, AppSpace.sm, AppSpace.sm),
            child: InkWell(
              onTap: onTap,
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text('Book', style: theme.textTheme.labelSmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w700)),
                  const SizedBox(width: 2),
                  Icon(Icons.arrow_forward_rounded, size: 14, color: theme.colorScheme.primary),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
