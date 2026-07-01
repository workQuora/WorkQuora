import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../../../core/storage/secure_storage_service.dart';
import '../../domain/repositories/auth_repository.dart';
import '../datasources/auth_remote_datasource.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  AuthRepositoryImpl(this._remote, this._secureStorage);

  final AuthRemoteDataSource _remote;
  final SecureStorageService _secureStorage;

  /// Every public method funnels Dio failures through here so the UI layer
  /// never has to know about Dio/DioException — it only sees AppFailure.
  Future<Either<AppFailure, T>> _guard<T>(Future<T> Function() action) async {
    try {
      return Right(await action());
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
        return Left(AppFailure.network());
      }
      final status = e.response?.statusCode;
      final message = (e.response?.data is Map) ? e.response?.data['message'] as String? : null;
      // A 401 means different things depending on the call: for login/register
      // it's "Invalid credentials" or "Account locked" from the backend; for
      // getCurrentUser/refresh it genuinely means the session expired. Prefer
      // whatever message the backend actually sent — only fall back to the
      // generic "session expired" wording when the backend didn't send one
      // (e.g. a bare 401 from a proxy), so login failures show the real
      // reason instead of a confusing, unrelated message.
      if (status == 401) {
        return Left(message != null ? AppFailure.fromMessage(message, statusCode: 401) : AppFailure.unauthorized());
      }
      return Left(AppFailure.fromMessage(message ?? 'Something went wrong. Please try again.', statusCode: status));
    } catch (_) {
      return Left(AppFailure.fromMessage('Unexpected error. Please try again.'));
    }
  }

  @override
  AuthResult<String> register({
    required String name,
    required String email,
    required String password,
    String? username,
    String? mobileNumber,
    String role = 'CLIENT',
  }) =>
      _guard(() => _remote.register(
            name: name,
            email: email,
            password: password,
            username: username,
            mobileNumber: mobileNumber,
            role: role,
          ));

  @override
  AuthResult<String> verifyRegistration({required String email, required String otp}) =>
      _guard(() => _remote.verifyRegistration(email: email, otp: otp));

  @override
  AuthResult<UserModel> verifyMobile({required String email, required String otp}) => _guard(() async {
        final session = await _remote.verifyMobile(email: email, otp: otp);
        await _secureStorage.saveTokens(accessToken: session.accessToken, refreshToken: session.refreshToken);
        return session.user;
      });

  @override
  AuthResult<void> resendMobileOtp({String? email}) => _guard(() => _remote.resendMobileOtp(email: email));

  @override
  AuthResult<UserModel> login({required String emailOrUsername, required String password}) => _guard(() async {
        final session = await _remote.login(emailOrUsername: emailOrUsername, password: password);
        await _secureStorage.saveTokens(accessToken: session.accessToken, refreshToken: session.refreshToken);
        return session.user;
      });

  @override
  AuthResult<UserModel> getCurrentUser() => _guard(() => _remote.getMe());

  @override
  AuthResult<void> logout() => _guard(() async {
        final refreshToken = await _secureStorage.refreshToken;
        try {
          await _remote.logout(refreshToken: refreshToken);
        } finally {
          await _secureStorage.clear();
        }
      });

  @override
  AuthResult<void> forgotPassword({required String email}) => _guard(() => _remote.forgotPassword(email: email));

  @override
  AuthResult<void> resetPassword({required String email, required String otp, required String newPassword}) =>
      _guard(() => _remote.resetPassword(email: email, otp: otp, newPassword: newPassword));

  @override
  AuthResult<bool> checkUsernameAvailable(String username) => _guard(() => _remote.checkUsernameAvailable(username));

  @override
  Future<bool> hasActiveSession() => _secureStorage.hasSession;
}
