import 'package:dio/dio.dart';
import '../../../../core/network/api_endpoints.dart';
import '../models/notification_model.dart';

class NotificationsRemoteDataSource {
  NotificationsRemoteDataSource(this._dio);
  final Dio _dio;

  Future<List<NotificationModel>> getNotifications() async {
    final res = await _dio.get(ApiEndpoints.notifications);
    final list = res.data['data'] as List?;
    if (list == null) return const [];
    return list.map((n) => NotificationModel.fromJson(n as Map<String, dynamic>)).toList();
  }

  Future<void> markAsRead(String id) async {
    await _dio.put(ApiEndpoints.notificationRead(id));
  }

  Future<void> markAllAsRead() async {
    await _dio.put(ApiEndpoints.notificationsReadAll);
  }
}
