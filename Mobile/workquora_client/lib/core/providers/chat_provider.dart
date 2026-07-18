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

  List<dynamic> get conversations => _conversations;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get totalUnreadCount =>
      _conversations.fold<int>(0, (sum, c) => sum + ((c['unreadCount'] ?? 0) as int));

  Future<void> fetchConversations() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.conversations);
      _conversations = res.data['conversations'] as List? ?? [];
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
}
