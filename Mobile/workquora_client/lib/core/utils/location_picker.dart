import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/api_constants.dart';
import '../network/dio_client.dart';
import '../providers/jobs_provider.dart';
import '../../theme/app_theme.dart';
import 'mobile_location.dart' if (dart.library.html) 'web_location.dart';

typedef LocationSelected = void Function(double lat, double lng, String label);

/// Gets the current position (via geolocator on mobile, the browser's
/// Geolocation API on web — see mobile_location.dart / web_location.dart).
/// When [onSelected] is given, hands the result to it instead of writing to
/// [JobsProvider] — used by callers (e.g. Post Job) that need a one-off
/// location rather than changing the user's global "nearby search" center.
Future<bool> requestAndUseCurrentLocation(BuildContext context, {LocationSelected? onSelected}) async {
  final pos = await getPlatformLocation();
  if (pos == null) return false;
  if (!context.mounted) return false;
  if (onSelected != null) {
    onSelected(pos['lat']!, pos['lng']!, 'Current Location');
  } else {
    await context.read<JobsProvider>().setLocation(pos['lat']!, pos['lng']!, 'Current Location');
  }
  return true;
}

/// Shows the location picker sheet (GPS button + city/area search).
///
/// With no [onSelected], the picked location becomes the user's global
/// "nearby search" center via [JobsProvider] (home_screen's usage). Pass
/// [onSelected] to instead receive the pick as a one-off value without
/// touching that global state (e.g. setting a specific job's location).
Future<void> showLocationPicker(BuildContext context, {LocationSelected? onSelected}) async {
  final theme = Theme.of(context);
  final wantsGps = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: theme.colorScheme.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    isScrollControlled: true,
    builder: (_) => _LocationPickerSheet(onSelected: onSelected),
  );

  if (wantsGps == true && context.mounted) {
    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
      content: Row(children: [
        SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)),
        SizedBox(width: 12),
        Text('Getting your location...'),
      ]),
      duration: Duration(seconds: 10),
    ));

    final ok = await requestAndUseCurrentLocation(context, onSelected: onSelected);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    if (ok) {
      // Background tracking only makes sense for the "nearby search center"
      // use case — skip it when the caller just wanted a one-off pick.
      if (onSelected == null) {
        context.read<JobsProvider>().startLocationTracking();
      }
      final tokens = theme.extension<AppTokens>()!;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: const Text('✓ Location updated'),
        backgroundColor: tokens.success,
        duration: const Duration(seconds: 2),
      ));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('Could not get location. Please check that location is enabled in your device settings.'),
        duration: Duration(seconds: 4),
      ));
    }
  }
}

class _LocationPickerSheet extends StatefulWidget {
  final LocationSelected? onSelected;
  const _LocationPickerSheet({this.onSelected});
  @override State<_LocationPickerSheet> createState() => _LocationPickerSheetState();
}

class _LocationPickerSheetState extends State<_LocationPickerSheet> {
  final _searchController = TextEditingController();
  List<Map<String, dynamic>> _suggestions = [];
  bool _isSearching = false;
  Timer? _debounce;

  void _onSearchChanged(String query) {
    _debounce?.cancel();
    if (query.trim().length < 3) {
      setState(() => _suggestions = []);
      return;
    }
    _debounce = Timer(const Duration(milliseconds: 500), () => _searchCities(query));
  }

  // Routed through our own backend (/geo/search), which proxies Nominatim
  // server-side — avoids exposing a third-party API directly to the client.
  Future<void> _searchCities(String query) async {
    setState(() => _isSearching = true);
    try {
      final res = await DioClient.instance.dio.get(
        ApiConstants.geoSearch,
        queryParameters: {'q': query.trim()},
      );

      final list = res.data['data'] as List;
      final unique = list.map((e) => Map<String, dynamic>.from(e)).toList();

      if (!mounted) return;
      setState(() { _suggestions = unique; _isSearching = false; });
    } catch (e) {
      debugPrint('City search error: $e');
      if (!mounted) return;
      setState(() { _suggestions = []; _isSearching = false; });
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),

          Text('Set Your Location', style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('Used to find workers near you', style: TextStyle(color: tokens.muted, fontSize: 12)),
          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.my_location, color: Colors.white, size: 18),
              label: const Text('Use Current GPS Location', style: TextStyle(color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: theme.colorScheme.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.of(context).pop(true),
            ),
          ),

          const SizedBox(height: 20),
          Divider(color: tokens.border),
          const SizedBox(height: 12),

          TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            style: TextStyle(color: theme.colorScheme.onSurface),
            decoration: InputDecoration(
              hintText: 'Search city, area or pincode...',
              hintStyle: TextStyle(color: tokens.muted),
              prefixIcon: Icon(Icons.search, color: theme.colorScheme.primary),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.clear, color: tokens.muted, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _suggestions = []);
                      },
                    )
                  : null,
              filled: true,
              fillColor: theme.scaffoldBackgroundColor,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          const SizedBox(height: 12),

          if (_isSearching)
            Center(child: Padding(padding: const EdgeInsets.all(20), child: CircularProgressIndicator(color: theme.colorScheme.primary)))
          else if (_searchController.text.trim().length >= 3 && _suggestions.isEmpty)
            Center(child: Padding(
              padding: const EdgeInsets.all(20),
              child: Text('No results found. Try different keywords.', style: TextStyle(color: tokens.muted), textAlign: TextAlign.center),
            ))
          else if (_suggestions.isNotEmpty)
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: _suggestions.length,
              itemBuilder: (ctx, i) {
                final city = _suggestions[i];
                return ListTile(
                  dense: true,
                  leading: Icon(Icons.location_on, color: theme.colorScheme.primary, size: 20),
                  title: Text(city['name'].toString(), style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 14)),
                  subtitle: Text(
                    '${(city['lat'] as double).toStringAsFixed(4)}, ${(city['lng'] as double).toStringAsFixed(4)}',
                    style: TextStyle(color: tokens.muted, fontSize: 11),
                  ),
                  onTap: () async {
                    final lat = city['lat'] as double;
                    final lng = city['lng'] as double;
                    final name = city['name'].toString();
                    if (widget.onSelected != null) {
                      widget.onSelected!(lat, lng, name);
                    } else {
                      await context.read<JobsProvider>().setLocation(lat, lng, name);
                    }
                    if (context.mounted) Navigator.of(context).pop();
                  },
                );
              },
            )
          else
            Center(child: Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Type at least 3 characters to search', style: TextStyle(color: tokens.muted, fontSize: 12), textAlign: TextAlign.center),
            )),
        ]),
      ),
    );
  }
}
