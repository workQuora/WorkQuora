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

  // Home and NotificationsScreen both fetch this on their own open — same
  // duplicate-GET shape as JobsProvider.fetchMyJobs. force:true (pull-to-
  // refresh) always bypasses it.
  static const _freshWindow = Duration(seconds: 20);
  DateTime? _fetchedAt;

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

  // There's no dedicated "proposal received" notification type on the
  // backend (Backend/src/models/Notification.js's enum has no such value) —
  // proposalController.js's submitProposal sends it as a generic
  // type:'system_alert' with a fixed message ("Worker X is bidding you").
  // Clients see every incoming proposal directly on the job's own screen, so
  // this one is filtered out here; other system_alert notifications (job
  // cancelled, proposal rejected, etc.) are unaffected.
  bool _isProposalNotification(dynamic n) =>
      n is Map && n['type'] == 'system_alert' && (n['message']?.toString().toLowerCase().contains('bidding') ?? false);

  Future<void> fetchNotifications({bool force = false}) async {
    if (!force && _fetchedAt != null && DateTime.now().difference(_fetchedAt!) < _freshWindow) {
      return;
    }
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.notifications);
      final raw = res.data['data'] ?? res.data['notifications'] ?? [];
      _notifications = (raw as List).where((n) => !_isProposalNotification(n)).toList();
      _fetchedAt = DateTime.now();
    } catch (_) {
      _error = 'Failed to load notifications';
    }
    _isLoading = false;
    notifyListeners();
  }

  void _subscribeToLive() {
    SocketService().offReceiveNotification();
    SocketService().onReceiveNotification((data) {
      if (_isProposalNotification(data)) return;
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
