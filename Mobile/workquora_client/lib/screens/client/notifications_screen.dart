import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/providers/chat_provider.dart';
import '../../core/providers/job_detail_provider.dart';
import '../../core/providers/notifications_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shimmer_list.dart';

// Authoritative type list, read from Backend/src/models/Notification.js's
// enum (not guessed) — each is mapped below to how it actually gets
// created (Backend/src/utils/notification.js call sites) so routing
// matches real relatedId/onModel combinations, not assumed ones:
//   new_message     — onModel 'Message', relatedId = Message._id (no jobId
//                      on the notification itself — resolved via
//                      ChatProvider's already-fetched conversation list by
//                      matching `sender`, since there's no
//                      get-message-by-id endpoint to ask the backend
//                      directly)
//   task_update     — onModel 'Job' (proposal accepted / job status) OR
//                      onModel 'Task' (freelancer travel/work/complete
//                      status, Backend/src/controllers/taskController.js)
//   system_alert    — onModel 'Job' in every real call site (job
//                      cancelled, proposal rejected, smart-match alerts) —
//                      despite the name, these are NOT generic/untargeted
//   payment_alert   — onModel 'Job' in every real call site
//   review_received — no relatedId/onModel in any call site found
//   account_activity, security_alert, kyc_update — no relatedId/onModel in
//                      any call site found (profile/auth/admin-KYC events)
class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  // Id of the notification currently being routed (mid job-status lookup),
  // so its tile can show a small inline spinner instead of a dead tap.
  String? _routingId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<NotificationsProvider>().fetchNotifications());
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'task_update':
        return Icons.work_outline_rounded;
      case 'payment_alert':
        return Icons.account_balance_wallet_outlined;
      case 'system_alert':
        return Icons.info_outline_rounded;
      case 'new_message':
        return Icons.chat_bubble_outline_rounded;
      case 'review_received':
        return Icons.star_outline_rounded;
      case 'account_activity':
        return Icons.person_outline_rounded;
      case 'security_alert':
        return Icons.shield_outlined;
      case 'kyc_update':
        return Icons.verified_user_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  String _titleFor(String type) {
    switch (type) {
      case 'task_update':
        return 'Job Update';
      case 'payment_alert':
        return 'Payment';
      case 'system_alert':
        return 'Alert';
      case 'new_message':
        return 'New Message';
      case 'review_received':
        return 'Review Received';
      case 'account_activity':
        return 'Account';
      case 'security_alert':
        return 'Security';
      case 'kyc_update':
        return 'KYC Update';
      default:
        return 'Notification';
    }
  }

  String _timeAgo(String? iso) {
    if (iso == null) return '';
    final date = DateTime.tryParse(iso);
    if (date == null) return '';
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 1) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    if (diff.inDays == 1) return 'Yesterday';
    if (diff.inDays < 7) return '${diff.inDays}d ago';
    return '${date.day}/${date.month}/${date.year}';
  }

  Future<void> _handleTap(Map notification) async {
    final id = notification['_id']?.toString();
    if (id != null) context.read<NotificationsProvider>().markAsRead(id);

    final type = notification['type']?.toString() ?? '';
    final onModel = notification['onModel']?.toString() ?? '';
    final relatedId = notification['relatedId']?.toString();

    if (type == 'new_message') {
      final senderId = notification['sender']?.toString();
      final conversations = context.read<ChatProvider>().conversations;
      final convo = conversations.cast<Map?>().firstWhere(
            (c) => c?['otherUserId']?.toString() == senderId,
            orElse: () => null,
          );
      if (!mounted) return;
      if (convo != null) {
        context.push('/chat', extra: {
          'jobId': convo['jobId'],
          'otherUserId': convo['otherUserId'],
          'otherUserName': convo['name'],
          'otherUserAvatar': convo['profilePic'],
        });
      } else {
        // No matching conversation loaded yet to resolve a jobId from —
        // land on the list rather than a dead tap.
        context.push('/conversations');
      }
      return;
    }

    if (relatedId == null || relatedId.isEmpty) return; // genuinely no target

    if (onModel == 'Job') {
      setState(() => _routingId = id);
      final jobProvider = context.read<JobDetailProvider>();
      await jobProvider.fetchJob(relatedId);
      if (!mounted) return;
      setState(() => _routingId = null);
      context.push(jobProvider.isInProgress ? '/job/$relatedId/track' : '/job/$relatedId');
      return;
    }

    if (onModel == 'Task') {
      // relatedId here is a Task id, not a Job id, and there's no
      // get-task-by-id endpoint to resolve its parent job — flagged in the
      // report. My Jobs is a reasonable landing spot rather than no-op.
      context.push('/my-jobs');
      return;
    }

    // onModel 'Transaction'/'Review', or none — no dedicated screen wired
    // for these today; no-op rather than guessing a destination.
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final provider = context.watch<NotificationsProvider>();
    final notifications = provider.notifications;
    final hasUnread = notifications.any((n) => n['isRead'] != true);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: () => context.read<NotificationsProvider>().markAllRead(),
              child: Text('Mark all read', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
            ),
        ],
      ),
      body: provider.isLoading && notifications.isEmpty
          ? const ShimmerList()
          : provider.error != null && notifications.isEmpty
              ? _buildError(theme, tokens, provider.error!, () => provider.fetchNotifications(force: true))
              : notifications.isEmpty
                  ? _buildEmpty(theme, tokens)
                  : RefreshIndicator(
                      color: theme.colorScheme.primary,
                      backgroundColor: theme.colorScheme.surface,
                      onRefresh: () => provider.fetchNotifications(force: true),
                      child: ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: AppSpace.md),
                        itemCount: notifications.length,
                        itemBuilder: (_, i) {
                          final n = notifications[i];
                          final isRead = n['isRead'] == true;
                          final type = n['type']?.toString() ?? '';
                          final routing = _routingId != null && _routingId == n['_id']?.toString();

                          return GestureDetector(
                            onTap: routing ? null : () => _handleTap(n),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: AppSpace.sm),
                              padding: const EdgeInsets.all(AppSpace.md),
                              decoration: BoxDecoration(
                                color: isRead ? theme.colorScheme.surface : tokens.brandSoft,
                                borderRadius: BorderRadius.circular(AppRadius.card),
                                border: Border.all(color: tokens.border, width: 0.5),
                              ),
                              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Container(
                                  width: 40,
                                  height: 40,
                                  decoration: BoxDecoration(color: tokens.chipBg, borderRadius: BorderRadius.circular(AppRadius.button)),
                                  child: Icon(_iconFor(type), color: theme.colorScheme.primary, size: 20),
                                ),
                                const SizedBox(width: AppSpace.md),
                                Expanded(
                                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                    Text(_titleFor(type), style: theme.textTheme.bodyMedium?.copyWith(fontWeight: isRead ? FontWeight.w600 : FontWeight.bold)),
                                    const SizedBox(height: 3),
                                    Text(n['message']?.toString() ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
                                  ]),
                                ),
                                const SizedBox(width: AppSpace.sm),
                                routing
                                    ? SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.primary))
                                    : Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
                                        Text(_timeAgo(n['createdAt']?.toString()), style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
                                        if (!isRead) ...[
                                          const SizedBox(height: 6),
                                          Container(width: 8, height: 8, decoration: BoxDecoration(color: theme.colorScheme.primary, shape: BoxShape.circle)),
                                        ],
                                      ]),
                              ]),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }

  Widget _buildError(ThemeData theme, AppTokens tokens, String error, Future<void> Function() onRetry) {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.error_outline_rounded, color: tokens.muted, size: 48),
        const SizedBox(height: AppSpace.md),
        Text(error, style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
        const SizedBox(height: AppSpace.md),
        TextButton(onPressed: onRetry, child: Text('Retry', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold))),
      ]),
    );
  }

  Widget _buildEmpty(ThemeData theme, AppTokens tokens) {
    return Center(
      child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(Icons.notifications_none_rounded, color: tokens.muted, size: 56),
        const SizedBox(height: AppSpace.md),
        Text('No notifications yet', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
      ]),
    );
  }
}
