import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

class ErrorHelper {
  static String extractError(dynamic error) {
    if (error is DioException) {
      // The UI only ever sees the short message below — without this, a
      // real failure (wrong field name, 413, expired token, backend 500)
      // was indistinguishable from any other and had to be guessed at
      // instead of read from `flutter logs`/the debug console.
      debugPrint('[API Error] ${error.requestOptions.method} ${error.requestOptions.path} '
          '-> ${error.response?.statusCode}: ${error.response?.data}');
      return error.response?.data?['message'] ?? error.message ?? 'Something went wrong';
    }
    debugPrint('[API Error] $error');
    return error.toString();
  }
}
