import 'dart:async';
import 'dart:js_interop';
import 'package:flutter/foundation.dart';
import 'package:web/web.dart' as web;

// geolocator has no web implementation — the browser's own navigator.geolocation
// is used instead. getCurrentPosition() itself triggers the browser's native
// permission prompt, so there's no separate permission-check step needed here.
Future<Map<String, double>?> getPlatformLocation() async {
  final completer = Completer<Map<String, double>?>();

  try {
    debugPrint('[GPS Web] Requesting position...');
    web.window.navigator.geolocation.getCurrentPosition(
      ((web.GeolocationPosition pos) {
        debugPrint('[GPS Web] Got position: ${pos.coords.latitude}, ${pos.coords.longitude}');
        if (!completer.isCompleted) {
          completer.complete({
            'lat': pos.coords.latitude,
            'lng': pos.coords.longitude,
          });
        }
      }).toJS,
      ((web.GeolocationPositionError err) {
        // err.code: 1 = PERMISSION_DENIED, 2 = POSITION_UNAVAILABLE, 3 = TIMEOUT
        debugPrint('[GPS Web] Error: code=${err.code} message=${err.message}');
        if (!completer.isCompleted) completer.complete(null);
      }).toJS,
    );
  } catch (e) {
    debugPrint('[GPS Web] Exception: $e');
    if (!completer.isCompleted) completer.complete(null);
  }

  return completer.future.timeout(
    const Duration(seconds: 15),
    onTimeout: () {
      debugPrint('[GPS Web] Timed out after 15s');
      return null;
    },
  );
}
