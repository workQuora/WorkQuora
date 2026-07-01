class AdModel {
  const AdModel({
    required this.id,
    required this.title,
    required this.brandName,
    required this.description,
    required this.targetLink,
    required this.mediaType,
    required this.mediaUrl,
    this.status = 'active',
    this.platform = 'MOBILE',
  });

  final String id;
  final String title;
  final String brandName;
  final String description;
  final String targetLink;
  final String mediaType;
  final String mediaUrl;
  final String status;
  final String platform;

  factory AdModel.fromJson(Map<String, dynamic> json) {
    return AdModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      title: json['title'] as String? ?? '',
      brandName: json['brandName'] as String? ?? '',
      description: json['description'] as String? ?? '',
      targetLink: json['targetLink'] as String? ?? '',
      mediaType: json['mediaType'] as String? ?? 'IMAGE',
      mediaUrl: json['mediaUrl'] as String? ?? '',
      status: json['status'] as String? ?? 'active',
      platform: json['platform'] as String? ?? 'MOBILE',
    );
  }
}
