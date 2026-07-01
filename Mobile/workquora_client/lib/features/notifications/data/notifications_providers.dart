import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/core_providers.dart';
import 'datasources/notifications_remote_datasource.dart';
import 'repositories/notifications_repository_impl.dart';
import '../domain/repositories/notifications_repository.dart';

final notificationsRemoteDataSourceProvider = Provider<NotificationsRemoteDataSource>((ref) {
  final dio = ref.watch(apiClientProvider).dio;
  return NotificationsRemoteDataSource(dio);
});

final notificationsRepositoryProvider = Provider<NotificationsRepository>((ref) {
  final remote = ref.watch(notificationsRemoteDataSourceProvider);
  return NotificationsRepositoryImpl(remote);
});
