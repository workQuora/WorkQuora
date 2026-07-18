import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/categories.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/categories_provider.dart';
import '../../core/providers/chat_provider.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/providers/notifications_provider.dart';
import '../../core/utils/location_picker.dart' show showLocationPicker;
import '../../core/utils/mobile_location.dart' if (dart.library.html) '../../core/utils/web_location.dart';
import '../../core/utils/reverse_geocode.dart';
import '../../theme/app_theme.dart';
import '../../widgets/app_bar_brand.dart';
import '../../widgets/app_card.dart';
import '../../widgets/category_tile.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/section_header.dart';
import '../../widgets/shimmer_list.dart';
import '../../widgets/status_chip.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  String? _areaName;
  double? _geocodedLat;
  double? _geocodedLng;
  bool _locationUnavailable = false;
  bool _locating = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  Future<void> _init({bool force = false}) async {
    context.read<NotificationsProvider>().fetchNotifications(force: force);
    context.read<ChatProvider>().fetchConversations(force: force);
    context.read<JobsProvider>().fetchMyJobs(force: force);
    context.read<CategoriesProvider>().fetchCategories(force: force);

    final pos = await getPlatformLocation();
    if (!mounted) return;
    if (pos == null) {
      // Permission denied / GPS off — degrade gracefully, don't crash. The
      // location header shows a tappable "Enable location" prompt instead.
      setState(() { _locationUnavailable = true; _locating = false; });
      return;
    }
    await context.read<JobsProvider>().setLocation(pos['lat']!, pos['lng']!, 'Current Location');
    if (!mounted) return;
    context.read<JobsProvider>().startLocationTracking();
    setState(() => _locating = false);
  }

  // Re-reverse-geocodes only when the coordinates actually change, so a
  // rebuild from unrelated provider updates doesn't refire the network call.
  void _maybeReverseGeocode(double lat, double lng) {
    if (_geocodedLat == lat && _geocodedLng == lng) return;
    _geocodedLat = lat;
    _geocodedLng = lng;
    reverseGeocode(lat, lng).then((name) {
      if (!mounted || _geocodedLat != lat || _geocodedLng != lng) return;
      setState(() => _areaName = name);
    });
  }

  Future<void> _retryLocation() async {
    setState(() { _locationUnavailable = false; _locating = true; });
    await showLocationPicker(context);
    if (!mounted) return;
    setState(() => _locating = false);
  }

  // No per-category icon comes from the API — used only as CategoryTile's
  // last-resort fallback if both the network image and the local
  // assets/images/categories/{slug}.webp fallback fail to load.
  static const _kSlugIcons = {
    'ac_repair': Icons.ac_unit_rounded,
    'painter': Icons.format_paint_rounded,
    'labour': Icons.engineering_rounded,
    'plumber': Icons.plumbing_rounded,
    'maid': Icons.cleaning_services_rounded,
    'electrician': Icons.bolt_rounded,
    'mechanic': Icons.build_rounded,
    'raj_mistri': Icons.construction_rounded,
    'cook': Icons.restaurant_rounded,
  };

  Widget _buildCategorySection(BuildContext context, CategoriesProvider categoriesProvider) {
    if (categoriesProvider.isLoading && categoriesProvider.categories.isEmpty) {
      return const ShimmerList(count: 6, crossAxisCount: 2, padding: EdgeInsets.zero, shrinkWrap: true);
    }
    if (categoriesProvider.categories.isNotEmpty) {
      return _buildCategoryGrid(
        count: categoriesProvider.categories.length,
        tileBuilder: (i) {
          final cat = categoriesProvider.categories[i];
          return CategoryTile(
            label: cat.name,
            imagePath: 'assets/images/categories/${cat.slug}.webp',
            imageUrl: cat.imageUrl,
            fallbackIcon: _kSlugIcons[cat.slug] ?? Icons.handyman_rounded,
            onTap: () => context.push('/post-job', extra: {'category': cat.name}),
          );
        },
      );
    }
    // Silent fallback — no error banner, just the local hardcoded list.
    return _buildCategoryGrid(
      count: kCategories.length,
      tileBuilder: (i) {
        final cat = kCategories[i];
        return CategoryTile(
          label: cat.label,
          imagePath: cat.image,
          fallbackIcon: cat.icon,
          onTap: () => context.push('/post-job', extra: {'category': cat.label}),
        );
      },
    );
  }

  // Shared 2-column grid for both the API-driven and local-fallback category
  // lists. An odd item count leaves its last tile centered full-width in
  // its own row instead of stranded in the grid's left cell.
  Widget _buildCategoryGrid({required int count, required Widget Function(int) tileBuilder}) {
    final isOdd = count.isOdd;
    final gridCount = isOdd ? count - 1 : count;
    return Column(children: [
      GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: gridCount,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 2,
          mainAxisSpacing: AppSpace.md,
          crossAxisSpacing: AppSpace.md,
          childAspectRatio: 1.5,
        ),
        itemBuilder: (_, i) => tileBuilder(i),
      ),
      if (isOdd)
        Padding(
          padding: const EdgeInsets.only(top: AppSpace.md),
          child: LayoutBuilder(
            builder: (context, constraints) {
              final tileWidth = (constraints.maxWidth - AppSpace.md) / 2;
              return Center(
                child: SizedBox(
                  width: tileWidth,
                  height: tileWidth / 1.5,
                  child: tileBuilder(count - 1),
                ),
              );
            },
          ),
        ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final auth = context.watch<AuthProvider>();
    final jobs = context.watch<JobsProvider>();
    final user = auth.user ?? {};
    final name = (user['name'] ?? 'there').toString().split(' ').first;

    if (!_locationUnavailable && !_locating) {
      _maybeReverseGeocode(jobs.currentLat, jobs.currentLng);
    }
    final locationLabel = _locationUnavailable
        ? 'Enable location'
        : _locating
            ? 'Locating…'
            : (_areaName ?? jobs.locationLabel);

    final activeJobs = jobs.myJobs.where((j) => j['status'] == 'in-progress').toList();
    final categoriesProvider = context.watch<CategoriesProvider>();

    return Scaffold(
      appBar: const AppBarBrand(),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          color: theme.colorScheme.primary,
          backgroundColor: theme.colorScheme.surface,
          onRefresh: () => _init(force: true),
          child: ListView(
            padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.md, AppSpace.lg, AppSpace.xl),
            children: [
              // Location header
              GestureDetector(
                onTap: _locationUnavailable ? _retryLocation : () => showLocationPicker(context),
                child: Row(
                  children: [
                    Icon(
                      _locationUnavailable ? Icons.location_off_rounded : Icons.location_on_rounded,
                      color: _locationUnavailable ? tokens.warning : theme.colorScheme.primary,
                      size: 18,
                    ),
                    const SizedBox(width: AppSpace.xs),
                    Flexible(
                      child: Text(
                        locationLabel,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: _locationUnavailable ? tokens.warning : tokens.muted,
                        ),
                      ),
                    ),
                    Icon(Icons.keyboard_arrow_down_rounded, color: tokens.muted, size: 18),
                  ],
                ),
              ),
              const SizedBox(height: AppSpace.lg),

              // Greeting
              Text('Hi, $name', style: theme.textTheme.headlineMedium),
              const SizedBox(height: 4),
              Text("What do you need help with today?", style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
              const SizedBox(height: AppSpace.xl),

              // Categories
              const SectionHeader(title: 'Categories'),
              const SizedBox(height: AppSpace.md),
              _buildCategorySection(context, categoriesProvider),
              const SizedBox(height: AppSpace.xl),

              // Active jobs
              if (jobs.isLoadingMyJobs && jobs.myJobs.isEmpty) ...[
                const SectionHeader(title: 'Active Jobs'),
                const SizedBox(height: AppSpace.md),
                const SizedBox(height: 180, child: ShimmerList(count: 2, itemHeight: 84, padding: EdgeInsets.zero, shrinkWrap: true)),
                const SizedBox(height: AppSpace.sm),
              ] else if (activeJobs.isNotEmpty) ...[
                SectionHeader(title: 'Active Job${activeJobs.length > 1 ? 's' : ''}'),
                const SizedBox(height: AppSpace.md),
                ...activeJobs.map((job) => Padding(
                      padding: const EdgeInsets.only(bottom: AppSpace.md),
                      child: _ActiveJobCard(job: Map<String, dynamic>.from(job)),
                    )),
                const SizedBox(height: AppSpace.sm),
              ],

              // Primary CTA
              PrimaryButton(
                label: 'Post a job',
                icon: Icons.add_rounded,
                onPressed: () => context.push('/post-job'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ActiveJobCard extends StatelessWidget {
  final Map<String, dynamic> job;
  const _ActiveJobCard({required this.job});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final title = job['title']?.toString() ?? 'Job';
    final status = job['status']?.toString() ?? 'in-progress';
    final id = (job['_id'] ?? job['id'] ?? '').toString();
    // Populated worker info isn't guaranteed on the my-jobs list payload —
    // show it when present, skip the row entirely rather than fake it.
    final worker = job['assignedFreelancerInfo'] ?? job['freelancerInfo'] ?? job['hiredFreelancerInfo'];
    final workerName = worker is Map ? worker['name']?.toString() : null;

    return AppCard(
      onTap: id.isEmpty ? null : () => context.push('/job/$id/track'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(title, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
              ),
              const SizedBox(width: AppSpace.sm),
              StatusChip.forJobStatus(context, status),
            ],
          ),
          if (workerName != null) ...[
            const SizedBox(height: AppSpace.sm),
            Row(
              children: [
                Icon(Icons.person_outline_rounded, size: 16, color: tokens.muted),
                const SizedBox(width: AppSpace.xs),
                Text(workerName, style: theme.textTheme.labelSmall),
              ],
            ),
          ],
          const SizedBox(height: AppSpace.sm),
          Row(
            children: [
              Icon(Icons.near_me_rounded, size: 14, color: theme.colorScheme.primary),
              const SizedBox(width: 4),
              Text('Track live', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary)),
            ],
          ),
        ],
      ),
    );
  }
}
