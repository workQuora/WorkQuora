import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';
import '../utils/error_helper.dart';
import '../services/socket_service.dart';

class AuthProvider extends ChangeNotifier {
  final SharedPreferences _prefs;
  Map<String, dynamic>? _user;
  bool _isLoading = false;
  String? _error;
  String? _pendingEmail;
  Map<String, dynamic>? _pendingRegistrationData;

  AuthProvider(this._prefs) {
    _loadUser();
  }

  Map<String, dynamic>? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  String get role => _user?['role'] ?? 'CLIENT';
  String? get pendingEmail => _pendingEmail;

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
      SocketService().connect(data['token']);
      _isLoading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e); _isLoading = false; notifyListeners();
      return false;
    }
  }

  // Step 1: POST /auth/register — sends the email OTP. No token yet.
  Future<bool> register(Map<String, dynamic> data) async {
    _isLoading = true; _error = null; notifyListeners();
    try {
      await DioClient.instance.dio.post(ApiConstants.register, data: data);
      _pendingEmail = data['email'];
      _pendingRegistrationData = data;
      _isLoading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e); _isLoading = false; notifyListeners();
      return false;
    }
  }

  // Re-sends the email OTP by re-submitting the same registration payload —
  // there is no dedicated resend endpoint; the backend regenerates the OTP
  // for an existing unverified user on repeat POST /auth/register.
  Future<bool> resendEmailOtp() async {
    if (_pendingRegistrationData == null) return false;
    return register(_pendingRegistrationData!);
  }

  // Email OTP is now the sole registration gate — this step issues the token
  // directly (backend no longer requires a follow-up mobile OTP step).
  Future<bool> verifyEmailOtp(String otp) async {
    _isLoading = true; _error = null; notifyListeners();
    try {
      final res = await DioClient.instance.dio.post(ApiConstants.verifyRegistration,
          data: {'email': _pendingEmail, 'otp': otp});
      final d = res.data;
      await DioClient.instance.saveToken(d['token']);
      _user = d['user'];
      await _prefs.setString('user', jsonEncode(_user));
      SocketService().connect(d['token']);
      _pendingEmail = null;
      _pendingRegistrationData = null;
      _isLoading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e); _isLoading = false; notifyListeners();
      return false;
    }
  }

  Future<bool> resendMobileOtp() async {
    if (_pendingEmail == null) return false;
    _isLoading = true; _error = null; notifyListeners();
    try {
      await DioClient.instance.dio.post(ApiConstants.sendMobileOtp, data: {'email': _pendingEmail});
      _isLoading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e); _isLoading = false; notifyListeners();
      return false;
    }
  }

  // Step 3: POST /auth/verify-mobile — verifies the mobile OTP.
  // This is the step that finally issues a token (sendTokenResponse).
  Future<bool> verifyMobileOtp(String otp) async {
    _isLoading = true; _error = null; notifyListeners();
    try {
      final res = await DioClient.instance.dio.post(ApiConstants.verifyMobile,
          data: {'email': _pendingEmail, 'otp': otp});
      final d = res.data;
      await DioClient.instance.saveToken(d['token']);
      _user = d['user'];
      await _prefs.setString('user', jsonEncode(_user));
      SocketService().connect(d['token']);
      _pendingEmail = null;
      _pendingRegistrationData = null;
      _isLoading = false; notifyListeners();
      return true;
    } catch (e) {
      _error = _parseError(e); _isLoading = false; notifyListeners();
      return false;
    }
  }

  // Merges a partial update into the cached user locally, without a network
  // call — for endpoints (e.g. photo upload) that return just the changed
  // field(s) rather than the full user object.
  void patchUser(Map<String, dynamic> patch) {
    _user = {...?_user, ...patch};
    _prefs.setString('user', jsonEncode(_user));
    notifyListeners();
  }

  // PUT /profile/update — only returns {success, message}, no updated user
  // object, so the submitted fields are merged into local state directly.
  Future<bool> updateProfile(Map<String, dynamic> data) async {
    _isLoading = true; _error = null; notifyListeners();
    try {
      await DioClient.instance.dio.put('/profile/update', data: data);
      _user = {...?_user, ...data};
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
      SocketService().connect(token);
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
    SocketService().disconnect();
    notifyListeners();
  }

  String _parseError(dynamic e) => ErrorHelper.extractError(e);
}
