import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/providers/jobs_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shimmer_list.dart';

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

  Color _statusColor(BuildContext context, String status) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    switch (status) {
      case 'open': return theme.colorScheme.primary;
      case 'in-progress': return tokens.warning;
      case 'completed': return tokens.success;
      case 'cancelled': return tokens.danger;
      default: return tokens.muted;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final jobsProvider = context.watch<JobsProvider>();
    final jobs = jobsProvider.myJobs;

    return Scaffold(
      appBar: AppBar(title: const Text('My Jobs')),
      body: RefreshIndicator(
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surface,
        onRefresh: () => context.read<JobsProvider>().fetchMyJobs(force: true),
        child: jobsProvider.isLoadingMyJobs && jobs.isEmpty
            ? const ShimmerList()
            : jobs.isEmpty
                ? ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
                    const SizedBox(height: 100),
                    Icon(Icons.work_outline, size: 64, color: tokens.muted),
                    const SizedBox(height: 16),
                    Center(child: Text('No jobs posted yet', style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 15, fontWeight: FontWeight.w600))),
                    const SizedBox(height: 20),
                    Center(child: ElevatedButton(
                      onPressed: () => context.push('/post-job'),
                      style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.primary, padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12)),
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
                      final color = _statusColor(context, status);
                      return GestureDetector(
                        onTap: () => context.push('/job/${job['_id']}'),
                        child: Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          padding: const EdgeInsets.all(14),
                          decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: tokens.border)),
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Row(children: [
                              Expanded(child: Text(job['title'] ?? 'Untitled Job', style: TextStyle(color: theme.colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 14))),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
                                child: Text(status, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ]),
                            const SizedBox(height: 8),
                            Row(children: [
                              Icon(Icons.currency_rupee, size: 13, color: theme.colorScheme.primary),
                              Text(_formatBudget(job), style: TextStyle(color: theme.colorScheme.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                              const SizedBox(width: 12),
                              Icon(Icons.calendar_today, size: 12, color: tokens.muted),
                              const SizedBox(width: 4),
                              Text(_timeAgo(job['createdAt']?.toString()), style: TextStyle(color: tokens.muted, fontSize: 12)),
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
