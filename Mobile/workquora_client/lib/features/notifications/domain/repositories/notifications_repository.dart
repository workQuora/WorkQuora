import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../data/models/notification_model.dart';

abstract class NotificationsRepository {
  Future<Either<AppFailure, List<NotificationModel>>> getNotifications();
  Future<Either<AppFailure, void>> markAsRead(String id);
  Future<Either<AppFailure, void>> markAllAsRead();
}
