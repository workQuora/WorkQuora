import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/jobs_provider.dart';
import '../../widgets/worker_card.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});
  @override State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  final _searchCtrl = TextEditingController();
  String _selected = 'All';
  final _filters = ['All', 'Plumber', 'Electrician', 'Painter', 'Carpenter', 'Cleaner', 'IT Help'];

  @override void initState() { super.initState(); WidgetsBinding.instance.addPostFrameCallback((_) => context.read<JobsProvider>().fetchNearbyWorkers()); }
  @override void dispose() { _searchCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final jobs = context.watch<JobsProvider>();
    final workers = jobs.nearbyWorkers.where((w) {
      final q = _searchCtrl.text.toLowerCase();
      final matchSearch = q.isEmpty || (w['name']?.toLowerCase().contains(q) ?? false) || (w['title']?.toLowerCase().contains(q) ?? false);
      final matchFilter = _selected == 'All' || (w['title']?.toString().contains(_selected) ?? false);
      return matchSearch && matchFilter;
    }).toList();

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(child: Column(children: [
        Padding(padding: const EdgeInsets.fromLTRB(20, 16, 20, 0), child: Row(children: [
          Expanded(child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
            child: Row(children: [
              const Icon(Icons.search, color: AppColors.textMuted, size: 18),
              const SizedBox(width: 8),
              Expanded(child: TextField(
                controller: _searchCtrl,
                style: const TextStyle(color: AppColors.text, fontSize: 14),
                decoration: const InputDecoration.collapsed(hintText: 'Search workers...', hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 14)),
                onChanged: (_) => setState(() {}),
              )),
            ]),
          )),
        ])),
        SizedBox(height: 50, child: ListView.builder(
          scrollDirection: Axis.horizontal, padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          itemCount: _filters.length,
          itemBuilder: (_, i) {
            final f = _filters[i]; final sel = f == _selected;
            return GestureDetector(
              onTap: () => setState(() => _selected = f),
              child: Container(
                margin: const EdgeInsets.only(right: 8),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                decoration: BoxDecoration(color: sel ? AppColors.primary : AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: sel ? AppColors.primary : AppColors.border)),
                child: Center(child: Text(f, style: TextStyle(color: sel ? Colors.white : AppColors.textMuted, fontSize: 13, fontWeight: sel ? FontWeight.bold : FontWeight.normal))),
              ),
            );
          },
        )),
        Padding(padding: const EdgeInsets.fromLTRB(20, 4, 20, 12), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
          Text('${workers.length} workers found', style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
          const Icon(Icons.tune, color: AppColors.textMuted, size: 20),
        ])),
        Expanded(child: jobs.isLoading
          ? ListView.builder(padding: const EdgeInsets.symmetric(horizontal: 20), itemCount: 6,
              itemBuilder: (_, __) => Padding(padding: const EdgeInsets.only(bottom: 12), child: Shimmer.fromColors(baseColor: AppColors.surface, highlightColor: AppColors.surfaceAlt,
                child: Container(height: 90, decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18))))))
          : workers.isEmpty
            ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.search_off, color: AppColors.textMuted, size: 56),
                SizedBox(height: 12),
                Text('No workers found', style: TextStyle(color: AppColors.textMuted, fontSize: 15)),
              ]))
            : ListView.builder(padding: const EdgeInsets.symmetric(horizontal: 20),
                itemCount: workers.length, itemBuilder: (_, i) => WorkerCard(worker: workers[i]))),
      ])),
    );
  }
}
