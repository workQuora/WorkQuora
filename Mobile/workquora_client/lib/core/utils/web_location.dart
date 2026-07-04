import 'dart:async';
import 'dart:js_interop';
import 'package:web/web.dart' as web;

// geolocator has no web implementation — the browser's own navigator.geolocation
// is used instead. getCurrentPosition() itself triggers the browser's native
// permission prompt, so there's no separate permission-check step needed here.
Future<Map<String, double>?> getPlatformLocation() async {
  final completer = Completer<Map<String, double>?>();

  try {
    web.window.navigator.geolocation.getCurrentPosition(
      ((web.GeolocationPosition pos) {
        if (!completer.isCompleted) {
          completer.complete({
            'lat': pos.coords.latitude,
            'lng': pos.coords.longitude,
          });
        }
      }).toJS,
      ((web.GeolocationPositionError err) {
        if (!completer.isCompleted) completer.complete(null);
      }).toJS,
    );
  } catch (_) {
    if (!completer.isCompleted) completer.complete(null);
  }

  return completer.future.timeout(
    const Duration(seconds: 15),
    onTimeout: () => null,
  );
}
