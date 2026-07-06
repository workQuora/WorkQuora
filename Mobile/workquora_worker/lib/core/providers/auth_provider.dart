import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../constants/api_constants.dart';
import '../network/dio_client.dart';
import '../services/socket_service.dart';

class AuthProvider extends ChangeNotifier {
  Map<String, dynamic>? _user;
  String? _token;
  bool _isLoading = false;
  String? _error;
  String? _pendingEmail;
  Map<String, dynamic>? _pendingRegistrationData;

  Map<String, dynamic>? get user => _user;
  String? get token => _token;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _token != null && _user != null;
  String? get pendingEmail => _pendingEmail;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
    final userStr = prefs.getString('user');
    if (userStr != null) {
      _user = jsonDecode(userStr);
    }
    if (_token != null) {
      DioClient.instance.setToken(_token!);
    }
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  Future<bool> validateToken() async {
    if (_token == null) return false;
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.getMe);
      _user = res.data['data'];
      await _persistUser();
      notifyListeners();
      return true;
    } catch (_) {
      await logout();
      return false;
    }
  }

  // Worker app only — rejects any account whose role isn't FREELANCER.
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await DioClient.instance.dio.post(
        ApiConstants.login,
        data: {'email': email, 'password': password},
      );

      final token = res.data['token']?.toString();
      final user = res.data['user'] as Map<String, dynamic>?;
      if (token == null || user == null) {
        throw Exception('Invalid response from server');
      }

      if ((user['role']?.toString().toUpperCase()) != 'FREELANCER') {
        _isLoading = false;
        _error = 'This account is not a worker account. Use the WorkQuora client app instead.';
        notifyListeners();
        return false;
      }

      _token = token;
      _user = user;
      await _persistSession(token, user);
      DioClient.instance.setToken(token);
      SocketService().connect(token);

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _parseError(e, fallback: 'Login failed');
      notifyListeners();
      return false;
    }
  }

  // STEP 1 — sends the email OTP. No token yet.
  Future<bool> register(Map<String, dynamic> data) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      data['role'] = 'FREELANCER';
      _pendingRegistrationData = data;
      _pendingEmail = data['email'];

      await DioClient.instance.dio.post(ApiConstants.register, data: data);
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _parseError(e, fallback: 'Registration failed');
      notifyListeners();
      return false;
    }
  }

  // STEP 2 — verifies the email OTP. Backend auto-sends the mobile OTP on
  // success. Still no token.
  Future<bool> verifyEmailOtp(String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      await DioClient.instance.dio.post(
        ApiConstants.verifyRegistration,
        data: {'email': _pendingEmail, 'otp': otp},
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _parseError(e, fallback: 'Invalid OTP');
      notifyListeners();
      return false;
    }
  }

  // STEP 3 — verifies the mobile OTP. This is the step that finally issues
  // a token.
  Future<bool> verifyMobileOtp(String otp) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await DioClient.instance.dio.post(
        ApiConstants.verifyMobile,
        data: {'email': _pendingEmail, 'otp': otp},
      );

      final token = res.data['token']?.toString();
      final user = res.data['user'] as Map<String, dynamic>?;
      if (token == null || user == null) {
        throw Exception('Invalid response from server');
      }

      _token = token;
      _user = user;
      await _persistSession(token, user);
      DioClient.instance.setToken(token);
      SocketService().connect(token);

      _pendingEmail = null;
      _pendingRegistrationData = null;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isLoading = false;
      _error = _parseError(e, fallback: 'Verification failed');
      notifyListeners();
      return false;
    }
  }

  // Re-sends the email OTP by re-submitting the same registration payload —
  // there's no dedicated resend endpoint; the backend regenerates the OTP
  // for an existing unverified user on repeat POST /auth/register.
  Future<bool> resendEmailOtp() async {
    if (_pendingRegistrationData == null) return false;
    try {
      await DioClient.instance.dio.post(ApiConstants.register, data: _pendingRegistrationData);
      return true;
    } catch (_) {
      return false;
    }
  }

  Future<bool> resendMobileOtp() async {
    if (_pendingEmail == null) return false;
    try {
      await DioClient.instance.dio.post(ApiConstants.sendMobileOtp, data: {'email': _pendingEmail});
      return true;
    } catch (_) {
      return false;
    }
  }

  // NOTE: backend has no matching route for this yet (audit finding) — kept
  // as a no-op-on-failure call so home_screen.dart keeps compiling until
  // Batch 2 rebuilds it against a real endpoint.
  Future<void> updateAvailability(bool val) async {
    try {
      await DioClient.instance.dio.put('/freelancers/profile', data: {'isAvailable': val});
      _user?['isAvailable'] = val;
      await _persistUser();
      notifyListeners();
    } catch (_) {}
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
    await prefs.remove('user');
    _token = null;
    _user = null;
    DioClient.instance.clearToken();
    SocketService().disconnect();
    notifyListeners();
  }

  Future<void> _persistSession(String token, Map<String, dynamic> user) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
    await prefs.setString('user', jsonEncode(user));
  }

  Future<void> _persistUser() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('user', jsonEncode(_user));
  }

  String _parseError(dynamic e, {required String fallback}) {
    if (e is DioException) {
      return e.response?.data?['message']?.toString() ?? e.message ?? fallback;
    }
    return fallback;
  }
}
