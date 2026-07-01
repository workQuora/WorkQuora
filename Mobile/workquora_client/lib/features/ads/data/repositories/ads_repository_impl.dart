import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../domain/models/ad_model.dart';
import '../datasources/ads_remote_datasource.dart';

class AdsRepository {
  AdsRepository(this._remote);
  final AdsRemoteDataSource _remote;

  Future<Either<AppFailure, List<AdModel>>> getActiveAds() async {
    try {
      final result = await _remote.getActiveAds();
      return Right(result);
    } catch (e) {
      return Left(AppFailure.fromMessage('Failed to fetch ads.'));
    }
  }

  Future<void> trackAdImpression(String adId) async {
    try {
      await _remote.trackAdImpression(adId);
    } catch (_) {}
  }
}
