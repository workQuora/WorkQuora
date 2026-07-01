import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:timeago/timeago.dart' as timeago;

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../application/notifications_controller.dart';
import '../../data/models/notification_model.dart';

enum NotificationTab { all, alerts }

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  NotificationTab _currentTab = NotificationTab.all;

  IconData _getIconForType(String type) {
    switch (type) {
      case 'task_update':
        return Icons.assignment_rounded;
      case 'payment_alert':
        return Icons.account_balance_wallet_rounded;
      case 'system_alert':
        return Icons.info_outline_rounded;
      case 'new_message':
        return Icons.chat_bubble_outline_rounded;
      case 'review_received':
        return Icons.rate_review_outlined;
      default:
        return Icons.notifications_none_rounded;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'task_update':
        return AppColors.primary;
      case 'payment_alert':
        return AppColors.secondary;
      case 'system_alert':
        return AppColors.error;
      case 'new_message':
        return AppColors.promoOrange;
      case 'review_received':
        return Colors.purple;
      default:
        return AppColors.outline;
    }
  }

  List<NotificationModel> _filterNotifications(List<NotificationModel> list) {
    if (_currentTab == NotificationTab.all) return list;
    // 'Alerts' tab filters for payment alerts, system alerts, or reviews
    return list.where((n) {
      return n.type == 'payment_alert' || n.type == 'system_alert' || n.type == 'review_received';
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final notificationsAsync = ref.watch(notificationsControllerProvider);
    final textTheme = AppTypography.light;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Notifications',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.onSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              await ref.read(notificationsControllerProvider.notifier).clearAll();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('All notifications marked as read.'), backgroundColor: AppColors.secondary),
                );
              }
            },
            child: Text(
              'Clear All',
              style: textTheme.labelMedium?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Segmented Toggle Tab Selector
            Padding(
              padding: const EdgeInsets.all(AppSpacing.containerMargin),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceContainer,
                  borderRadius: AppRadius.lgR,
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _currentTab = NotificationTab.all),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _currentTab == NotificationTab.all ? Colors.white : Colors.transparent,
                            borderRadius: AppRadius.mdR,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'All',
                            style: textTheme.labelMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: _currentTab == NotificationTab.all ? AppColors.primary : AppColors.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => setState(() => _currentTab = NotificationTab.alerts),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          decoration: BoxDecoration(
                            color: _currentTab == NotificationTab.alerts ? Colors.white : Colors.transparent,
                            borderRadius: AppRadius.mdR,
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'Alerts',
                            style: textTheme.labelMedium?.copyWith(
                              fontWeight: FontWeight.w800,
                              color: _currentTab == NotificationTab.alerts ? AppColors.primary : AppColors.onSurfaceVariant,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Notifications List
            Expanded(
              child: RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () => ref.read(notificationsControllerProvider.notifier).refresh(),
                child: notificationsAsync.when(
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
                  error: (error, _) => SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    child: Padding(
                      padding: const EdgeInsets.all(32),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.wifi_off_rounded, size: 48, color: AppColors.outline),
                          const SizedBox(height: 12),
                          Text(error.toString(), textAlign: TextAlign.center, style: textTheme.bodyLarge),
                        ],
                      ),
                    ),
                  ),
                  data: (notifications) {
                    final filtered = _filterNotifications(notifications);
                    if (filtered.isEmpty) {
                      return ListView(
                        physics: const AlwaysScrollableScrollPhysics(),
                        children: [
                          SizedBox(height: MediaQuery.of(context).size.height * 0.25),
                          const Icon(Icons.notifications_none_rounded, size: 48, color: AppColors.outline),
                          const SizedBox(height: 8),
                          Center(
                            child: Text(
                              'No notifications found.',
                              style: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                            ),
                          ),
                        ],
                      );
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final item = filtered[index];

                        return GestureDetector(
                          onTap: () {
                            if (!item.isRead) {
                              ref.read(notificationsControllerProvider.notifier).markAsRead(item.id);
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: item.isRead ? Colors.white : AppColors.primary.withOpacity(0.04),
                              borderRadius: AppRadius.xlR,
                              border: Border.all(
                                color: item.isRead ? AppColors.outlineVariant.withOpacity(0.2) : AppColors.primary.withOpacity(0.15),
                                width: item.isRead ? 1.0 : 1.5,
                              ),
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Left Icon indicator based on notification type
                                Container(
                                  padding: const EdgeInsets.all(8),
                                  decoration: BoxDecoration(
                                    color: _getColorForType(item.type).withOpacity(0.08),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    _getIconForType(item.type),
                                    color: _getColorForType(item.type),
                                    size: 20,
                                  ),
                                ),
                                const SizedBox(width: 12),

                                // Notification Body Message
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        item.message,
                                        style: textTheme.bodyMedium?.copyWith(
                                          color: AppColors.onSurface,
                                          fontWeight: item.isRead ? FontWeight.w500 : FontWeight.w700,
                                          height: 1.3,
                                        ),
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        timeago.format(item.createdAt),
                                        style: textTheme.labelSmall?.copyWith(
                                          color: AppColors.outline,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),

                                // Right Unread Dot indicator
                                if (!item.isRead)
                                  Container(
                                    margin: const EdgeInsets.only(top: 4, left: 8),
                                    width: 8,
                                    height: 8,
                                    decoration: const BoxDecoration(
                                      color: AppColors.primary,
                                      shape: BoxShape.circle,
                                    ),
                                  ),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
