import 'package:flutter/material.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  List<dynamic> _notifications = [];
  bool _loading = true;
  bool _error = false;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = false; });
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.notifications);
      _notifications = res.data['data'] ?? res.data['notifications'] ?? [];
      _error = false;
    } catch (_) {
      _error = true;
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _markAllRead() async {
    try {
      await DioClient.instance.dio.put(ApiConstants.markAllRead);
      setState(() {
        for (final n in _notifications) { n['isRead'] = true; }
      });
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to mark all as read'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _markOneRead(Map notification) async {
    if (notification['isRead'] == true) return;
    setState(() => notification['isRead'] = true);
    try {
      await DioClient.instance.dio.put('/notifications/${notification['_id']}/read');
    } catch (_) {
      // Non-fatal — the local optimistic update stands even if the sync failed.
    }
  }

  IconData _iconFor(String type) {
    switch (type) {
      case 'task_update': return Icons.work;
      case 'payment_alert': return Icons.account_balance_wallet;
      case 'system_alert': return Icons.info_outline;
      case 'new_message': return Icons.chat;
      case 'review_received': return Icons.star;
      default: return Icons.notifications;
    }
  }

  String _titleFor(String type) {
    switch (type) {
      case 'task_update': return 'Task Update';
      case 'payment_alert': return 'Payment';
      case 'system_alert': return 'System Alert';
      case 'new_message': return 'New Message';
      case 'review_received': return 'Review Received';
      default: return 'Notification';
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

  @override
  Widget build(BuildContext context) {
    final hasUnread = _notifications.any((n) => n['isRead'] != true);
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        title: const Text('Notifications'),
        backgroundColor: AppColors.bg,
        elevation: 0,
        actions: [
          if (hasUnread)
            TextButton(
              onPressed: _markAllRead,
              child: const Text('Mark all read', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primary))
          : _error
              ? Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.error_outline, color: AppColors.textMuted, size: 48),
                  const SizedBox(height: 12),
                  const Text('Failed to load notifications', style: TextStyle(color: AppColors.textMuted)),
                  const SizedBox(height: 16),
                  TextButton(onPressed: _load, child: const Text('Retry', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold))),
                ]))
              : _notifications.isEmpty
                  ? const Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.notifications_none, color: AppColors.textMuted, size: 56),
                      SizedBox(height: 12),
                      Text('No notifications yet', style: TextStyle(color: AppColors.textMuted, fontSize: 15)),
                    ]))
                  : RefreshIndicator(
                      color: AppColors.primary,
                      backgroundColor: AppColors.surface,
                      onRefresh: _load,
                      child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        itemCount: _notifications.length,
                        itemBuilder: (_, i) {
                          final n = _notifications[i];
                          final isRead = n['isRead'] == true;
                          final type = n['type']?.toString() ?? '';
                          return GestureDetector(
                            onTap: () => _markOneRead(n),
                            child: Container(
                              margin: const EdgeInsets.only(bottom: 8),
                              padding: const EdgeInsets.all(14),
                              decoration: BoxDecoration(
                                color: isRead ? AppColors.surface : AppColors.primary.withOpacity(0.08),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Container(
                                  width: 40, height: 40,
                                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.12), borderRadius: BorderRadius.circular(12)),
                                  child: Icon(_iconFor(type), color: AppColors.primary, size: 20),
                                ),
                                const SizedBox(width: 12),
                                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(_titleFor(type), style: TextStyle(color: AppColors.text, fontSize: 14, fontWeight: isRead ? FontWeight.w600 : FontWeight.bold)),
                                  const SizedBox(height: 3),
                                  Text(n['message'] ?? '', maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(color: AppColors.textMuted, fontSize: 13)),
                                ])),
                                const SizedBox(width: 8),
                                Text(_timeAgo(n['createdAt']?.toString()), style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                              ]),
                            ),
                          );
                        },
                      ),
                    ),
    );
  }
}
