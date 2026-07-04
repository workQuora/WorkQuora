import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

Future<Map<String, double>?> getPlatformLocation() async {
  try {
    debugPrint('[GPS Mobile] Checking if location service enabled...');
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('[GPS Mobile] Location services are OFF');
      await Geolocator.openLocationSettings();
      return null;
    }

    debugPrint('[GPS Mobile] Checking permission...');
    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      debugPrint('[GPS Mobile] Permission denied — requesting...');
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('[GPS Mobile] Permission denied by user');
        return null;
      }
    }
    if (permission == LocationPermission.deniedForever) {
      debugPrint('[GPS Mobile] Permission permanently denied');
      await Geolocator.openAppSettings();
      return null;
    }

    debugPrint('[GPS Mobile] Permission granted: $permission');
    debugPrint('[GPS Mobile] Getting current position...');

    final locationSettings = Platform.isAndroid
        ? AndroidSettings(
            accuracy: LocationAccuracy.medium,
            timeLimit: const Duration(seconds: 15),
          )
        : AppleSettings(
            accuracy: LocationAccuracy.medium,
            activityType: ActivityType.other,
            pauseLocationUpdatesAutomatically: false,
          );

    final position = await Geolocator.getCurrentPosition(locationSettings: locationSettings);

    debugPrint('[GPS Mobile] Got position: ${position.latitude}, ${position.longitude}');

    return {'lat': position.latitude, 'lng': position.longitude};
  } catch (e) {
    debugPrint('[GPS Mobile] Error: $e');
    return null;
  }
}
