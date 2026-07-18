class CategoryModel {
  final String name;
  final String slug;
  final String imageUrl;
  final int order;

  const CategoryModel({
    required this.name,
    required this.slug,
    required this.imageUrl,
    required this.order,
  });

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? '',
      imageUrl: json['imageUrl']?.toString() ?? '',
      order: (json['order'] as num?)?.toInt() ?? 0,
    );
  }
}
