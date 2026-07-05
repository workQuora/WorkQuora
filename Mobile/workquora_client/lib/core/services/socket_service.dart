import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

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

    _socket!.onConnect((_) => debugPrint('[Socket] Connected'));
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
}
