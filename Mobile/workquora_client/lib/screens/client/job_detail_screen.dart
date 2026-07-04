import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/job_detail_provider.dart';
import '../../widgets/app_button.dart';

class JobDetailScreen extends StatefulWidget {
  final String jobId;
  const JobDetailScreen({super.key, required this.jobId});
  @override State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => context.read<JobDetailProvider>().fetchJob(widget.jobId));
  }

  @override
  void dispose() {
    context.read<JobDetailProvider>().reset();
    super.dispose();
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

  Future<void> _confirmAccept(BuildContext context, JobDetailProvider provider, Map proposal) async {
    final freelancerInfo = proposal['freelancerInfo'] ?? {};
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Accept Proposal', style: TextStyle(color: AppColors.text)),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Accept proposal from ${freelancerInfo['name'] ?? 'this freelancer'}?', style: const TextStyle(color: AppColors.text)),
          const SizedBox(height: 8),
          Text('Bid: ₹${proposal['bidAmount']}', style: const TextStyle(color: AppColors.textMuted)),
          Text('Timeline: ${proposal['estimatedDays']} days', style: const TextStyle(color: AppColors.textMuted)),
          const SizedBox(height: 8),
          Text(
            '⚠️ This will move ₹${proposal['bidAmount']} from your wallet to escrow. Make sure you have sufficient balance.',
            style: const TextStyle(color: AppColors.warning, fontSize: 12),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: const Text('Accept', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.acceptProposal(proposal['_id'].toString());
    if (!context.mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Proposal accepted! Chat initialized.'), backgroundColor: AppColors.success));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to accept proposal'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _confirmReject(BuildContext context, JobDetailProvider provider, String proposalId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Reject Proposal', style: TextStyle(color: AppColors.text)),
        content: const Text('Are you sure you want to reject this proposal?', style: TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: const Text('Reject', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.rejectProposal(proposalId);
    if (!context.mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to reject proposal'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _showDeleteConfirm(BuildContext context, JobDetailProvider provider, Map job) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Job', style: TextStyle(color: AppColors.text)),
        content: Text(
          'Delete "${job['title']}"? This cannot be undone.\n\nOnly delete jobs with no accepted proposals.',
          style: const TextStyle(color: AppColors.textMuted),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: const Text('Delete', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.deleteJob(job['_id'].toString());
    if (!context.mounted) return;
    if (ok) {
      context.pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to delete job'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _showCancelDialog(BuildContext context, JobDetailProvider provider, Map job) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Request Cancellation', style: TextStyle(color: AppColors.text)),
        content: Text(
          'Request cancellation for "${job['title']}"?\n\nBoth you and the freelancer must agree to cancel. If agreed, your escrow will be refunded.',
          style: const TextStyle(color: AppColors.textMuted),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: const Text('Request', style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.requestCancellation(job['_id'].toString());
    if (!context.mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to request cancellation'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _confirmCancellation(BuildContext context, JobDetailProvider provider, Map job) async {
    // Freelancer already requested — this call completes the mutual agreement.
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Agree to Cancel', style: TextStyle(color: AppColors.text)),
        content: const Text(
          'The freelancer has requested cancellation. Agreeing will cancel the job and refund your escrow.',
          style: TextStyle(color: AppColors.textMuted),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: const Text('Not yet', style: TextStyle(color: AppColors.textMuted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: const Text('Agree to Cancel', style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.requestCancellation(job['_id'].toString());
    if (!context.mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job cancelled. Escrow refunded.'), backgroundColor: AppColors.success));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to cancel'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      body: Consumer<JobDetailProvider>(
        builder: (ctx, provider, _) {
          if (provider.isLoading && provider.job == null) {
            return const Center(child: CircularProgressIndicator(color: AppColors.primary));
          }

          if (provider.error != null && provider.job == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.error_outline, color: AppColors.textMuted, size: 48),
                  const SizedBox(height: 12),
                  Text(provider.error!, textAlign: TextAlign.center, style: const TextStyle(color: AppColors.textMuted)),
                  const SizedBox(height: 16),
                  TextButton(onPressed: () => provider.fetchJob(widget.jobId), child: const Text('Retry', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
                ]),
              ),
            );
          }

          final job = provider.job!;
          final acceptedCount = provider.proposals.where((p) => p['status'] == 'accepted').length;

          return CustomScrollView(slivers: [
            SliverAppBar(
              expandedHeight: 100,
              pinned: true,
              backgroundColor: AppColors.surface,
              title: const Text('Job Details'),
              actions: [
                if (provider.isOpen)
                  IconButton(
                    icon: const Icon(Icons.delete_outline, color: AppColors.error),
                    onPressed: () => _showDeleteConfirm(context, provider, job),
                  ),
              ],
            ),
            SliverToBoxAdapter(
              child: Column(children: [
                _buildHeader(job),
                _divider(),
                _buildDetails(job),
                _divider(),
                _buildClientInfo(job),
                _divider(),
                _buildActionSection(context, provider, job),
                _divider(),
                if (provider.proposals.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                    child: Row(children: [
                      Text('Proposals (${provider.proposals.length})', style: const TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
                      const Spacer(),
                      if (acceptedCount > 0) Text('$acceptedCount accepted', style: const TextStyle(color: AppColors.emerald, fontSize: 12, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                  ...provider.proposals.map((p) => _ProposalCard(
                        proposal: p,
                        provider: provider,
                        onAccept: () => _confirmAccept(context, provider, p),
                        onReject: () => _confirmReject(context, provider, p['_id'].toString()),
                      )),
                ],
                const SizedBox(height: 32),
              ]),
            ),
          ]);
        },
      ),
    );
  }

  Widget _divider() => const Divider(color: AppColors.border, height: 1);

  Widget _buildHeader(Map job) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(job['title'] ?? 'Untitled Job', style: const TextStyle(color: AppColors.text, fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            _StatusBadge(status: job['status'] ?? ''),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('₹${_formatBudget(job)}', style: const TextStyle(color: AppColors.primary, fontSize: 18, fontWeight: FontWeight.bold)),
            const Text('Budget', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ]),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          const Icon(Icons.calendar_today, size: 14, color: AppColors.textMuted),
          const SizedBox(width: 4),
          Text('Posted ${_timeAgo(job['createdAt']?.toString())}', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const Spacer(),
          if (job['isUrgent'] == true)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: AppColors.warning.withOpacity(0.15), borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.warning)),
              child: const Text('URGENT', style: TextStyle(color: AppColors.warning, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
        ]),
      ]),
    );
  }

  Widget _buildDetails(Map job) {
    final skills = (job['skillsRequired'] is List) ? List<String>.from(job['skillsRequired']) : <String>[];
    final address = job['location']?['address']?.toString() ?? '';

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Description', style: TextStyle(color: AppColors.text, fontSize: 14, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(job['description'] ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.6)),
        if (skills.isNotEmpty) ...[
          const SizedBox(height: 16),
          const Text('Skills Required', style: TextStyle(color: AppColors.text, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: skills.map((s) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.primary.withOpacity(0.3))),
            child: Text(s, style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)),
          )).toList()),
        ],
        if (address.isNotEmpty) ...[
          const SizedBox(height: 16),
          Row(children: [
            const Icon(Icons.location_on, size: 16, color: AppColors.primary),
            const SizedBox(width: 4),
            Expanded(child: Text(address, style: const TextStyle(color: AppColors.textMuted, fontSize: 13))),
          ]),
        ],
      ]),
    );
  }

  Widget _buildClientInfo(Map job) {
    final clientInfo = job['clientInfo'] ?? {};
    final name = clientInfo['name']?.toString() ?? 'Client';
    final pic = clientInfo['profilePic']?.toString() ?? '';
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: AppColors.primary.withOpacity(0.15),
          backgroundImage: pic.isNotEmpty ? NetworkImage(pic) : null,
          child: pic.isEmpty ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'C', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)) : null,
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: const TextStyle(color: AppColors.text, fontWeight: FontWeight.bold, fontSize: 14)),
          const Text('Posted this job', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
        ])),
        if (clientInfo['isVerified'] == true)
          const Icon(Icons.verified, color: AppColors.emerald, size: 18),
      ]),
    );
  }

  Widget _buildActionSection(BuildContext context, JobDetailProvider provider, Map job) {
    if (provider.isOpen && provider.proposals.isEmpty) {
      return Container(
        margin: const EdgeInsets.all(20),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
        child: const Row(children: [
          Icon(Icons.hourglass_empty, color: AppColors.textMuted),
          SizedBox(width: 12),
          Expanded(child: Text('Waiting for proposals...', style: TextStyle(color: AppColors.textMuted))),
        ]),
      );
    }

    if (provider.isOpen) return const SizedBox.shrink();

    if (provider.isInProgress) {
      Widget content;
      if (provider.clientRequestedCancel && !provider.freelancerRequestedCancel) {
        content = const _InfoBanner(message: 'You requested cancellation. Waiting for freelancer to agree.', color: AppColors.warning);
      } else if (provider.freelancerRequestedCancel && !provider.clientRequestedCancel) {
        content = Column(children: [
          const _InfoBanner(message: 'Freelancer has requested cancellation.', color: AppColors.warning),
          const SizedBox(height: 8),
          AppButton(label: 'Agree to Cancel', onPressed: () => _confirmCancellation(context, provider, job)),
        ]);
      } else if (!provider.clientRequestedCancel) {
        content = Align(
          alignment: Alignment.centerLeft,
          child: TextButton(
            onPressed: () => _showCancelDialog(context, provider, job),
            child: const Text('Request Cancellation', style: TextStyle(color: AppColors.error)),
          ),
        );
      } else {
        content = const SizedBox.shrink();
      }
      return Padding(padding: const EdgeInsets.all(20), child: content);
    }

    return const SizedBox.shrink();
  }
}

class _InfoBanner extends StatelessWidget {
  final String message;
  final Color color;
  const _InfoBanner({required this.message, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withOpacity(0.35))),
      child: Text(message, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600)),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    late final Color color;
    late final String label;
    switch (status) {
      case 'open':
        color = AppColors.primary; label = 'Open'; break;
      case 'in-progress':
        color = AppColors.warning; label = 'In Progress'; break;
      case 'completed':
        color = AppColors.emerald; label = 'Completed'; break;
      case 'cancelled':
        color = AppColors.error; label = 'Cancelled'; break;
      default:
        color = AppColors.textMuted; label = status;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withOpacity(0.35))),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}

class _ProposalStatusBadge extends StatelessWidget {
  final String status;
  const _ProposalStatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    late final Color color;
    late final String label;
    switch (status) {
      case 'accepted':
        color = AppColors.emerald; label = '✓ Accepted'; break;
      case 'rejected':
        color = AppColors.error; label = '✗ Rejected'; break;
      default:
        color = AppColors.textMuted; label = 'Pending';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(8)),
      child: Text(label, style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold)),
    );
  }
}

class _ProposalCard extends StatelessWidget {
  final Map<String, dynamic> proposal;
  final JobDetailProvider provider;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  const _ProposalCard({required this.proposal, required this.provider, required this.onAccept, required this.onReject});

  @override
  Widget build(BuildContext context) {
    final freelancerInfo = proposal['freelancerInfo'] ?? {};
    final name = freelancerInfo['name']?.toString() ?? 'Freelancer';
    final pic = freelancerInfo['profilePic']?.toString() ?? freelancerInfo['avatar']?.toString() ?? '';
    final status = proposal['status']?.toString() ?? 'pending';
    final isAccepted = status == 'accepted';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isAccepted ? AppColors.emerald.withOpacity(0.5) : AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: AppColors.primary.withOpacity(0.15),
            backgroundImage: pic.isNotEmpty ? NetworkImage(pic) : null,
            child: pic.isEmpty ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'F', style: const TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)) : null,
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(name, style: const TextStyle(color: AppColors.text, fontWeight: FontWeight.bold, fontSize: 14))),
              _ProposalStatusBadge(status: status),
            ]),
            Text(freelancerInfo['title']?.toString() ?? 'Freelancer', style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
            if (freelancerInfo['isKycVerified'] == true)
              const Padding(
                padding: EdgeInsets.only(top: 2),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.verified, size: 12, color: AppColors.emerald),
                  SizedBox(width: 4),
                  Text('KYC Verified', style: TextStyle(color: AppColors.emerald, fontSize: 11)),
                ]),
              ),
          ])),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _bidDetail('Bid Amount', '₹${proposal['bidAmount'] ?? 0}'),
          const SizedBox(width: 20),
          _bidDetail('Timeline', '${proposal['estimatedDays'] ?? '?'} days'),
        ]),
        if ((proposal['coverLetter']?.toString() ?? '').isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            proposal['coverLetter'].toString(),
            style: const TextStyle(color: AppColors.textMuted, fontSize: 13),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        if (status == 'pending' && provider.isOpen) ...[
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(
              onPressed: provider.isActing ? null : onReject,
              style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.error), padding: const EdgeInsets.symmetric(vertical: 10)),
              child: const Text('Reject', style: TextStyle(color: AppColors.error)),
            )),
            const SizedBox(width: 8),
            Expanded(child: ElevatedButton(
              onPressed: provider.isActing ? null : onAccept,
              style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, padding: const EdgeInsets.symmetric(vertical: 10)),
              child: provider.isActing
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Accept', style: TextStyle(color: Colors.white)),
            )),
          ]),
        ],
        if (isAccepted) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton.icon(
              icon: const Icon(Icons.chat_outlined, size: 16, color: AppColors.primary),
              label: Text('Message $name', style: const TextStyle(color: AppColors.primary)),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.primary), padding: const EdgeInsets.symmetric(vertical: 10)),
              onPressed: () => context.push('/chat', extra: {
                'jobId': provider.job?['_id']?.toString(),
                'otherUserId': (freelancerInfo['id'] ?? freelancerInfo['_id'])?.toString(),
                'otherUserName': name,
                'otherUserAvatar': pic,
              }),
            ),
          ),
        ],
      ]),
    );
  }

  Widget _bidDetail(String label, String value) {
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
      Text(value, style: const TextStyle(color: AppColors.text, fontSize: 13, fontWeight: FontWeight.w600)),
    ]);
  }
}
