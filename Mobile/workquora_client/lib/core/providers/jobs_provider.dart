import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';
import '../utils/error_helper.dart';

class JobsProvider extends ChangeNotifier {
  List<dynamic> _nearbyWorkers = [];
  List<dynamic> _myJobs = [];
  bool _isLoading = false;
  // Separate from _isLoading (which is nearby-workers-search-specific) —
  // Home fires fetchMyJobs() and fetchNearbyWorkers() independently, so a
  // shared flag would let one finishing flip isLoading off while the other
  // is still in flight.
  bool _isLoadingMyJobs = false;
  // Same split as the loading flags, and for the same reason — a failed
  // nearby-workers search and a failed my-jobs fetch are unrelated events.
  String? _nearbyWorkersError;
  String? _myJobsError;
  StreamSubscription<Position>? _locationSubscription;

  // Defaults to Delhi until the user picks a real location (see setLocation).
  double _currentLat = 28.6139;
  double _currentLng = 77.2090;
  String _locationLabel = 'Delhi, India';

  List<dynamic> get nearbyWorkers => _nearbyWorkers;
  List<dynamic> get myJobs => _myJobs;
  bool get isLoading => _isLoading;
  bool get isLoadingMyJobs => _isLoadingMyJobs;
  String? get nearbyWorkersError => _nearbyWorkersError;
  String? get myJobsError => _myJobsError;
  double get currentLat => _currentLat;
  double get currentLng => _currentLng;
  String get locationLabel => _locationLabel;

  Future<void> fetchNearbyWorkers({double? lat, double? lng, int radius = 40}) async {
    final useLat = lat ?? _currentLat;
    final useLng = lng ?? _currentLng;
    _isLoading = true; _nearbyWorkersError = null; notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.nearbyFreelancers,
          queryParameters: {'lat': useLat, 'lng': useLng, 'radius': radius});
      _nearbyWorkers = res.data['data'] ?? res.data ?? [];
    } catch (e) {
      // Was a bare catch(_){} that fell back to an empty list — search
      // results screens couldn't tell "no workers nearby" from "the request
      // failed", so a real outage silently looked like a normal empty state.
      _nearbyWorkers = [];
      _nearbyWorkersError = ErrorHelper.extractError(e);
    }
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

  // Called on logout (see app.dart) so a different account's next login
  // doesn't briefly show the previous account's jobs/search results, and so
  // the background GPS stream — which would otherwise keep calling
  // fetchNearbyWorkers with an already-cleared auth token — actually stops.
  void reset() {
    stopLocationTracking();
    _nearbyWorkers = [];
    _myJobs = [];
    _isLoading = false;
    _isLoadingMyJobs = false;
    _nearbyWorkersError = null;
    _myJobsError = null;
    _currentLat = 28.6139;
    _currentLng = 77.2090;
    _locationLabel = 'Delhi, India';
    notifyListeners();
  }

  @override
  void dispose() {
    stopLocationTracking();
    super.dispose();
  }

  Future<void> fetchMyJobs() async {
    _isLoadingMyJobs = true; _myJobsError = null; notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.myJobs);
      _myJobs = res.data['data'] ?? res.data ?? [];
    } catch (e) {
      // Same "empty looks the same as failed" gap as fetchNearbyWorkers.
      _myJobs = [];
      _myJobsError = ErrorHelper.extractError(e);
    }
    _isLoadingMyJobs = false; notifyListeners();
  }

  // Returns the newly-created job's _id on success, or null on failure —
  // POST /jobs responds with { success, data: <full created job> }. Callers
  // read [error] right after a null result to show the real reason instead
  // of a generic "something went wrong".
  String? _error;
  String? get error => _error;

  Future<String?> postJob(Map<String, dynamic> data) async {
    _error = null;
    try {
      final res = await DioClient.instance.dio.post(ApiConstants.postJob, data: data);
      await fetchMyJobs();
      return res.data['data']?['_id']?.toString();
    } catch (e) {
      // Was catch(_){ return null; } — discarded the backend's actual
      // validation message (e.g. a specific field issue) in favor of a
      // generic "failed, check your details" shown at the call site.
      _error = ErrorHelper.extractError(e);
      return null;
    }
  }
}
