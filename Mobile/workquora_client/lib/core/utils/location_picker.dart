import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../constants/api_constants.dart';
import '../constants/app_colors.dart';
import '../network/dio_client.dart';
import '../providers/jobs_provider.dart';
import 'mobile_location.dart' if (dart.library.html) 'web_location.dart';

/// Gets the current position (via geolocator on mobile, the browser's
/// Geolocation API on web — see mobile_location.dart / web_location.dart),
/// stores it via [JobsProvider.setLocation], and returns whether it
/// succeeded. Shared between the picker's GPS button and home_screen's
/// auto-resume check, so the permission flow only lives in one place.
Future<bool> requestAndUseCurrentLocation(BuildContext context) async {
  final pos = await getPlatformLocation();
  if (pos == null) return false;
  if (!context.mounted) return false;
  await context.read<JobsProvider>().setLocation(pos['lat']!, pos['lng']!, 'Current Location');
  return true;
}

Future<void> showLocationPicker(BuildContext context) async {
  final wantsGps = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: AppColors.surface,
    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
    isScrollControlled: true,
    builder: (_) => const _LocationPickerSheet(),
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

    final ok = await requestAndUseCurrentLocation(context);
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).hideCurrentSnackBar();

    if (ok) {
      context.read<JobsProvider>().startLocationTracking();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
        content: Text('✓ Location updated'),
        backgroundColor: AppColors.success,
        duration: Duration(seconds: 2),
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
  const _LocationPickerSheet();
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
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 16),

          const Text('Set Your Location', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          const Text('Used to find workers near you', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 20),

          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              icon: const Icon(Icons.my_location, color: Colors.white, size: 18),
              label: const Text('Use Current GPS Location', style: TextStyle(color: Colors.white)),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
              onPressed: () => Navigator.of(context).pop(true),
            ),
          ),

          const SizedBox(height: 20),
          const Divider(color: AppColors.border),
          const SizedBox(height: 12),

          TextField(
            controller: _searchController,
            onChanged: _onSearchChanged,
            style: const TextStyle(color: AppColors.text),
            decoration: InputDecoration(
              hintText: 'Search city, area or pincode...',
              hintStyle: const TextStyle(color: AppColors.textMuted),
              prefixIcon: const Icon(Icons.search, color: AppColors.primary),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear, color: AppColors.textMuted, size: 18),
                      onPressed: () {
                        _searchController.clear();
                        setState(() => _suggestions = []);
                      },
                    )
                  : null,
              filled: true,
              fillColor: AppColors.bg,
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
          const SizedBox(height: 12),

          if (_isSearching)
            const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator(color: AppColors.primary)))
          else if (_searchController.text.trim().length >= 3 && _suggestions.isEmpty)
            const Center(child: Padding(
              padding: EdgeInsets.all(20),
              child: Text('No results found. Try different keywords.', style: TextStyle(color: AppColors.textMuted), textAlign: TextAlign.center),
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
                  leading: const Icon(Icons.location_on, color: AppColors.primary, size: 20),
                  title: Text(city['name'].toString(), style: const TextStyle(color: AppColors.text, fontSize: 14)),
                  subtitle: Text(
                    '${(city['lat'] as double).toStringAsFixed(4)}, ${(city['lng'] as double).toStringAsFixed(4)}',
                    style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
                  ),
                  onTap: () async {
                    await context.read<JobsProvider>().setLocation(city['lat'] as double, city['lng'] as double, city['name'].toString());
                    if (context.mounted) Navigator.of(context).pop();
                  },
                );
              },
            )
          else
            const Center(child: Padding(
              padding: EdgeInsets.all(16),
              child: Text('Type at least 3 characters to search', style: TextStyle(color: AppColors.textMuted, fontSize: 12), textAlign: TextAlign.center),
            )),
        ]),
      ),
    );
  }
}
