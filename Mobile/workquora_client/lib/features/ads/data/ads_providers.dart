import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/core_providers.dart';
import 'datasources/ads_remote_datasource.dart';
import 'repositories/ads_repository_impl.dart';
import '../domain/models/ad_model.dart';

final adsRemoteDataSourceProvider = Provider<AdsRemoteDataSource>((ref) {
  return AdsRemoteDataSource(ref.watch(apiClientProvider).dio);
});

final adsRepositoryProvider = Provider<AdsRepository>((ref) {
  return AdsRepository(ref.watch(adsRemoteDataSourceProvider));
});

final activeAdsProvider = FutureProvider<List<AdModel>>((ref) async {
  final repo = ref.watch(adsRepositoryProvider);
  final result = await repo.getActiveAds();
  return result.match((failure) => throw failure, (ads) => ads);
});
