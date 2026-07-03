import 'package:flutter/material.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';

class TasksProvider extends ChangeNotifier {
  List<dynamic> _tasks = [];
  List<dynamic> _nearbyJobs = [];
  bool _isLoading = false;

  List<dynamic> get tasks => _tasks;
  List<dynamic> get nearbyJobs => _nearbyJobs;
  bool get isLoading => _isLoading;

  List<dynamic> get activeTasks => _tasks.where((t) => t['status'] == 'in_progress' || t['status'] == 'pending').toList();
  List<dynamic> get completedTasks => _tasks.where((t) => t['status'] == 'completed').toList();

  Future<void> fetchMyTasks() async {
    _isLoading = true; notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.myTasks);
      _tasks = res.data['data'] ?? res.data ?? [];
    } catch (_) { _tasks = []; }
    _isLoading = false; notifyListeners();
  }

  Future<void> fetchNearbyJobs({double lat = 28.6139, double lng = 77.2090}) async {
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.nearbyJobs, queryParameters: {'lat': lat, 'lng': lng, 'radius': 25});
      _nearbyJobs = res.data['data'] ?? res.data ?? [];
    } catch (_) { _nearbyJobs = []; }
    notifyListeners();
  }

  Future<bool> markComplete(String taskId) async {
    try { await DioClient.instance.dio.put('/tasks/$taskId/status', data: {'status': 'completed'}); await fetchMyTasks(); return true; }
    catch (_) { return false; }
  }
}
