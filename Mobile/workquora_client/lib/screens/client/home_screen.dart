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

  // Horizontal scrolling row (was a 2-col GridView) — each card fixed at
  // 100px wide, with a "See all" tile pinned at the end that opens Post Job,
  // the only existing screen that already lists every category.
  Widget _buildCategorySection(BuildContext context, CategoriesProvider categoriesProvider) {
    if (categoriesProvider.isLoading && categoriesProvider.categories.isEmpty) {
      return SizedBox(
        height: 132,
        child: ListView.separated(
          scrollDirection: Axis.horizontal,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: 5,
          separatorBuilder: (_, __) => const SizedBox(width: AppSpace.md),
          itemBuilder: (_, __) => const SizedBox(width: 100, child: ShimmerList(count: 1, crossAxisCount: 1, padding: EdgeInsets.zero, shrinkWrap: true)),
        ),
      );
    }

    final useApi = categoriesProvider.categories.isNotEmpty;
    final count = useApi ? categoriesProvider.categories.length : kCategories.length;

    Widget tileFor(int i) {
      if (useApi) {
        final cat = categoriesProvider.categories[i];
        return CategoryTile(
          label: cat.name,
          imagePath: 'assets/images/categories/${cat.slug}.webp',
          imageUrl: cat.imageUrl,
          fallbackIcon: _kSlugIcons[cat.slug] ?? Icons.handyman_rounded,
          onTap: () => context.push('/post-job', extra: {'category': cat.name}),
        );
      }
      // Silent fallback — no error banner, just the local hardcoded list.
      final cat = kCategories[i];
      return CategoryTile(
        label: cat.label,
        imagePath: cat.image,
        fallbackIcon: cat.icon,
        onTap: () => context.push('/post-job', extra: {'category': cat.label}),
      );
    }

    return SizedBox(
      height: 132,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        itemCount: count + 1,
        separatorBuilder: (_, __) => const SizedBox(width: AppSpace.md),
        itemBuilder: (_, i) {
          if (i == count) {
            return SizedBox(
              width: 100,
              child: InkWell(
                borderRadius: BorderRadius.circular(AppRadius.card),
                onTap: () => context.push('/post-job'),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(color: Theme.of(context).extension<AppTokens>()!.brandSoft, shape: BoxShape.circle),
                    child: Icon(Icons.arrow_forward_rounded, color: Theme.of(context).colorScheme.primary),
                  ),
                  const SizedBox(height: AppSpace.sm),
                  Text('See all', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.primary, fontWeight: FontWeight.w600)),
                ]),
              ),
            );
          }
          return SizedBox(width: 100, child: tileFor(i));
        },
      ),
    );
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
    final workerPic = worker is Map ? (worker['profilePic'] ?? worker['avatar'])?.toString() ?? '' : '';

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
            const SizedBox(height: AppSpace.md),
            Row(
              children: [
                CircleAvatar(
                  radius: 16,
                  backgroundColor: tokens.brandSoft,
                  backgroundImage: workerPic.isNotEmpty ? ResizeImage(NetworkImage(workerPic), width: 96, height: 96) : null,
                  child: workerPic.isEmpty
                      ? Text(workerName.isNotEmpty ? workerName[0].toUpperCase() : 'W',
                          style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 12))
                      : null,
                ),
                const SizedBox(width: AppSpace.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(workerName, style: theme.textTheme.labelSmall, maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text('Technician is on the way', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted), maxLines: 1, overflow: TextOverflow.ellipsis),
                    ],
                  ),
                ),
              ],
            ),
          ],
          const SizedBox(height: AppSpace.md),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: id.isEmpty ? null : () => context.push('/job/$id/track'),
              icon: const Icon(Icons.near_me_rounded, size: 16),
              label: const Text('Track Live'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: AppSpace.sm),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.button)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
