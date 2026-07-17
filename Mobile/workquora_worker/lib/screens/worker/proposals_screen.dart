import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/providers/dashboard_provider.dart';
import '../../core/utils/time_utils.dart';

class ProposalsScreen extends StatefulWidget {
  const ProposalsScreen({super.key});
  @override
  State<ProposalsScreen> createState() => _ProposalsScreenState();
}

class _ProposalsScreenState extends State<ProposalsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabs;
  static const _statuses = ['all', 'pending', 'accepted', 'rejected'];

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _statuses.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<JobsProvider>().fetchMyProposals();
      context.read<DashboardProvider>().fetchDashboard();
    });
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final jobsProvider = context.watch<JobsProvider>();

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('My Proposals'),
        backgroundColor: AppColors.background,
        elevation: 0,
        bottom: TabBar(
          controller: _tabs,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
          tabs: const [Tab(text: 'All'), Tab(text: 'Pending'), Tab(text: 'Accepted'), Tab(text: 'Rejected')],
        ),
      ),
      body: jobsProvider.isLoadingProposals
          ? Center(child: CircularProgressIndicator(color: AppColors.primary))
          : TabBarView(
              controller: _tabs,
              children: _statuses.map((s) => _tabBody(context, jobsProvider, s)).toList(),
            ),
    );
  }

  Widget _tabBody(BuildContext context, JobsProvider jobsProvider, String status) {
    final list = status == 'all' ? jobsProvider.myProposals : jobsProvider.myProposals.where((p) => p['status'] == status).toList();

    // Backend has no GET /proposals/my-proposals endpoint yet (verified
    // against proposalRoutes.js — only POST /:jobId, GET /job/:jobId,
    // PUT /:id/accept and PUT /:id/reject exist), so this list is always
    // empty in practice. Show a message that says so rather than a generic
    // "no proposals yet" empty state.
    if (list.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(Icons.hourglass_top_rounded, color: AppColors.textSecondary, size: 52),
            const SizedBox(height: 16),
            Text('Proposal tracking is coming soon', style: TextStyle(color: AppColors.textPrimary, fontSize: 15, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text(
              'We\'re still building the ability to list your submitted proposals here. Your bids are still sent to clients normally — check the job listing to see if you\'ve applied.',
              style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            OutlinedButton(
              onPressed: () => context.go('/home'),
              style: OutlinedButton.styleFrom(side: BorderSide(color: AppColors.primary), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
              child: Text('Back to Home', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)),
            ),
          ]),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (_, i) => _proposalCard(context, list[i]),
    );
  }

  Widget _proposalCard(BuildContext context, Map<String, dynamic> proposal) {
    final job = proposal['job'];
    final jobTitle = job is Map ? (job['title'] ?? 'Job') : 'Job';
    final jobId = (job is Map ? (job['_id'] ?? job['id']) : job)?.toString() ?? '';
    final status = (proposal['status'] ?? 'pending').toString();
    final bid = proposal['bidAmount'] ?? 0;
    final days = proposal['estimatedDays'] ?? '-';
    final posted = timeAgo(proposal['createdAt']?.toString());
    final badgeColor = status == 'accepted' ? AppColors.success : status == 'rejected' ? AppColors.error : AppColors.warning;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Expanded(child: Text(jobTitle, style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15), overflow: TextOverflow.ellipsis)),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(color: badgeColor.withOpacity(0.12), borderRadius: BorderRadius.circular(20)),
            child: Text(status.toUpperCase(), style: TextStyle(color: badgeColor, fontSize: 10, fontWeight: FontWeight.bold)),
          ),
        ]),
        const SizedBox(height: 8),
        Text('Bid: ₹$bid • $days days', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
        if (posted.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(posted, style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
        ],
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: jobId.isEmpty ? null : () => context.push(_resolveRoute(context, status, jobId)),
            style: OutlinedButton.styleFrom(side: BorderSide(color: AppColors.primary), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
            child: Text(status == 'accepted' ? 'Go to Job' : 'View Job', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
          ),
        ),
      ]),
    );
  }

  // For accepted proposals there's no direct proposal->task endpoint, so we
  // cross-reference DashboardProvider's recentTasks by job id; falls back to
  // the job detail screen if no matching task is found.
  String _resolveRoute(BuildContext context, String status, String jobId) {
    if (status != 'accepted') return '/job/$jobId';
    final task = context.read<DashboardProvider>().findTaskByJobId(jobId);
    if (task != null) {
      final taskId = (task['_id'] ?? task['id']).toString();
      return '/active-work/$taskId';
    }
    return '/job/$jobId';
  }
}
