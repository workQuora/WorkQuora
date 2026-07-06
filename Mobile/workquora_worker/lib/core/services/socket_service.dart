import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';

// Worker-app socket connection — mirrors the client app's connect/disconnect
// shape (same backend, same auth handshake) but is its own implementation.
class SocketService {
  static final SocketService _instance = SocketService._internal();
  factory SocketService() => _instance;
  SocketService._internal();

  IO.Socket? _socket;
  bool get isConnected => _socket?.connected ?? false;

  void connect(String token) {
    if (_socket?.connected == true) return;

    // Socket connects to the base server URL (no /api/v1 path), derived from
    // ApiConstants.baseUrl so REST and socket always hit the same backend.
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
    _socket!.onConnect((_) => debugPrint('[WorkerSocket] Connected'));
    _socket!.onDisconnect((_) => debugPrint('[WorkerSocket] Disconnected'));
    _socket!.onConnectError((e) => debugPrint('[WorkerSocket] Error: $e'));
  }

  void disconnect() {
    _socket?.disconnect();
    _socket?.dispose();
    _socket = null;
  }
}
