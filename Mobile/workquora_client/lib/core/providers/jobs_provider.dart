import 'package:flutter/material.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';

class JobsProvider extends ChangeNotifier {
  List<dynamic> _nearbyWorkers = [];
  List<dynamic> _myJobs = [];
  bool _isLoading = false;

  List<dynamic> get nearbyWorkers => _nearbyWorkers;
  List<dynamic> get myJobs => _myJobs;
  bool get isLoading => _isLoading;

  Future<void> fetchNearbyWorkers({double lat = 28.6139, double lng = 77.2090, int radius = 25}) async {
    _isLoading = true; notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.nearbyFreelancers,
          queryParameters: {'lat': lat, 'lng': lng, 'radius': radius});
      _nearbyWorkers = res.data['data'] ?? res.data ?? [];
    } catch (_) { _nearbyWorkers = []; }
    _isLoading = false; notifyListeners();
  }

  Future<void> fetchMyJobs() async {
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.jobs);
      _myJobs = res.data['data'] ?? res.data ?? [];
    } catch (_) { _myJobs = []; }
    notifyListeners();
  }

  Future<bool> postJob(Map<String, dynamic> data) async {
    try {
      await DioClient.instance.dio.post(ApiConstants.postJob, data: data);
      await fetchMyJobs();
      return true;
    } catch (_) { return false; }
  }
}
