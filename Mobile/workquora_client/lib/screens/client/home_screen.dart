import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/jobs_provider.dart';
import '../../widgets/worker_card.dart';
import 'package:shimmer/shimmer.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});
  @override State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _categories = [
    {'icon': '🔧', 'label': 'Plumber'},
    {'icon': '⚡', 'label': 'Electrician'},
    {'icon': '🎨', 'label': 'Painter'},
    {'icon': '🪛', 'label': 'Carpenter'},
    {'icon': '🌿', 'label': 'Gardener'},
    {'icon': '🚿', 'label': 'Cleaner'},
    {'icon': '💡', 'label': 'AC Repair'},
    {'icon': '💻', 'label': 'IT Help'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<JobsProvider>().fetchNearbyWorkers());
  }

  @override
  Widget build(BuildContext context) {
    final auth  = context.watch<AuthProvider>();
    final jobs  = context.watch<JobsProvider>();
    final name  = auth.user?['name']?.toString().split(' ').first ?? 'there';

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
                  Row(children: [
                    const Icon(Icons.location_on, color: AppColors.primary, size: 16),
                    const SizedBox(width: 4),
                    const Text('New Delhi', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                    const Icon(Icons.arrow_drop_down, color: AppColors.textMuted, size: 18),
                  ]),
                  const SizedBox(height: 2),
                  Text('Hi $name 👋', style: const TextStyle(color: AppColors.text, fontSize: 22, fontWeight: FontWeight.w900)),
                ])),
                IconButton(
                  icon: const Icon(Icons.notifications_outlined, color: AppColors.text),
                  onPressed: () => context.push('/notifications'),
                ),
                const SizedBox(width: 4),
                GestureDetector(
                  onTap: () => context.go('/profile'),
                  child: Container(width: 44, height: 44,
                    decoration: BoxDecoration(gradient: const LinearGradient(colors: [AppColors.primary, Color(0xFF8B5CF6)]), borderRadius: BorderRadius.circular(12)),
                    child: Center(child: Text((auth.user?['name'] ?? 'U')[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18))),
                  ),
                ),
              ]),
            )),
            SliverToBoxAdapter(child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: GestureDetector(
                onTap: () => context.go('/discover'),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                  child: const Row(children: [
                    Icon(Icons.search, color: AppColors.textMuted, size: 20),
                    SizedBox(width: 10),
                    Text('Search workers, skills...', style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
                  ]),
                ),
              ),
            )),
            SliverToBoxAdapter(child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
              child: GestureDetector(
                onTap: () => context.go('/post-job'),
                child: Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withOpacity(0.7)]),
                    borderRadius: BorderRadius.circular(18),
                  ),
                  child: const Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Need a worker?', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 17)),
                      SizedBox(height: 3),
                      Text('Post a job — get bids in minutes', style: TextStyle(color: Colors.white70, fontSize: 12)),
                    ])),
                    Icon(Icons.arrow_forward_ios, color: Colors.white, size: 16),
                  ]),
                ),
              ),
            )),
            SliverToBoxAdapter(child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 0),
              child: const Text('Categories', style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
            )),
            SliverToBoxAdapter(child: SizedBox(
              height: 90,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                itemCount: _categories.length,
                itemBuilder: (_, i) {
                  final cat = _categories[i];
                  return GestureDetector(
                    onTap: () => context.go('/discover'),
                    child: Container(
                      margin: const EdgeInsets.only(right: 12),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                        Text(cat['icon']!, style: const TextStyle(fontSize: 22)),
                        const SizedBox(height: 4),
                        Text(cat['label']!, style: const TextStyle(color: AppColors.text, fontSize: 11, fontWeight: FontWeight.w600)),
                      ]),
                    ),
                  );
                },
              ),
            )),
            SliverToBoxAdapter(child: Padding(
              padding: const EdgeInsets.fromLTRB(20, 22, 20, 12),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Nearby Workers', style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
                GestureDetector(onTap: () => context.go('/discover'), child: const Text('See all', style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600))),
              ]),
            )),
            jobs.isLoading
              ? SliverList(delegate: SliverChildBuilderDelegate((_, i) => Padding(
                  padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                  child: Shimmer.fromColors(
                    baseColor: AppColors.surface, highlightColor: AppColors.surfaceAlt,
                    child: Container(height: 90, decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18))),
                  )), childCount: 5))
              : jobs.nearbyWorkers.isEmpty
                ? SliverToBoxAdapter(child: Padding(
                    padding: const EdgeInsets.all(40),
                    child: Column(children: [
                      const Icon(Icons.people_outline, color: AppColors.textMuted, size: 56),
                      const SizedBox(height: 12),
                      const Text('No workers nearby', style: TextStyle(color: AppColors.textMuted, fontSize: 15)),
                      const SizedBox(height: 6),
                      Text('Try increasing search radius', style: TextStyle(color: AppColors.textMuted.withOpacity(0.6), fontSize: 12)),
                    ]),
                  ))
                : SliverPadding(
                    padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                    sliver: SliverList(delegate: SliverChildBuilderDelegate(
                      (_, i) => WorkerCard(worker: jobs.nearbyWorkers[i]),
                      childCount: jobs.nearbyWorkers.length,
                    )),
                  ),
          ]),
        ),
      ),
    );
  }
}
