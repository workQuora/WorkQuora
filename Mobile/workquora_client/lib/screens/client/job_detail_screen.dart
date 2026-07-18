import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/providers/job_detail_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';

class JobDetailScreen extends StatefulWidget {
  final String jobId;
  const JobDetailScreen({super.key, required this.jobId});
  @override State<JobDetailScreen> createState() => _JobDetailScreenState();
}

class _JobDetailScreenState extends State<JobDetailScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      if (!mounted) return;
      context.read<JobDetailProvider>().fetchJob(widget.jobId);
    });
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
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final freelancerInfo = proposal['freelancerInfo'] ?? {};
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Accept Proposal'),
        content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('Accept proposal from ${freelancerInfo['name'] ?? 'this freelancer'}?'),
          const SizedBox(height: 8),
          Text('Bid: ₹${proposal['bidAmount']}', style: TextStyle(color: tokens.muted)),
          Text('Timeline: ${proposal['estimatedDays']} days', style: TextStyle(color: tokens.muted)),
          const SizedBox(height: 8),
          Text(
            '⚠️ This will move ₹${proposal['bidAmount']} from your wallet to escrow. Make sure you have sufficient balance.',
            style: TextStyle(color: tokens.warning, fontSize: 12),
          ),
        ]),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: Text('Accept', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.acceptProposal(proposal['_id'].toString());
    if (!context.mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Proposal accepted! Chat initialized.'), backgroundColor: tokens.success));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to accept proposal'), backgroundColor: tokens.danger));
    }
  }

  Future<void> _confirmReject(BuildContext context, JobDetailProvider provider, String proposalId) async {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Reject Proposal'),
        content: const Text('Are you sure you want to reject this proposal?'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: Text('Reject', style: TextStyle(color: tokens.danger, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.rejectProposal(proposalId);
    if (!context.mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to reject proposal'), backgroundColor: tokens.danger));
    }
  }

  Future<void> _showDeleteConfirm(BuildContext context, JobDetailProvider provider, Map job) async {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Delete Job'),
        content: Text('Delete "${job['title']}"? This cannot be undone.\n\nOnly delete jobs with no accepted proposals.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: Text('Delete', style: TextStyle(color: tokens.danger, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.deleteJob(job['_id'].toString());
    if (!context.mounted) return;
    if (ok) {
      context.pop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to delete job'), backgroundColor: tokens.danger));
    }
  }

  Future<void> _showCancelDialog(BuildContext context, JobDetailProvider provider, Map job) async {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Request Cancellation'),
        content: Text('Request cancellation for "${job['title']}"?\n\nBoth you and the freelancer must agree to cancel. If agreed, your escrow will be refunded.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: Text('Request', style: TextStyle(color: tokens.warning, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.requestCancellation(job['_id'].toString());
    if (!context.mounted) return;
    if (!ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to request cancellation'), backgroundColor: tokens.danger));
    }
  }

  Future<void> _confirmCancellation(BuildContext context, JobDetailProvider provider, Map job) async {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    // Freelancer already requested — this call completes the mutual agreement.
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogCtx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Agree to Cancel'),
        content: const Text('The freelancer has requested cancellation. Agreeing will cancel the job and refund your escrow.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(false), child: Text('Not yet', style: TextStyle(color: tokens.muted))),
          TextButton(onPressed: () => Navigator.of(dialogCtx).pop(true), child: Text('Agree to Cancel', style: TextStyle(color: tokens.warning, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !context.mounted) return;

    final ok = await provider.requestCancellation(job['_id'].toString());
    if (!context.mounted) return;
    if (ok) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Job cancelled. Escrow refunded.'), backgroundColor: tokens.success));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(provider.error ?? 'Failed to cancel'), backgroundColor: tokens.danger));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: Consumer<JobDetailProvider>(
        builder: (ctx, provider, _) {
          if (provider.isLoading && provider.job == null) {
            return Center(child: CircularProgressIndicator(color: theme.colorScheme.primary));
          }

          if (provider.error != null && provider.job == null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.error_outline, color: tokens.muted, size: 48),
                  const SizedBox(height: 12),
                  Text(provider.error!, textAlign: TextAlign.center, style: TextStyle(color: tokens.muted)),
                  const SizedBox(height: 16),
                  TextButton(onPressed: () => provider.fetchJob(widget.jobId), child: Text('Retry', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold))),
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
              backgroundColor: theme.colorScheme.surface,
              title: const Text('Job Details'),
              actions: [
                if (provider.isOpen)
                  IconButton(
                    icon: provider.isActing
                        ? SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: tokens.danger))
                        : Icon(Icons.delete_outline, color: tokens.danger),
                    onPressed: provider.isActing ? null : () => _showDeleteConfirm(context, provider, job),
                  ),
              ],
            ),
            SliverToBoxAdapter(
              child: Column(children: [
                _buildHeader(context, job),
                _divider(context),
                _buildDetails(context, job),
                _divider(context),
                _buildClientInfo(context, job),
                _divider(context),
                _buildActionSection(context, provider, job),
                _divider(context),
                if (provider.proposals.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 4),
                    child: Row(children: [
                      Text('Proposals (${provider.proposals.length})', style: theme.textTheme.titleMedium),
                      const Spacer(),
                      if (acceptedCount > 0) Text('$acceptedCount accepted', style: TextStyle(color: tokens.success, fontSize: 12, fontWeight: FontWeight.w600)),
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

  Widget _divider(BuildContext context) => Divider(color: Theme.of(context).extension<AppTokens>()!.border, height: 1);

  Widget _buildHeader(BuildContext context, Map job) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(job['title'] ?? 'Untitled Job', style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 6),
            _StatusBadge(status: job['status'] ?? ''),
          ])),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('₹${_formatBudget(job)}', style: TextStyle(color: theme.colorScheme.primary, fontSize: 18, fontWeight: FontWeight.bold)),
            Text('Budget', style: TextStyle(color: tokens.muted, fontSize: 12)),
          ]),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          Icon(Icons.calendar_today, size: 14, color: tokens.muted),
          const SizedBox(width: 4),
          Text('Posted ${_timeAgo(job['createdAt']?.toString())}', style: TextStyle(color: tokens.muted, fontSize: 12)),
          const Spacer(),
          if (job['isUrgent'] == true)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(color: tokens.warning.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(12), border: Border.all(color: tokens.warning)),
              child: Text('URGENT', style: TextStyle(color: tokens.warning, fontSize: 11, fontWeight: FontWeight.bold)),
            ),
        ]),
      ]),
    );
  }

  Widget _buildDetails(BuildContext context, Map job) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final skills = (job['skillsRequired'] is List) ? List<String>.from(job['skillsRequired']) : <String>[];
    final address = job['location']?['address']?.toString() ?? '';

    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Description', style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 14, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(job['description'] ?? '', style: TextStyle(color: tokens.muted, fontSize: 14, height: 1.6)),
        if (skills.isNotEmpty) ...[
          const SizedBox(height: 16),
          Text('Skills Required', style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 14, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Wrap(spacing: 8, runSpacing: 8, children: skills.map((s) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.3))),
            child: Text(s, style: TextStyle(color: theme.colorScheme.primary, fontSize: 12, fontWeight: FontWeight.w600)),
          )).toList()),
        ],
        if (address.isNotEmpty) ...[
          const SizedBox(height: 16),
          Row(children: [
            Icon(Icons.location_on, size: 16, color: theme.colorScheme.primary),
            const SizedBox(width: 4),
            Expanded(child: Text(address, style: TextStyle(color: tokens.muted, fontSize: 13))),
          ]),
        ],
      ]),
    );
  }

  Widget _buildClientInfo(BuildContext context, Map job) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final clientInfo = job['clientInfo'] ?? {};
    final name = clientInfo['name']?.toString() ?? 'Client';
    final pic = clientInfo['profilePic']?.toString() ?? '';
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Row(children: [
        CircleAvatar(
          radius: 20,
          backgroundColor: tokens.brandSoft,
          backgroundImage: pic.isNotEmpty ? NetworkImage(pic) : null,
          child: pic.isEmpty ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'C', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)) : null,
        ),
        const SizedBox(width: 12),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(name, style: TextStyle(color: theme.colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 14)),
          Text('Posted this job', style: TextStyle(color: tokens.muted, fontSize: 12)),
        ])),
        if (clientInfo['isVerified'] == true)
          Icon(Icons.verified, color: tokens.success, size: 18),
      ]),
    );
  }

  Widget _buildActionSection(BuildContext context, JobDetailProvider provider, Map job) {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    if (provider.isOpen && provider.proposals.isEmpty) {
      return Container(
        margin: const EdgeInsets.all(20),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: Theme.of(context).colorScheme.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: tokens.border)),
        child: Row(children: [
          Icon(Icons.hourglass_empty, color: tokens.muted),
          const SizedBox(width: 12),
          Expanded(child: Text('Waiting for proposals...', style: TextStyle(color: tokens.muted))),
        ]),
      );
    }

    if (provider.isOpen) return const SizedBox.shrink();

    if (provider.isInProgress) {
      Widget content;
      if (provider.clientRequestedCancel && !provider.freelancerRequestedCancel) {
        content = _InfoBanner(message: 'You requested cancellation. Waiting for freelancer to agree.', color: tokens.warning);
      } else if (provider.freelancerRequestedCancel && !provider.clientRequestedCancel) {
        content = Column(children: [
          _InfoBanner(message: 'Freelancer has requested cancellation.', color: tokens.warning),
          const SizedBox(height: 8),
          PrimaryButton(label: 'Agree to Cancel', loading: provider.isActing, onPressed: () => _confirmCancellation(context, provider, job)),
        ]);
      } else if (!provider.clientRequestedCancel) {
        content = Align(
          alignment: Alignment.centerLeft,
          child: TextButton(
            onPressed: () => _showCancelDialog(context, provider, job),
            child: Text('Request Cancellation', style: TextStyle(color: tokens.danger)),
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
      decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12), border: Border.all(color: color.withValues(alpha: 0.35))),
      child: Text(message, style: TextStyle(color: color, fontSize: 13, fontWeight: FontWeight.w600)),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    late final Color color;
    late final String label;
    switch (status) {
      case 'open':
        color = theme.colorScheme.primary; label = 'Open'; break;
      case 'in-progress':
        color = tokens.warning; label = 'In Progress'; break;
      case 'completed':
        color = tokens.success; label = 'Completed'; break;
      case 'cancelled':
        color = tokens.danger; label = 'Cancelled'; break;
      default:
        color = tokens.muted; label = status;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(10), border: Border.all(color: color.withValues(alpha: 0.35))),
      child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}

class _ProposalStatusBadge extends StatelessWidget {
  final String status;
  const _ProposalStatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    late final Color color;
    late final String label;
    switch (status) {
      case 'accepted':
        color = tokens.success; label = '✓ Accepted'; break;
      case 'rejected':
        color = tokens.danger; label = '✗ Rejected'; break;
      default:
        color = tokens.muted; label = 'Pending';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(8)),
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
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final freelancerInfo = proposal['freelancerInfo'] ?? {};
    final name = freelancerInfo['name']?.toString() ?? 'Freelancer';
    final pic = freelancerInfo['profilePic']?.toString() ?? freelancerInfo['avatar']?.toString() ?? '';
    final status = proposal['status']?.toString() ?? 'pending';
    final isAccepted = status == 'accepted';

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isAccepted ? tokens.success.withValues(alpha: 0.5) : tokens.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          CircleAvatar(
            radius: 24,
            backgroundColor: tokens.brandSoft,
            backgroundImage: pic.isNotEmpty ? NetworkImage(pic) : null,
            child: pic.isEmpty ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'F', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)) : null,
          ),
          const SizedBox(width: 12),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Expanded(child: Text(name, style: TextStyle(color: theme.colorScheme.onSurface, fontWeight: FontWeight.bold, fontSize: 14))),
              _ProposalStatusBadge(status: status),
            ]),
            Text(freelancerInfo['title']?.toString() ?? 'Freelancer', style: TextStyle(color: tokens.muted, fontSize: 12)),
            if (freelancerInfo['isKycVerified'] == true)
              Padding(
                padding: const EdgeInsets.only(top: 2),
                child: Row(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.verified, size: 12, color: tokens.success),
                  const SizedBox(width: 4),
                  Text('KYC Verified', style: TextStyle(color: tokens.success, fontSize: 11)),
                ]),
              ),
          ])),
        ]),
        const SizedBox(height: 12),
        Row(children: [
          _bidDetail(context, 'Bid Amount', '₹${proposal['bidAmount'] ?? 0}'),
          const SizedBox(width: 20),
          _bidDetail(context, 'Timeline', '${proposal['estimatedDays'] ?? '?'} days'),
        ]),
        if ((proposal['coverLetter']?.toString() ?? '').isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(
            proposal['coverLetter'].toString(),
            style: TextStyle(color: tokens.muted, fontSize: 13),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
        ],
        if (status == 'pending' && provider.isOpen) ...[
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: OutlinedButton(
              onPressed: provider.isActing ? null : onReject,
              style: OutlinedButton.styleFrom(side: BorderSide(color: tokens.danger), padding: const EdgeInsets.symmetric(vertical: 10)),
              child: Text('Reject', style: TextStyle(color: tokens.danger)),
            )),
            const SizedBox(width: 8),
            Expanded(child: ElevatedButton(
              onPressed: provider.isActing ? null : onAccept,
              style: ElevatedButton.styleFrom(backgroundColor: theme.colorScheme.primary, padding: const EdgeInsets.symmetric(vertical: 10)),
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
              icon: Icon(Icons.chat_outlined, size: 16, color: theme.colorScheme.primary),
              label: Text('Message $name', style: TextStyle(color: theme.colorScheme.primary)),
              style: OutlinedButton.styleFrom(side: BorderSide(color: theme.colorScheme.primary), padding: const EdgeInsets.symmetric(vertical: 10)),
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

  Widget _bidDetail(BuildContext context, String label, String value) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(color: tokens.muted, fontSize: 11)),
      Text(value, style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 13, fontWeight: FontWeight.w600)),
    ]);
  }
}
