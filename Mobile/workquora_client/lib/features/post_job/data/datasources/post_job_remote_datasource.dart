import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/job_model.dart';

class PostJobRemoteDataSource {
  PostJobRemoteDataSource(this._dio);
  final Dio _dio;

  /// POST /jobs — exact field names as read by jobController.createJob:
  /// title, description, category, minBudget, maxBudget, location
  /// ({type, coordinates, address}), skillsRequired, isUrgent.
  Future<JobModel> createJob({
    required String title,
    required String description,
    required String category,
    required List<String> skillsRequired,
    required num minBudget,
    required num maxBudget,
    required double lat,
    required double lng,
    required String address,
    bool isUrgent = false,
  }) async {
    final res = await _dio.post(ApiEndpoints.jobs, data: {
      'title': title,
      'description': description,
      'category': category,
      'skillsRequired': skillsRequired,
      'minBudget': minBudget,
      'maxBudget': maxBudget,
      'location': {
        'type': 'Point',
        // Backend expects [longitude, latitude] order — easy to get backwards.
        'coordinates': [lng, lat],
        'address': address,
      },
      'isUrgent': isUrgent,
    });
    return JobModel.fromJson(res.data['data'] as Map<String, dynamic>);
  }

  Future<List<JobModel>> getMyJobs() async {
    final res = await _dio.get(ApiEndpoints.myJobs);
    final list = (res.data['data'] ?? res.data) as List;
    return list.map((e) => JobModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<JobModel> getJobById(String id) async {
    final res = await _dio.get(ApiEndpoints.jobDetails(id));
    return JobModel.fromJson(res.data['data'] as Map<String, dynamic>);
  }
}
