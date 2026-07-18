import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

/// Reverse-geocodes coordinates to a human-readable area name (e.g.
/// "Kolar Road, Bhopal") using OpenStreetMap's public Nominatim API — same
/// provider the backend's /geo/search already uses for forward geocoding,
/// called directly here since there's no reverse endpoint on our backend yet
/// (matches the precedent already set by web/'s Navbar, which also calls a
/// third-party reverse-geocode API directly from the client).
///
/// Returns null on any failure — callers should fall back to a generic
/// label ("Current Location") rather than crash or block on this.
Future<String?> reverseGeocode(double lat, double lng) async {
  try {
    final dio = Dio();
    final res = await dio.get(
      'https://nominatim.openstreetmap.org/reverse',
      queryParameters: {'lat': lat, 'lon': lng, 'format': 'json', 'addressdetails': 1, 'zoom': 16},
      options: Options(
        headers: {'User-Agent': 'WorkQuoraClient/1.0 (contact@workquora.com)', 'Accept-Language': 'en'},
        sendTimeout: const Duration(seconds: 8),
        receiveTimeout: const Duration(seconds: 8),
      ),
    );

    final addr = res.data?['address'] as Map?;
    if (addr == null) return null;

    final area = addr['neighbourhood'] ?? addr['suburb'] ?? addr['road'] ?? addr['hamlet'];
    final city = addr['city'] ?? addr['town'] ?? addr['village'] ?? addr['county'];

    if (area != null && city != null) return '$area, $city';
    if (city != null) return city.toString();
    if (area != null) return area.toString();
    return null;
  } catch (e) {
    debugPrint('[ReverseGeocode] Failed: $e');
    return null;
  }
}
