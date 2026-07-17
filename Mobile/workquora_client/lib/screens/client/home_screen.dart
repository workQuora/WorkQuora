import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/utils/location_picker.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  // Phase A: client home is service-category based. Kept in sync with
  // post_job_screen.dart's category list.
  final _categories = [
    {'icon': '⚡', 'label': 'Electrician'},
    {'icon': '🔧', 'label': 'Plumber'},
    {'icon': '❄️', 'label': 'AC Repair'},
    {'icon': '🎨', 'label': 'Painter'},
    {'icon': '🧹', 'label': 'Maid'},
    {'icon': '🍳', 'label': 'Cook'},
    {'icon': '🔩', 'label': 'Mechanic'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      if (!mounted) return;

      // If GPS permission was already granted in a previous session, resume
      // background tracking immediately without re-prompting.
      if (!kIsWeb) {
        final permission = await Geolocator.checkPermission();
        if (!mounted) return;
        if (permission == LocationPermission.always || permission == LocationPermission.whileInUse) {
          context.read<JobsProvider>().startLocationTracking();
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth  = context.watch<AuthProvider>();
    final jobs  = context.watch<JobsProvider>();

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary, backgroundColor: AppColors.surface,
          onRefresh: () => context.read<JobsProvider>().fetchNearbyWorkers(),
          child: CustomScrollView(slivers: [
            SliverToBoxAdapter(child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  GestureDetector(
                    onTap: () => showLocationPicker(context),
                    child: Row(children: [
                      Icon(Icons.location_on, color: AppColors.primary, size: 16),
                      const SizedBox(width: 4),
                      Text(jobs.locationLabel, style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                      Icon(Icons.keyboard_arrow_down, color: AppColors.textMuted, size: 18),
                    ]),
                  ),
                ])),
                IconButton(
                  icon: Icon(Icons.work_outline, color: AppColors.text),
                  onPressed: () => context.push('/my-jobs'),
                ),
                IconButton(
                  icon: Icon(Icons.notifications_outlined, color: AppColors.text),
                  onPressed: () => context.push('/notifications'),
                ),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () => context.go('/profile'),
                  child: Container(width: 44, height: 44,
                    decoration: BoxDecoration(gradient: LinearGradient(colors: [AppColors.primary, Color(0xFF8B5CF6)]), borderRadius: BorderRadius.circular(12)),
                    child: Center(child: Text((auth.user?['name'] ?? 'U')[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18))),
                  ),
                ),
              ]),
            )),
            SliverToBoxAdapter(child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: Text('What do you need help with today?', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
            )),
            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 20),
              sliver: SliverGrid(
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 0.95,
                ),
                delegate: SliverChildBuilderDelegate(
                  (_, i) {
                    final cat = _categories[i];
                    return GestureDetector(
                      onTap: () => context.push('/post-job', extra: {'category': cat['label']}),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Text(cat['icon']!, style: const TextStyle(fontSize: 28)),
                          const SizedBox(height: 8),
                          Text(
                            cat['label']!,
                            textAlign: TextAlign.center,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: AppColors.text, fontSize: 12, fontWeight: FontWeight.w600),
                          ),
                        ]),
                      ),
                    );
                  },
                  childCount: _categories.length,
                ),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}
