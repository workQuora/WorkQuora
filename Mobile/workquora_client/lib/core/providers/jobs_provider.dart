import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';

class JobsProvider extends ChangeNotifier {
  List<dynamic> _nearbyWorkers = [];
  List<dynamic> _myJobs = [];
  bool _isLoading = false;
  StreamSubscription<Position>? _locationSubscription;

  // Defaults to Delhi until the user picks a real location (see setLocation).
  double _currentLat = 28.6139;
  double _currentLng = 77.2090;
  String _locationLabel = 'Delhi, India';

  List<dynamic> get nearbyWorkers => _nearbyWorkers;
  List<dynamic> get myJobs => _myJobs;
  bool get isLoading => _isLoading;
  double get currentLat => _currentLat;
  double get currentLng => _currentLng;
  String get locationLabel => _locationLabel;

  Future<void> fetchNearbyWorkers({double? lat, double? lng, int radius = 25}) async {
    final useLat = lat ?? _currentLat;
    final useLng = lng ?? _currentLng;
    _isLoading = true; notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.nearbyFreelancers,
          queryParameters: {'lat': useLat, 'lng': useLng, 'radius': radius});
      _nearbyWorkers = res.data['data'] ?? res.data ?? [];
    } catch (_) { _nearbyWorkers = []; }
    _isLoading = false; notifyListeners();
  }

  // Updates the active search location and immediately re-fetches nearby
  // workers using the new coordinates.
  Future<void> setLocation(double lat, double lng, String label) async {
    _currentLat = lat;
    _currentLng = lng;
    _locationLabel = label;
    notifyListeners();
    await fetchNearbyWorkers(lat: lat, lng: lng);
  }

  // Background tracking — updates the search location as the device moves,
  // without changing the user-facing label (keeps whatever they picked/GPS'd
  // to originally). Not supported on web (no streaming geolocation there).
  void startLocationTracking() {
    if (kIsWeb) return;
    _locationSubscription?.cancel();
    _locationSubscription = Geolocator.getPositionStream(
      locationSettings: const LocationSettings(accuracy: LocationAccuracy.medium, distanceFilter: 500),
    ).listen(
      (Position position) {
        debugPrint('[Location] Updated: ${position.latitude}, ${position.longitude}');
        // setLocation already re-fetches nearby workers — calling
        // fetchNearbyWorkers separately here would just double the request.
        setLocation(position.latitude, position.longitude, _locationLabel);
      },
      onError: (e) => debugPrint('[Location] Stream error: $e'),
    );
  }

  void stopLocationTracking() {
    _locationSubscription?.cancel();
    _locationSubscription = null;
  }

  @override
  void dispose() {
    stopLocationTracking();
    super.dispose();
  }

  Future<void> fetchMyJobs() async {
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.myJobs);
      _myJobs = res.data['data'] ?? res.data ?? [];
    } catch (_) { _myJobs = []; }
    notifyListeners();
  }

  // Returns the newly-created job's _id on success, or null on failure —
  // POST /jobs responds with { success, data: <full created job> }.
  Future<String?> postJob(Map<String, dynamic> data) async {
    try {
      final res = await DioClient.instance.dio.post(ApiConstants.postJob, data: data);
      await fetchMyJobs();
      return res.data['data']?['_id']?.toString();
    } catch (_) { return null; }
  }
}
