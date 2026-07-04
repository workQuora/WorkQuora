import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/jobs_provider.dart';

class MyJobsScreen extends StatefulWidget {
  const MyJobsScreen({super.key});
  @override State<MyJobsScreen> createState() => _MyJobsScreenState();
}

class _MyJobsScreenState extends State<MyJobsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<JobsProvider>().fetchMyJobs());
  }

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${dt.day}/${dt.month}/${dt.year}';
  }

  String _formatBudget(Map job) {
    final range = job['budgetRange'];
    if (range != null && range['min'] != null) {
      final min = range['min'];
      final max = range['max'];
      if (max != null && max != min) return '$min - $max';
      return '$min';
    }
    return '${job['budget'] ?? 0}';
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'open': return AppColors.primary;
      case 'in-progress': return AppColors.warning;
      case 'completed': return AppColors.emerald;
      case 'cancelled': return AppColors.error;
      default: return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final jobsProvider = context.watch<JobsProvider>();
    final jobs = jobsProvider.myJobs;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('My Jobs'), backgroundColor: AppColors.bg, elevation: 0),
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        onRefresh: () => context.read<JobsProvider>().fetchMyJobs(),
        child: jobsProvider.isLoading
            ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
            : jobs.isEmpty
                ? ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
                    const SizedBox(height: 100),
                    const Icon(Icons.work_outline, size: 64, color: AppColors.textMuted),
                    const SizedBox(height: 16),
                    const Center(child: Text('No jobs posted yet', style: TextStyle(color: AppColors.text, fontSize: 15, fontWeight: FontWeight.w600))),
                    const SizedBox(height: 20),
                    Center(child: ElevatedButton(
                      onPressed: () => context.push('/post-job'),
                      style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
                      child: const Text('Post a Job', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                    )),
                  ])
                : ListView.builder(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: jobs.length,
                    itemBuilder: (_, i) {
                      final job = jobs[i] as Map;
                      final status = job['status']?.toString() ?? 'open';
                      final color = _statusColor(status);
                      return GestureDetector(
                        onTap: () => context.push('/job/${job['_id']}'),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Expanded(child: Text(job['title'] ?? 'Untitled Job', style: const TextStyle(color: AppColors.text, fontWeight: FontWeight.bold, fontSize: 14))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
                                child: Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ]),
                            const SizedBox(height: 8),
                            Row(children: [
                              const Icon(Icons.currency_rupee, size: 13, color: AppColors.primary),
                              Text(_formatBudget(job), style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(width: 12),
                              const Icon(Icons.calendar_today, size: 12, color: AppColors.textMuted),
                              const SizedBox(width: 4),
                              Text(_timeAgo(job['createdAt']?.toString()), style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                            ]),
                          ]),
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
