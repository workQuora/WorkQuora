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

  NotificationsProvider() {
    // Registered once for this provider's whole lifetime (== the app's —
    // it's never recreated across logout/login). Fires on every socket
    // connect: the first one after login, and any later reconnect (app
    // resumed after the socket was suspended/killed in the background, or a
    // fresh login after a previous logout). _subscribeToLive() itself is
    // idempotent (off() before on()), so it's safe even if 'connect' fires
    // more than once without an intervening disconnect.
    SocketService().addOnConnectListener(_subscribeToLive);
  }

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
  }

  void _subscribeToLive() {
    SocketService().offReceiveNotification();
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

  // Called on logout (see app.dart) — otherwise a different account's next
  // login would briefly show the previous account's notifications and
  // unread badge until the first fetchNotifications() overwrites it. The
  // live-listener itself doesn't need re-registering here (addOnConnectListener
  // was only ever called once, in the constructor, and keeps firing on every
  // future connect regardless of how many logout/login cycles happen).
  void reset() {
    _notifications = [];
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}
