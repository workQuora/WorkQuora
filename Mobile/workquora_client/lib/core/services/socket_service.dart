import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  // Fires on every successful (re)connect — the initial one, socket.io's own
  // automatic transport-level reconnection, AND a fresh connect() call made
  // after reconnection attempts were exhausted (e.g. the app was backgrounded
  // long enough that the OS suspended the socket and setReconnectionAttempts
  // ran out). A reconnect in the last two cases can mean a brand-new
  // underlying connection server-side, which does NOT remember previously
  // `.join()`-ed rooms — anything that depends on room membership or a live
  // listener re-establishes itself here rather than assuming a join/listen
  // from screen-open time survives indefinitely. Deliberately NOT cleared in
  // disconnect(): NotificationsProvider registers once for its own lifetime
  // (== the app's), so it must still fire after a later logout/login cycle.
  final List<void Function()> _onConnectListeners = [];

  void addOnConnectListener(void Function() callback) => _onConnectListeners.add(callback);
  void removeOnConnectListener(void Function() callback) => _onConnectListeners.remove(callback);

  void connect(String token) {
    if (_socket?.connected == true) return;

    // Socket connects to the base server URL (no /api/v1 path) — derived from
    // ApiConstants.baseUrl so REST and socket always target the same backend.
    final socketUrl = ApiConstants.baseUrl.replaceAll('/api/v1', '').replaceAll('/api', '');

    _socket = IO.io(
      socketUrl,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .setAuth({'token': token})
          .disableAutoConnect()
          .enableReconnection()
          .setReconnectionAttempts(5)
          .build(),
    );

    _socket!.connect();

    _socket!.onConnect((_) {
      debugPrint('[Socket] Connected');
      for (final cb in List<void Function()>.of(_onConnectListeners)) {
        cb();
      }
    });
    _socket!.onDisconnect((_) => debugPrint('[Socket] Disconnected'));
    _socket!.onConnectError((e) => debugPrint('[Socket] Error: $e'));
    // No 'setup' emit needed — the server auto-joins the personal room
    // (socket.join(socket.userId)) unconditionally on connection, since
    // socket.userId is already resolved by the io.use() auth middleware
    // before chatSocketHandler's connection callback runs.
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }

  // roomId = '${jobId}_${otherUserId}' — join OTHER user's room
  void joinRoom(String jobId, String otherUserId) {
    final roomId = '${jobId}_$otherUserId';
    _socket?.emit('join_room', {'roomId': roomId});
    debugPrint('[Socket] Joined room: $roomId');
  }

  void leaveRoom(String jobId, String otherUserId) {
    final roomId = '${jobId}_$otherUserId';
    _socket?.emit('leave_room', {'roomId': roomId});
  }

  // Listen for incoming messages
  // Event: 'receive_message' (NOT 'new_message')
  void onReceiveMessage(Function(Map<String, dynamic>) callback) {
    _socket?.on('receive_message', (data) {
      debugPrint('[Socket] receive_message: $data');
      if (data is Map<String, dynamic>) callback(data);
    });
  }

  void offReceiveMessage() => _socket?.off('receive_message');

  // Typing indicator
  // Event: 'typing_status' with { roomId, userId, isTyping }
  void emitTyping({
    required String jobId,
    required String otherUserId,
    required String myUserId,
    required bool isTyping,
  }) {
    final roomId = '${jobId}_$otherUserId';
    _socket?.emit('typing_status', {
      'roomId': roomId,
      'userId': myUserId,
      'isTyping': isTyping,
    });
  }

  void onTypingStatus(Function(Map<String, dynamic>) callback) {
    _socket?.on('typing_status', (data) {
      if (data is Map<String, dynamic>) callback(data);
    });
  }

  void offTypingStatus() => _socket?.off('typing_status');

  // Delivery and read acks
  void onMessagesDelivered(Function(Map<String, dynamic>) callback) {
    _socket?.on('messages_delivered', (data) {
      if (data is Map<String, dynamic>) callback(data);
    });
  }

  void onMessagesRead(Function(Map<String, dynamic>) callback) {
    _socket?.on('messages_read', (data) {
      if (data is Map<String, dynamic>) callback(data);
    });
  }

  void emitMarkRead(String jobId, String senderId) {
    _socket?.emit('mark_read', {'jobId': jobId, 'senderId': senderId});
  }

  void offAll() {
    _socket?.off('receive_message');
    _socket?.off('typing_status');
    _socket?.off('messages_delivered');
    _socket?.off('messages_read');
  }

  // Live job-tracking room (Backend/src/Sockets/socketHandler.js). The
  // server authorizes the join against the job's client/assignedTo before
  // adding the socket to room `jobId`; only the assigned freelancer is
  // allowed to emit 'send_location' into it, which the server rebroadcasts
  // to the room as 'receive_location'. The client only ever listens here —
  // it never emits 'send_location' itself.
  void joinJobRoom(String jobId) {
    _socket?.emit('join_job_room', jobId);
    debugPrint('[Socket] Joined job room: $jobId');
  }

  // There is no 'leave_job_room' handler on the backend (unlike chat's
  // 'leave_room'), so there's nothing meaningful to emit here — the socket
  // simply stays joined to the room server-side until it disconnects.
  // "Unsubscribing" client-side means removing the local listener below so
  // this screen stops reacting to further broadcasts once it's gone.
  void onReceiveLocation(Function(Map<String, dynamic>) callback) {
    _socket?.on('receive_location', (data) {
      if (data is Map<String, dynamic>) callback(data);
    });
  }

  void offReceiveLocation() => _socket?.off('receive_location');

  // Every user auto-joins their own personal room (their user id) on
  // connect (Backend/src/Sockets/socketHandler.js — see connect()'s doc
  // comment above), and Backend/src/utils/notification.js broadcasts
  // 'receive_notification' to that room whenever any createNotification()
  // call fires. No join needed here — just listen.
  void onReceiveNotification(Function(Map<String, dynamic>) callback) {
    _socket?.on('receive_notification', (data) {
      if (data is Map<String, dynamic>) callback(data);
    });
  }

  void offReceiveNotification() => _socket?.off('receive_notification');
}
