import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../domain/repositories/notifications_repository.dart';
import '../datasources/notifications_remote_datasource.dart';
import '../models/notification_model.dart';

Future<Either<AppFailure, T>> _guard<T>(Future<T> Function() action) async {
  try {
    return Right(await action());
  } on DioException catch (e) {
    if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
      return Left(AppFailure.network());
    }
    final message = (e.response?.data is Map) ? e.response?.data['message'] as String? : null;
    return Left(AppFailure.fromMessage(message ?? 'Something went wrong.', statusCode: e.response?.statusCode));
  } catch (_) {
    return Left(AppFailure.fromMessage('Unexpected error.'));
  }
}

class NotificationsRepositoryImpl implements NotificationsRepository {
  NotificationsRepositoryImpl(this._remote);
  final NotificationsRemoteDataSource _remote;

  @override
  Future<Either<AppFailure, List<NotificationModel>>> getNotifications() =>
      _guard(() => _remote.getNotifications());

  @override
  Future<Either<AppFailure, void>> markAsRead(String id) =>
      _guard(() => _remote.markAsRead(id));

  @override
  Future<Either<AppFailure, void>> markAllAsRead() =>
      _guard(() => _remote.markAllAsRead());
}
