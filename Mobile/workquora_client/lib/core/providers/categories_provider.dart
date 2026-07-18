import 'package:flutter/foundation.dart';
import '../constants/api_constants.dart';
import '../models/category_model.dart';
import '../network/dio_client.dart';

/// Backs Home's category grid. Falls back to the local hardcoded list
/// (core/constants/categories.dart) on any fetch failure — that fallback
/// stays in place deliberately, not deleted.
class CategoriesProvider extends ChangeNotifier {
  List<CategoryModel> _categories = [];
  bool _isLoading = false;
  String? _error;

  static const _freshWindow = Duration(minutes: 5);
  DateTime? _fetchedAt;

  List<CategoryModel> get categories => _categories;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> fetchCategories({bool force = false}) async {
    if (!force && _fetchedAt != null && DateTime.now().difference(_fetchedAt!) < _freshWindow) {
      return;
    }
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.categories);
      final raw = res.data['data'] as List? ?? [];
      _categories = raw.map((c) => CategoryModel.fromJson(Map<String, dynamic>.from(c))).toList();
      _fetchedAt = DateTime.now();
    } catch (e) {
      // Silent fallback — home_screen.dart uses the local hardcoded list
      // when `categories` comes back empty, so this doesn't need its own
      // user-facing error UI. _error is still tracked for debugging.
      _error = e.toString();
      _categories = [];
    }
    _isLoading = false;
    notifyListeners();
  }

  // Deliberately no reset() called on logout, unlike Jobs/Chat/Notifications
  // — categories are global service-catalog data, not scoped to an account,
  // so there's no cross-account leakage risk and clearing the cache would
  // just force a pointless refetch for the next login.
}
