import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';
import '../../domain/models/ad_model.dart';

class AdsRemoteDataSource {
  AdsRemoteDataSource(this._dio);
  final Dio _dio;

  Future<List<AdModel>> getActiveAds() async {
    final res = await _dio.get(
      ApiEndpoints.adsActive,
      queryParameters: {'platform': 'MOBILE'},
    );
    final list = (res.data['data'] ?? res.data) as List;
    return list.map((e) => AdModel.fromJson(e as Map<String, dynamic>)).toList();
  }

  Future<void> trackAdImpression(String adId) async {
    await _dio.post(ApiEndpoints.adsTrack, data: {'adId': adId});
  }
}
