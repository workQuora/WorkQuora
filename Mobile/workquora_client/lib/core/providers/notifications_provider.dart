import 'package:flutter/foundation.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';
import '../services/socket_service.dart';

/// Notifications list — single source of truth for both the Notifications
/// screen and the app bar's unread bell dot (AppBarBrand reads
/// [unreadCount] directly), so the two can never disagree.
class NotificationsProvider extends ChangeNotifier {
  List<dynamic> _notifications = [];
  bool _isLoading = false;
  String? _error;
  // Guards against SocketService.onReceiveNotification() being called more
  // than once — fetchNotifications() runs on every pull-to-refresh, but
  // SocketService.on() stacks listeners rather than replacing them, so a
  // careless re-subscribe there would double (then triple, ...) live inserts.
  bool _socketSubscribed = false;

  List<dynamic> get notifications => _notifications;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get unreadCount => _notifications.where((n) => n['isRead'] != true).length;

  Future<void> fetchNotifications() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.notifications);
      _notifications = res.data['data'] ?? res.data['notifications'] ?? [];
    } catch (_) {
      _error = 'Failed to load notifications';
    }
    _isLoading = false;
    notifyListeners();
    // Only actually attaches once the socket exists (post-login) — see the
    // guard comment on the field above for why this lives here rather than
    // in the constructor, which runs before login at app start.
    _subscribeToLive();
  }

  void _subscribeToLive() {
    if (_socketSubscribed) return;
    if (!SocketService().isConnected) return;
    _socketSubscribed = true;
    SocketService().onReceiveNotification((data) {
      _notifications = [data, ..._notifications];
      notifyListeners();
    });
  }

  // Optimistic — the local read-state flips immediately so the tile and the
  // bell badge update without waiting on the network; a failed sync leaves
  // the optimistic update in place rather than rolling it back, matching
  // the same non-fatal-sync tolerance already used for chat's mark-read.
  Future<void> markAsRead(String id) async {
    final idx = _notifications.indexWhere((n) => n['_id']?.toString() == id);
    if (idx != -1 && _notifications[idx]['isRead'] != true) {
      _notifications[idx] = {..._notifications[idx] as Map, 'isRead': true};
      notifyListeners();
    }
    try {
      // Backend route is PATCH, not PUT — this used to be a silent 404.
      await DioClient.instance.dio.patch('${ApiConstants.notifications}/$id/read');
    } catch (_) {
      // Non-fatal — optimistic update stands even if the sync failed.
    }
  }

  Future<void> markAllRead() async {
    final hadUnread = _notifications.any((n) => n['isRead'] != true);
    if (hadUnread) {
      _notifications = _notifications.map((n) => {...n as Map, 'isRead': true}).toList();
      notifyListeners();
    }
    try {
      // Backend route is PATCH, not PUT — this used to be a silent 404.
      await DioClient.instance.dio.patch(ApiConstants.markAllRead);
    } catch (_) {
      // Non-fatal — optimistic update stands even if the sync failed.
    }
  }
}
