import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';

class AuthProvider extends ChangeNotifier {
  final SharedPreferences _prefs;
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  String? _error;

  AuthProvider(this._prefs) {
    _loadUser();
  }

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  String get role => _user?['role'] ?? 'CLIENT';

  void _loadUser() {
    final userStr = _prefs.getString('user');
    if (userStr != null) _user = jsonDecode(userStr);
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true; _error = null; notifyListeners();
    try {
      final res = await DioClient.instance.dio.post(ApiConstants.login,
          data: {'email': email, 'password': password});
      final data = res.data;
      await DioClient.instance.saveToken(data['token']);
      _user = data['user'];
      await _prefs.setString('user', jsonEncode(_user));
      _isLoading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e); _isLoading = false; notifyListeners();
      return false;
    }
  }

  Future<bool> register(Map<String, dynamic> data) async {
    _isLoading = true; _error = null; notifyListeners();
    try {
      final res = await DioClient.instance.dio.post(ApiConstants.register, data: data);
      final d = res.data;
      await DioClient.instance.saveToken(d['token']);
      _user = d['user'];
      await _prefs.setString('user', jsonEncode(_user));
      _isLoading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e); _isLoading = false; notifyListeners();
      return false;
    }
  }

  Future<bool> validateToken() async {
    final token = await DioClient.instance.getToken();
    if (token == null) return false;
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.me);
      _user = res.data['data'];
      await _prefs.setString('user', jsonEncode(_user));
      notifyListeners();
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }

  Future<void> logout() async {
    await DioClient.instance.clearToken();
    await _prefs.remove('user');
    _user = null;
    notifyListeners();
  }

  String _parseError(dynamic e) {
    try { return e.response?.data?['message'] ?? 'Something went wrong'; }
    catch (_) { return 'Network error. Check your connection.'; }
  }
}
