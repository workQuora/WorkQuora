class NotificationModel {
  const NotificationModel({
    required this.id,
    required this.recipient,
    this.sender,
    required this.type,
    required this.message,
    this.relatedId,
    this.onModel,
    required this.isRead,
    required this.createdAt,
  });

  final String id;
  final String recipient;
  final String? sender;
  final String type;
  final String message;
  final String? relatedId;
  final String? onModel;
  final bool isRead;
  final DateTime createdAt;

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: (json['_id'] ?? json['id'] ?? '') as String,
      recipient: (json['recipient'] ?? '') as String,
      sender: json['sender'] as String?,
      type: (json['type'] ?? 'system_alert') as String,
      message: (json['message'] ?? '') as String,
      relatedId: json['relatedId'] as String?,
      onModel: json['onModel'] as String?,
      isRead: (json['isRead'] ?? false) as bool,
      createdAt: DateTime.parse((json['createdAt'] ?? DateTime.now().toIso8601String()) as String),
    );
  }
}
