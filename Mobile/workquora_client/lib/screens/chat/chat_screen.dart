import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/chat_provider.dart';
import '../../core/services/socket_service.dart';
import '../../core/utils/error_helper.dart';
import '../../theme/app_theme.dart';

const _kMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

class ChatScreen extends StatefulWidget {
  final String jobId;
  final String otherUserId;
  final String otherUserName;
  final String? otherUserAvatar;

  const ChatScreen({
    super.key,
    required this.jobId,
    required this.otherUserId,
    required this.otherUserName,
    this.otherUserAvatar,
  });

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  bool _isOtherTyping = false;
  bool _isSending = false;
  Timer? _typingTimer;
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final SocketService _socket = SocketService();

  String get _myId {
    final user = context.read<AuthProvider>().user;
    return user?['_id']?.toString() ?? user?['id']?.toString() ?? '';
  }

  @override
  void initState() {
    super.initState();
    _loadHistory();
    _setupSocket();
    // Re-join + re-subscribe on every reconnect, not just the initial join —
    // a reconnect after the socket was suspended/killed in the background
    // can be a brand-new underlying connection server-side, which doesn't
    // remember this room membership.
    _socket.addOnConnectListener(_setupSocket);
  }

  Future<void> _loadHistory() async {
    try {
      final res = await DioClient.instance.dio.get('/messages/${widget.jobId}/${widget.otherUserId}');
      // Response: { success, data: [...messages] } sorted oldest→newest.
      // Reversed here since the list is rendered with reverse: true.
      if (!mounted) return;
      setState(() {
        _messages = List<Map<String, dynamic>>.from((res.data['data'] as List).reversed);
        _isLoading = false;
      });
      // GET /messages/:jobId/:otherUserId marks these read server-side as a
      // side effect — reflect that locally so the Messages badge updates
      // instantly without a round trip.
      context.read<ChatProvider>().markConversationRead(widget.jobId, widget.otherUserId);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isLoading = false);
      final tokens = Theme.of(context).extension<AppTokens>()!;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorHelper.extractError(e)), backgroundColor: tokens.danger));
    }
  }

  // Called on the initial screen open AND on every socket reconnect (see
  // addOnConnectListener above) — off() before on() keeps it idempotent
  // either way, since a reconnect might reuse the same underlying listener
  // registrations or might be a brand-new socket object entirely.
  void _setupSocket() {
    _socket.joinRoom(widget.jobId, widget.otherUserId);

    _socket.offReceiveMessage();
    _socket.offTypingStatus();
    _socket.onReceiveMessage((data) {
      if (!mounted) return;
      final senderId = data['senderId']?.toString() ?? data['sender']?.toString();
      if (senderId != _myId) {
        setState(() => _messages.insert(0, data));
        _socket.emitMarkRead(widget.jobId, widget.otherUserId);
      }
    });

    _socket.onTypingStatus((data) {
      if (!mounted) return;
      final userId = data['userId']?.toString();
      if (userId != _myId) {
        setState(() => _isOtherTyping = data['isTyping'] == true);
      }
    });
  }

  @override
  void dispose() {
    _socket.removeOnConnectListener(_setupSocket);
    _socket.leaveRoom(widget.jobId, widget.otherUserId);
    _socket.offReceiveMessage();
    _socket.offTypingStatus();
    _controller.dispose();
    _scrollController.dispose();
    _typingTimer?.cancel();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _controller.text.trim();
    if (text.isEmpty || _isSending) return;

    final tempId = DateTime.now().millisecondsSinceEpoch.toString();
    final myId = _myId;

    setState(() {
      _isSending = true;
      _messages.insert(0, {
        '_id': tempId,
        'text': text,
        'sender': myId,
        'senderId': myId,
        'createdAt': DateTime.now().toIso8601String(),
        '_pending': true,
      });
    });
    _controller.clear();

    try {
      final res = await DioClient.instance.dio.post(
        ApiConstants.sendMessage,
        data: {
          'receiverId': widget.otherUserId,
          'jobId': widget.jobId,
          'text': text, // field name is 'text', not 'content'
        },
      );

      final confirmed = res.data['data'] as Map<String, dynamic>;
      if (!mounted) return;
      setState(() {
        final idx = _messages.indexWhere((m) => m['_id'] == tempId);
        if (idx != -1) _messages[idx] = confirmed;
        _isSending = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _messages.removeWhere((m) => m['_id'] == tempId);
        _isSending = false;
      });
      final tokens = Theme.of(context).extension<AppTokens>()!;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorHelper.extractError(e)), backgroundColor: tokens.danger));
    }
  }

  void _onTextChanged(String text) {
    final myId = _myId;
    _socket.emitTyping(jobId: widget.jobId, otherUserId: widget.otherUserId, myUserId: myId, isTyping: text.isNotEmpty);
    _typingTimer?.cancel();
    if (text.isNotEmpty) {
      _typingTimer = Timer(const Duration(seconds: 2), () {
        _socket.emitTyping(jobId: widget.jobId, otherUserId: widget.otherUserId, myUserId: myId, isTyping: false);
      });
    }
  }

  String _formatTime(String? iso) {
    if (iso == null) return '';
    final dt = DateTime.tryParse(iso);
    if (dt == null) return '';
    final local = dt.toLocal();
    final h = local.hour.toString().padLeft(2, '0');
    final m = local.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  DateTime? _dateOnly(Map<String, dynamic> msg) {
    final iso = msg['createdAt']?.toString() ?? msg['timestamp']?.toString();
    final dt = DateTime.tryParse(iso ?? '')?.toLocal();
    if (dt == null) return null;
    return DateTime(dt.year, dt.month, dt.day);
  }

  String _dateLabel(DateTime day) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final diff = today.difference(day).inDays;
    if (diff == 0) return 'Today';
    if (diff == 1) return 'Yesterday';
    return '${day.day} ${_kMonths[day.month - 1]}${day.year != now.year ? ' ${day.year}' : ''}';
  }

  // _messages is newest-first (index 0 = newest, rendered at the bottom by
  // the reversed ListView). Builds the same newest-first list interleaved
  // with date-separator markers, each placed right after the last message
  // of its day — which renders directly above that day's first message
  // once the list is flipped back to visual top-to-bottom order.
  List<_ChatRow> _buildRows() {
    final rows = <_ChatRow>[];
    DateTime? lastDate;
    for (final msg in _messages) {
      final day = _dateOnly(msg);
      if (lastDate != null && day != null && day != lastDate) {
        rows.add(_ChatRow.date(lastDate));
      }
      rows.add(_ChatRow.message(msg));
      lastDate = day ?? lastDate;
    }
    if (lastDate != null) rows.add(_ChatRow.date(lastDate));
    return rows;
  }

  Widget _buildMessageBubble(BuildContext context, Map<String, dynamic> msg) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final isMe = (msg['sender'] ?? msg['senderId'])?.toString() == _myId;
    final isPending = msg['_pending'] == true;
    final text = msg['text']?.toString() ?? '';
    final time = _formatTime(msg['createdAt']?.toString() ?? msg['timestamp']?.toString());

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: EdgeInsets.only(left: isMe ? 60 : 4, right: isMe ? 4 : 60, bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: AppSpace.md, vertical: AppSpace.sm),
        decoration: BoxDecoration(
          color: isMe ? theme.colorScheme.primary : tokens.chipBg,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.end,
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(text, style: theme.textTheme.bodyMedium?.copyWith(color: isMe ? Colors.white : theme.colorScheme.onSurface)),
            const SizedBox(height: 4),
            Row(mainAxisSize: MainAxisSize.min, children: [
              Text(time, style: theme.textTheme.labelSmall?.copyWith(color: isMe ? Colors.white70 : tokens.muted, fontSize: 10)),
              if (isMe && isPending) ...[
                const SizedBox(width: 4),
                const Icon(Icons.access_time_rounded, size: 10, color: Colors.white70),
              ] else if (isMe) ...[
                const SizedBox(width: 4),
                const Icon(Icons.done_all_rounded, size: 10, color: Colors.white70),
              ],
            ]),
          ],
        ),
      ),
    );
  }

  Widget _buildDateSeparator(BuildContext context, DateTime day) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: AppSpace.md),
      child: Center(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.md, vertical: 4),
          decoration: BoxDecoration(color: tokens.chipBg, borderRadius: BorderRadius.circular(AppRadius.chip)),
          child: Text(_dateLabel(day), style: theme.textTheme.labelSmall?.copyWith(color: tokens.chipText, fontWeight: FontWeight.w600)),
        ),
      ),
    );
  }

  Widget _buildInputBar(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return Container(
      padding: const EdgeInsets.fromLTRB(AppSpace.md, AppSpace.sm, AppSpace.sm, AppSpace.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        border: Border(top: BorderSide(color: tokens.border, width: 0.5)),
      ),
      child: SafeArea(
        top: false,
        child: Row(children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(color: tokens.chipBg, borderRadius: BorderRadius.circular(24)),
              child: TextField(
                controller: _controller,
                onChanged: _onTextChanged,
                maxLines: 4,
                minLines: 1,
                style: theme.textTheme.bodyMedium,
                decoration: const InputDecoration(
                  hintText: 'Type a message…',
                  filled: false,
                  border: InputBorder.none,
                  contentPadding: EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: AppSpace.sm),
                ),
              ),
            ),
          ),
          const SizedBox(width: AppSpace.sm),
          GestureDetector(
            onTap: _sendMessage,
            child: Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(color: theme.colorScheme.primary, shape: BoxShape.circle),
              child: _isSending
                  ? const Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.send_rounded, color: Colors.white, size: 20),
            ),
          ),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final avatar = widget.otherUserAvatar ?? '';
    final rows = _buildRows();

    return Scaffold(
      appBar: AppBar(
        title: Row(children: [
          CircleAvatar(
            radius: 18,
            backgroundColor: tokens.brandSoft,
            backgroundImage: avatar.isNotEmpty ? CachedNetworkImageProvider(avatar) : null,
            child: avatar.isEmpty
                ? Text(widget.otherUserName.isNotEmpty ? widget.otherUserName[0].toUpperCase() : 'U', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 14))
                : null,
          ),
          const SizedBox(width: AppSpace.sm),
          Expanded(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text(widget.otherUserName, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
              Text('WorkQuora Chat', style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
            ]),
          ),
        ]),
      ),
      body: Column(children: [
        Expanded(
          child: _isLoading
              ? Center(child: CircularProgressIndicator(color: theme.colorScheme.primary))
              : rows.isEmpty
                  ? Center(
                      child: Text('Say hello to ${widget.otherUserName} 👋', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
                    )
                  : ListView.builder(
                      controller: _scrollController,
                      reverse: true,
                      padding: const EdgeInsets.all(AppSpace.md),
                      itemCount: rows.length,
                      itemBuilder: (ctx, i) {
                        final row = rows[i];
                        return row.isDate ? _buildDateSeparator(ctx, row.date!) : _buildMessageBubble(ctx, row.message!);
                      },
                    ),
        ),
        if (_isOtherTyping)
          Padding(
            padding: const EdgeInsets.only(left: AppSpace.lg, bottom: AppSpace.xs),
            child: Row(mainAxisSize: MainAxisSize.min, children: [
              Text('${widget.otherUserName} is typing', style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
              const SizedBox(width: AppSpace.xs),
              _TypingDots(color: tokens.muted),
            ]),
          ),
        _buildInputBar(context),
      ]),
    );
  }
}

class _ChatRow {
  final Map<String, dynamic>? message;
  final DateTime? date;
  bool get isDate => date != null;
  _ChatRow.message(this.message) : date = null;
  _ChatRow.date(this.date) : message = null;
}

class _TypingDots extends StatefulWidget {
  final Color color;
  const _TypingDots({required this.color});
  @override
  State<_TypingDots> createState() => _TypingDotsState();
}

class _TypingDotsState extends State<_TypingDots> with SingleTickerProviderStateMixin {
  late AnimationController _ac;
  int _dot = 0;

  @override
  void initState() {
    super.initState();
    _ac = AnimationController(vsync: this, duration: const Duration(milliseconds: 500))
      ..addListener(() {
        if (_ac.status == AnimationStatus.completed) {
          setState(() => _dot = (_dot + 1) % 3);
          _ac.reset();
          _ac.forward();
        }
      });
    _ac.forward();
  }

  @override
  void dispose() {
    _ac.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(
        3,
        (i) => Container(
          width: 4,
          height: 4,
          margin: const EdgeInsets.symmetric(horizontal: 1),
          decoration: BoxDecoration(color: i == _dot ? widget.color : widget.color.withValues(alpha: 0.3), shape: BoxShape.circle),
        ),
      ),
    );
  }
}
