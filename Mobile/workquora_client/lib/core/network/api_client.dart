import 'dart:async';
import 'package:dio/dio.dart';
import 'package:pretty_dio_logger/pretty_dio_logger.dart';
import '../storage/secure_storage_service.dart';
import 'api_endpoints.dart';

/// Single Dio instance for the whole app. Handles:
///  - attaching the access token to every request
///  - silent refresh on 401 using the rotated refresh token
///    (backend rotates BOTH tokens each refresh — see authController.refreshSession)
///  - single-flight refresh: if 5 requests 401 at once, only ONE refresh call
///    fires; the rest wait on it. This matters a lot at 10M-user scale —
///    without this, a token expiry storm can hammer the auth service.
class ApiClient {
  ApiClient(this._secureStorage) {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiEndpoints.baseUrl,
        connectTimeout: const Duration(seconds: 60),
        receiveTimeout: const Duration(seconds: 60),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final token = await _secureStorage.accessToken;
          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          handler.next(options);
        },
        onError: (error, handler) async {
          final isUnauthorized = error.response?.statusCode == 401;
          final isRefreshCall = error.requestOptions.path == ApiEndpoints.refresh;

          if (isUnauthorized && !isRefreshCall) {
            try {
              final newAccessToken = await _refreshAccessToken();
              if (newAccessToken != null) {
                final retryRequest = error.requestOptions;
                retryRequest.headers['Authorization'] = 'Bearer $newAccessToken';
                final response = await _dio.fetch(retryRequest);
                return handler.resolve(response);
              }
            } catch (_) {
              // fall through to original error — caller treats as logged-out
            }
          }
          handler.next(error);
        },
      ),
    );

    assert(() {
      _dio.interceptors.add(PrettyDioLogger(requestBody: true, responseBody: true, compact: true));
      return true;
    }());
  }

  late final Dio _dio;
  final SecureStorageService _secureStorage;

  Completer<String?>? _refreshCompleter;

  /// Ensures only ONE /auth/refresh call is in-flight at a time, regardless
  /// of how many parallel requests 401'd simultaneously.
  Future<String?> _refreshAccessToken() async {
    if (_refreshCompleter != null) {
      return _refreshCompleter!.future;
    }
    _refreshCompleter = Completer<String?>();

    try {
      final refreshToken = await _secureStorage.refreshToken;
      if (refreshToken == null) {
        _refreshCompleter!.complete(null);
        return null;
      }

      final response = await Dio(BaseOptions(baseUrl: ApiEndpoints.baseUrl)).post(
        ApiEndpoints.refresh,
        data: {'refreshToken': refreshToken},
      );

      final data = response.data as Map<String, dynamic>;
      final newAccessToken = data['token'] as String?;
      final newRefreshToken = data['refreshToken'] as String?;

      if (newAccessToken != null && newRefreshToken != null) {
        await _secureStorage.saveTokens(accessToken: newAccessToken, refreshToken: newRefreshToken);
        _refreshCompleter!.complete(newAccessToken);
        return newAccessToken;
      }

      await _secureStorage.clear();
      _refreshCompleter!.complete(null);
      return null;
    } catch (e) {
      await _secureStorage.clear();
      _refreshCompleter!.complete(null);
      rethrow;
    } finally {
      _refreshCompleter = null;
    }
  }

  Dio get dio => _dio;
}
