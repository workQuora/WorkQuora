import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../constants/api_constants.dart';

class DioClient {
  static final DioClient instance = DioClient._internal();
  DioClient._internal();

  late Dio dio;
  final _storage = const FlutterSecureStorage();

  /// Set by the app root (where the router and AuthProvider live) so a 401
  /// can force a clean logout + redirect without DioClient depending on
  /// Provider or go_router directly.
  VoidCallback? onSessionExpired;

  void init() {
    dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'auth_token');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await _storage.delete(key: 'auth_token');
          onSessionExpired?.call();
        }
        return handler.next(error);
      },
    ));
  }

  Future<String?> getToken() => _storage.read(key: 'auth_token');
  Future<void> saveToken(String token) => _storage.write(key: 'auth_token', value: token);
  Future<void> clearToken() => _storage.delete(key: 'auth_token');
}
