import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/tasks_provider.dart';
import '../../core/providers/wallet_provider.dart';

class WorkerHomeScreen extends StatefulWidget {
  const WorkerHomeScreen({super.key});
  @override State<WorkerHomeScreen> createState() => _WorkerHomeScreenState();
}

class _WorkerHomeScreenState extends State<WorkerHomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<TasksProvider>().fetchMyTasks();
      context.read<TasksProvider>().fetchNearbyJobs();
      context.read<WalletProvider>().fetchWallet();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth   = context.watch<AuthProvider>();
    final tasks  = context.watch<TasksProvider>();
    final wallet = context.watch<WalletProvider>();
    final user   = auth.user ?? {};
    final name   = (user['name'] ?? 'Worker').toString().split(' ').first;
    final avail  = user['isAvailable'] == true;

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(child: RefreshIndicator(
        color: AppColors.primary, backgroundColor: AppColors.surface,
        onRefresh: () async {
          await context.read<TasksProvider>().fetchMyTasks();
          await context.read<TasksProvider>().fetchNearbyJobs();
        },
        child: CustomScrollView(slivers: [
          SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.fromLTRB(20, 16, 20, 0), child: Row(children: [
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                const Icon(Icons.location_on, color: AppColors.primary, size: 16),
                const Text(' New Delhi', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
              ]),
              Text('Hi $name 🔧', style: const TextStyle(color: AppColors.text, fontSize: 22, fontWeight: FontWeight.w900)),
            ])),
            GestureDetector(
              onTap: () => auth.updateAvailability(!avail),
              child: Container(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(color: avail ? AppColors.emerald.withOpacity(0.15) : AppColors.surface, borderRadius: BorderRadius.circular(20), border: Border.all(color: avail ? AppColors.emerald : AppColors.border)),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Container(width: 7, height: 7, decoration: BoxDecoration(color: avail ? AppColors.emerald : AppColors.textMuted, shape: BoxShape.circle)),
                  const SizedBox(width: 6),
                  Text(avail ? 'Online' : 'Offline', style: TextStyle(color: avail ? AppColors.emerald : AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold)),
                ])),
            ),
          ]))),
          SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.fromLTRB(20, 16, 20, 0), child: Row(children: [
            Expanded(child: _statCard('Today\'s Earn', '₹${wallet.balance.toStringAsFixed(0)}', Icons.currency_rupee, AppColors.emerald)),
            const SizedBox(width: 12),
            Expanded(child: _statCard('Active Jobs', '${tasks.activeTasks.length}', Icons.work, AppColors.primary)),
            const SizedBox(width: 12),
            Expanded(child: _statCard('Completed', '${tasks.completedTasks.length}', Icons.check_circle, AppColors.amber)),
          ]))),
          SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.fromLTRB(20, 24, 20, 12), child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Nearby Job Requests', style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
            GestureDetector(onTap: () => context.go('/jobs'), child: const Text('See all', style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600))),
          ]))),
          tasks.isLoading
            ? SliverList(delegate: SliverChildBuilderDelegate((_, i) => Padding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                child: Shimmer.fromColors(baseColor: AppColors.surface, highlightColor: AppColors.surfaceAlt,
                  child: Container(height: 100, decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18))))), childCount: 3))
            : tasks.nearbyJobs.isEmpty
              ? SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20), child: Container(padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.border)),
                  child: Column(children: [const Icon(Icons.search_off, color: AppColors.textMuted, size: 40), const SizedBox(height: 10), const Text('No nearby jobs right now', style: TextStyle(color: AppColors.textMuted)), Text(avail ? 'Check back soon!' : 'Go Online to receive jobs', style: TextStyle(color: AppColors.textMuted.withOpacity(0.6), fontSize: 12))]))))
              : SliverPadding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 8), sliver: SliverList(delegate: SliverChildBuilderDelegate((_, i) => _jobRequestCard(context, tasks.nearbyJobs[i]), childCount: tasks.nearbyJobs.take(5).length))),
          if (tasks.activeTasks.isNotEmpty) ...[
            SliverToBoxAdapter(child: const Padding(padding: EdgeInsets.fromLTRB(20, 16, 20, 12), child: Text('My Active Jobs', style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.bold)))),
            SliverPadding(padding: const EdgeInsets.fromLTRB(20, 0, 20, 20), sliver: SliverList(delegate: SliverChildBuilderDelegate((_, i) => _activeTaskCard(context, tasks.activeTasks[i], tasks), childCount: tasks.activeTasks.length))),
          ],
        ]),
      )),
    );
  }

  Widget _statCard(String label, String val, IconData icon, Color color) => Container(padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Icon(icon, color: color, size: 18),
      const SizedBox(height: 8),
      Text(val, style: TextStyle(color: color, fontSize: 20, fontWeight: FontWeight.w900)),
      const SizedBox(height: 2),
      Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
    ]));

  Widget _jobRequestCard(BuildContext context, Map<String, dynamic> job) {
    final title   = job['title'] ?? 'Job';
    final budget  = job['budgetFixed'] ?? job['budgetMin'] ?? 0;
    final cat     = job['category'] ?? '';
    final client  = job['clientInfo']?['name'] ?? job['client']?['name'] ?? 'Client';

    return Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3), decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)), child: Text('🆕 $cat', style: const TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold))),
          const Spacer(),
          Text('₹$budget', style: const TextStyle(color: AppColors.emerald, fontWeight: FontWeight.w900, fontSize: 16)),
        ]),
        const SizedBox(height: 8),
        Text(title, style: const TextStyle(color: AppColors.text, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 4),
        Text('by $client', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: OutlinedButton(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job declined'))),
            style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.border), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), padding: const EdgeInsets.symmetric(vertical: 10)),
            child: const Text('Decline', style: TextStyle(color: AppColors.textMuted, fontSize: 13)))),
          const SizedBox(width: 10),
          Expanded(child: ElevatedButton(onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job accepted! ✅'), backgroundColor: AppColors.success)),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), padding: const EdgeInsets.symmetric(vertical: 10), elevation: 0),
            child: const Text('Accept ✓', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)))),
        ]),
      ]),
    );
  }

  Widget _activeTaskCard(BuildContext context, Map<String, dynamic> task, TasksProvider tasksProvider) {
    final title  = task['job']?['title'] ?? task['title'] ?? 'Task';
    final amount = ((task['amount'] ?? 0) / 100).toStringAsFixed(0);
    final id     = task['_id'] ?? task['id'] ?? '';

    return Container(margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.primary.withOpacity(0.3))),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          const Icon(Icons.bolt, color: AppColors.primary, size: 16),
          const SizedBox(width: 6),
          const Text('In Progress', style: TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
          const Spacer(),
          Text('₹$amount in escrow', style: const TextStyle(color: AppColors.emerald, fontSize: 12, fontWeight: FontWeight.bold)),
        ]),
        const SizedBox(height: 8),
        Text(title, style: const TextStyle(color: AppColors.text, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 12),
        SizedBox(width: double.infinity, child: ElevatedButton(
          onPressed: () async {
            final ok = await tasksProvider.markComplete(id);
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ok ? 'Marked complete! ₹$amount released 🎉' : 'Error'), backgroundColor: ok ? AppColors.success : AppColors.error));
            }
          },
          style: ElevatedButton.styleFrom(backgroundColor: AppColors.success, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), elevation: 0),
          child: const Text('Mark Complete ✓', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        )),
      ]),
    );
  }
}
