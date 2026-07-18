import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
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
import 'search_results_sheet.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

// Kept in sync with post_job_screen.dart's CATEGORIES.
const _kCategories = [
  (label: 'Electrician', icon: Icons.bolt_rounded, image: 'assets/images/categories/electrician.jpg'),
  (label: 'Plumber', icon: Icons.plumbing_rounded, image: 'assets/images/categories/plumber.jpg'),
  (label: 'AC Repair', icon: Icons.ac_unit_rounded, image: 'assets/images/categories/ac_repair.jpg'),
  (label: 'Painter', icon: Icons.format_paint_rounded, image: 'assets/images/categories/painter.jpg'),
  (label: 'Maid', icon: Icons.cleaning_services_rounded, image: 'assets/images/categories/maid.jpg'),
  (label: 'Cook', icon: Icons.restaurant_rounded, image: 'assets/images/categories/cook.jpg'),
  (label: 'Mechanic', icon: Icons.build_rounded, image: 'assets/images/categories/mechanic.jpg'),
];

class _HomeScreenState extends State<HomeScreen> {
  final _searchCtrl = TextEditingController();

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

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    context.read<NotificationsProvider>().fetchNotifications();
    context.read<ChatProvider>().fetchConversations();
    context.read<JobsProvider>().fetchMyJobs();

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

  void _submitSearch(String value) {
    final query = value.trim();
    if (query.isEmpty) return;
    showSearchResults(context, query);
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

    return Scaffold(
      appBar: const AppBarBrand(),
      body: SafeArea(
        top: false,
        child: RefreshIndicator(
          color: theme.colorScheme.primary,
          backgroundColor: theme.colorScheme.surface,
          onRefresh: _init,
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

              // Search bar
              TextField(
                controller: _searchCtrl,
                onSubmitted: _submitSearch,
                style: theme.textTheme.bodyMedium,
                decoration: InputDecoration(
                  hintText: 'Search for a service or worker…',
                  prefixIcon: Icon(Icons.search_rounded, color: tokens.muted),
                  suffixIcon: IconButton(
                    icon: Icon(Icons.arrow_forward_rounded, color: theme.colorScheme.primary),
                    onPressed: () => _submitSearch(_searchCtrl.text),
                  ),
                ),
              ),
              const SizedBox(height: AppSpace.xl),

              // Categories
              const SectionHeader(title: 'Categories'),
              const SizedBox(height: AppSpace.md),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _kCategories.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  mainAxisSpacing: AppSpace.md,
                  crossAxisSpacing: AppSpace.md,
                  childAspectRatio: 1.5,
                ),
                itemBuilder: (_, i) {
                  final cat = _kCategories[i];
                  return CategoryTile(
                    label: cat.label,
                    imagePath: cat.image,
                    fallbackIcon: cat.icon,
                    onTap: () => context.push('/post-job', extra: {'category': cat.label}),
                  );
                },
              ),
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
