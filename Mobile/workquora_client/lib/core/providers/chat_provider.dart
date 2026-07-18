import 'package:flutter/foundation.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';
import '../utils/error_helper.dart';

/// Conversation-list state, shared by the Messages tab (ConversationsScreen)
/// and BottomNav's unread badge — single source of truth so the two never
/// disagree. Thread-level state (an open ChatScreen's messages) stays local
/// to that screen; only the list summary lives here.
class ChatProvider extends ChangeNotifier {
  List<dynamic> _conversations = [];
  bool _isLoading = false;
  String? _error;

  // Home and ConversationsScreen both fetch this on their own open — same
  // duplicate-GET shape as JobsProvider.fetchMyJobs. force:true (pull-to-
  // refresh, or the post-navigation-return refresh in app.dart's ClientShell)
  // always bypasses it.
  static const _freshWindow = Duration(seconds: 20);
  DateTime? _fetchedAt;

  List<dynamic> get conversations => _conversations;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalUnreadCount =>
      _conversations.fold<int>(0, (sum, c) => sum + ((c['unreadCount'] ?? 0) as int));

  Future<void> fetchConversations({bool force = false}) async {
    if (!force && _fetchedAt != null && DateTime.now().difference(_fetchedAt!) < _freshWindow) {
      return;
    }
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.conversations);
      _conversations = res.data['conversations'] as List? ?? [];
      _fetchedAt = DateTime.now();
    } catch (e) {
      _error = ErrorHelper.extractError(e);
    }
    _isLoading = false;
    notifyListeners();
  }

  // GET /messages/:jobId/:otherUserId marks those messages read as a
  // server-side side effect — called locally right after a thread's history
  // load succeeds, so the badge updates instantly without a re-fetch.
  void markConversationRead(String jobId, String otherUserId) {
    final idx = _conversations.indexWhere((c) => c['jobId']?.toString() == jobId && c['otherUserId']?.toString() == otherUserId);
    if (idx == -1) return;
    final convo = Map<String, dynamic>.from(_conversations[idx]);
    if ((convo['unreadCount'] ?? 0) == 0) return;
    convo['unreadCount'] = 0;
    _conversations[idx] = convo;
    notifyListeners();
  }

  // Called on logout (see app.dart) — otherwise a different account's next
  // login would briefly show the previous account's conversation list and
  // unread badge until the first fetchConversations() overwrites it.
  void reset() {
    _conversations = [];
    _isLoading = false;
    _error = null;
    _fetchedAt = null;
    notifyListeners();
  }
}
