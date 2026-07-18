import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

// Surfaces the real backend error (status + response body) in a visible
// SnackBar instead of just the console, for spots still being diagnosed on
// a physical device where `flutter logs` isn't handy mid-test. Flutter's own
// kDebugMode is always false for `flutter build apk --release` — the build
// used for every test APK in this project — so gating on it would make this
// a no-op for the exact installs it's meant to help debug. Flip to false
// once a failure spot's root cause is confirmed fixed, and to false for good
// before a real Play Store release.
const bool kVerboseErrors = true;

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

  /// Long-form: real status code + raw response body, for kVerboseErrors
  /// SnackBars. extractError() above stays the short, polished message used
  /// everywhere else.
  static String debugDetail(dynamic error) {
    if (error is DioException) {
      return '${error.requestOptions.method} ${error.requestOptions.path} → '
          '${error.response?.statusCode ?? "no response"}: ${error.response?.data ?? error.message}';
    }
    return error.toString();
  }
}
