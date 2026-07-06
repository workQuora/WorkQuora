import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/tasks_provider.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});
  @override State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;

  @override void initState() { super.initState(); _tabs = TabController(length: 2, vsync: this); WidgetsBinding.instance.addPostFrameCallback((_) { context.read<TasksProvider>().fetchMyTasks(); context.read<TasksProvider>().fetchNearbyJobs(); }); }
  @override void dispose() { _tabs.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final tasks = context.watch<TasksProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Jobs'),
        backgroundColor: AppColors.background,
        elevation: 0,
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
          tabs: const [Tab(text: 'Nearby Jobs'), Tab(text: 'My Tasks')],
        ),
      ),
      body: TabBarView(controller: _tabs, children: [
        // Nearby Jobs
        tasks.isLoading
          ? _skeleton()
          : tasks.nearbyJobs.isEmpty
            ?  Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.location_off, color: AppColors.textSecondary, size: 48), SizedBox(height: 12), Text('No jobs nearby', style: TextStyle(color: AppColors.textSecondary))]))
            : ListView.builder(padding: const EdgeInsets.all(16), itemCount: tasks.nearbyJobs.length,
                itemBuilder: (_, i) {
                  final job = tasks.nearbyJobs[i];
                  return Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                        Expanded(child: Text(job['title'] ?? 'Job', style:  TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15), overflow: TextOverflow.ellipsis)),
                        Text('₹${job['budgetFixed'] ?? job['budgetMin'] ?? 0}', style:  TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 16)),
                      ]),
                      const SizedBox(height: 6),
                      Text(job['description'] ?? '', style:  TextStyle(color: AppColors.textSecondary, fontSize: 13), maxLines: 2, overflow: TextOverflow.ellipsis),
                      const SizedBox(height: 10),
                      Row(children: [
                        Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                          child: Text(job['category'] ?? '', style:  TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold))),
                        const Spacer(),
                        ElevatedButton(onPressed: () => ScaffoldMessenger.of(context).showSnackBar( SnackBar(content: Text('Applied! ✅'), backgroundColor: AppColors.success)),
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)), elevation: 0),
                          child: const Text('Apply', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12))),
                      ]),
                    ]));
                }),

        // My Tasks
        tasks.isLoading
          ? _skeleton()
          : tasks.tasks.isEmpty
            ?  Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.work_off_outlined, color: AppColors.textSecondary, size: 48), SizedBox(height: 12), Text('No tasks yet', style: TextStyle(color: AppColors.textSecondary)), SizedBox(height: 6), Text('Accept nearby jobs to see them here', style: TextStyle(color: AppColors.textSecondary, fontSize: 12))]))
            : ListView.builder(padding: const EdgeInsets.all(16), itemCount: tasks.tasks.length,
                itemBuilder: (_, i) {
                  final t = tasks.tasks[i];
                  final status = t['status'] ?? '';
                  final statusColor = status == 'completed' ? AppColors.success : status == 'in_progress' ? AppColors.primary : AppColors.warning;
                  return Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
                    child: Row(children: [
                      Container(width: 4, height: 60, decoration: BoxDecoration(color: statusColor, borderRadius: BorderRadius.circular(2))),
                      const SizedBox(width: 14),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(t['job']?['title'] ?? 'Task', style:  TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 14)),
                        const SizedBox(height: 4),
                        Text('₹${((t['amount'] ?? 0) / 100).toStringAsFixed(0)} • ${status.replaceAll('_', ' ').toUpperCase()}', style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w600)),
                      ])),
                    ]));
                }),
      ]),
    );
  }

  Widget _skeleton() => ListView.builder(padding: const EdgeInsets.all(16), itemCount: 5,
    itemBuilder: (_, __) => Padding(padding: const EdgeInsets.only(bottom: 12),
      child: Shimmer.fromColors(baseColor: AppColors.surface, highlightColor: AppColors.surface2,
        child: Container(height: 100, decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16))))));
}
