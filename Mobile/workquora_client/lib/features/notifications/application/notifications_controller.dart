import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/notification_model.dart';
import '../data/notifications_providers.dart';

class NotificationsController extends AsyncNotifier<List<NotificationModel>> {
  @override
  Future<List<NotificationModel>> build() => _fetch();

  Future<List<NotificationModel>> _fetch() async {
    final repo = ref.read(notificationsRepositoryProvider);
    final result = await repo.getNotifications();
    return result.match((failure) => throw failure, (list) => list);
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(_fetch);
  }

  Future<void> markAsRead(String id) async {
    final repo = ref.read(notificationsRepositoryProvider);
    final current = state.valueOrNull ?? [];
    state = AsyncValue.data(
      current.map((n) => n.id == id ? NotificationModel(
        id: n.id,
        recipient: n.recipient,
        sender: n.sender,
        type: n.type,
        message: n.message,
        relatedId: n.relatedId,
        onModel: n.onModel,
        isRead: true,
        createdAt: n.createdAt,
      ) : n).toList(),
    );
    await repo.markAsRead(id);
  }

  Future<void> clearAll() async {
    final repo = ref.read(notificationsRepositoryProvider);
    final current = state.valueOrNull ?? [];
    state = AsyncValue.data(
      current.map((n) => NotificationModel(
        id: n.id,
        recipient: n.recipient,
        sender: n.sender,
        type: n.type,
        message: n.message,
        relatedId: n.relatedId,
        onModel: n.onModel,
        isRead: true,
        createdAt: n.createdAt,
      )).toList(),
    );
    await repo.markAllAsRead();
  }
}

final notificationsControllerProvider = AsyncNotifierProvider<NotificationsController, List<NotificationModel>>(NotificationsController.new);
final unreadNotificationsCountProvider = Provider<int>((ref) {
  final list = ref.watch(notificationsControllerProvider).valueOrNull ?? [];
  return list.where((n) => !n.isRead).length;
});
