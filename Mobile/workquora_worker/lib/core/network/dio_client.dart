import 'package:dio/dio.dart';
import '../constants/api_constants.dart';

class DioClient {
  static final DioClient instance = DioClient._internal();
  DioClient._internal();

  late Dio dio;

  // Set by app.dart after the router exists, so a 401 can log out and
  // redirect without DioClient needing to know about navigation.
  void Function()? onSessionExpired;

  void init() {
    dio = Dio(BaseOptions(
      baseUrl: ApiConstants.baseUrl,
      connectTimeout: const Duration(seconds: 60),
      receiveTimeout: const Duration(seconds: 60),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          onSessionExpired?.call();
        }
        return handler.next(error);
      },
    ));
  }

  void setToken(String token) {
    dio.options.headers['Authorization'] = 'Bearer $token';
  }

  void clearToken() {
    dio.options.headers.remove('Authorization');
  }
}
