import 'dart:async';
import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/location/location_service.dart';
import '../../../core/network/api_endpoints.dart';
import '../../../core/network/core_providers.dart';

class HomeLocationState {
  const HomeLocationState({
    this.loading = true,
    this.lat,
    this.lng,
    this.city = 'Detecting…',
    this.error,
  });

  final bool loading;
  final double? lat;
  final double? lng;
  final String city;
  final String? error;

  bool get hasLocation => lat != null && lng != null;
}

/// Detects the recruiter's current location when Home loads, reverse-geocodes
/// it to a readable label, and persists it to the backend
/// (PUT /geo/update-location) — mirrors the web app's useGeolocation hook.
///
/// If auto-detection fails (permission denied, GPS off, browser blocked it),
/// the chip on Home shows "Tap to set location". Tapping it calls [retry],
/// which re-requests permission and re-attempts detection — that's the
/// manual fallback for when auto location doesn't come through.
class HomeLocationController extends Notifier<HomeLocationState> {
  @override
  HomeLocationState build() {
    Future.microtask(_detect);
    return const HomeLocationState();
  }

  Future<void> _detect() async {
    state = const HomeLocationState(loading: true, city: 'Detecting…');
    try {
      final pos = await LocationService().getCurrentPosition();
      final city = await _reverseGeocode(pos.lat, pos.lng);
      state = HomeLocationState(loading: false, lat: pos.lat, lng: pos.lng, city: city);
      unawaited(_persist(pos.lat, pos.lng, city));
    } on LocationFailure catch (e) {
      state = HomeLocationState(loading: false, city: 'Tap to set location', error: e.message);
    } catch (_) {
      state = const HomeLocationState(
        loading: false,
        city: 'Tap to set location',
        error: 'Could not detect your location.',
      );
    }
  }

  Future<String> _reverseGeocode(double lat, double lng) async {
    try {
      // Same free, keyless reverse-geocoding API the web client already uses
      // (hooks/useGeolocation.js) — kept consistent across platforms.
      final res = await Dio().get(
        'https://api.bigdatacloud.net/data/reverse-geocode-client',
        queryParameters: {'latitude': lat, 'longitude': lng, 'localityLanguage': 'en'},
      );
      final data = res.data as Map<String, dynamic>;
      final city = (data['city'] as String?)?.trim();
      final locality = (data['locality'] as String?)?.trim();
      final country = (data['countryName'] as String?)?.trim();
      if (city != null && city.isNotEmpty) return city;
      if (locality != null && locality.isNotEmpty) return locality;
      if (country != null && country.isNotEmpty) return country;
      return 'Location detected';
    } catch (_) {
      return 'Location detected';
    }
  }

  /// Non-critical — like the web app, a failed persist shouldn't block the
  /// UI, so this runs fire-and-forget after state is already updated.
  Future<void> _persist(double lat, double lng, String city) async {
    try {
      final dio = ref.read(apiClientProvider).dio;
      await dio.put(ApiEndpoints.updateLocation, data: {
        'latitude': lat,
        'longitude': lng,
        'city': city,
      });
    } catch (_) {
      // silently ignore — non-critical
    }
  }

  /// Manual fallback: user taps the location chip after auto-detection
  /// failed (or just to refresh it). Re-requests permission and retries.
  Future<void> retry() => _detect();
}

final homeLocationControllerProvider =
    NotifierProvider<HomeLocationController, HomeLocationState>(HomeLocationController.new);
