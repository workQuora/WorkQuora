import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hive_ce_flutter/hive_ce_flutter.dart';
import '../../../core/error/app_exception.dart';
import '../../../core/network/core_providers.dart';
import '../../../core/storage/hive_service.dart';
import '../data/auth_providers.dart';
import '../data/models/user_model.dart';

/// Holds the CURRENT signed-in user (or null). This is the single source of
/// truth the router and every gated screen reads — avoids each screen
/// independently checking "am I logged in".
class AuthController extends AsyncNotifier<UserModel?> {
  @override
  Future<UserModel?> build() async {
    final repo = ref.read(authRepositoryProvider);
    final hasSession = await repo.hasActiveSession();
    if (!hasSession) return null;

    // Load locally cached user details first to prevent page reloads from
    // immediately bouncing the user to /login while checking with the server.
    final cachedData = Hive.box(HiveBoxes.userProfile).get('current_user');
    if (cachedData != null) {
      final map = Map<String, dynamic>.from(cachedData as Map);
      final cachedUser = UserModel.fromJson(map);
      // Run async background verification to verify token status & get latest details
      _backgroundFetch();
      return cachedUser;
    }

    final result = await repo.getCurrentUser();
    return result.match(
      (failure) => null,
      (user) {
        _cacheUser(user);
        return user;
      },
    );
  }

  void _cacheUser(UserModel user) {
    Hive.box(HiveBoxes.userProfile).put('current_user', user.toJson());
  }

  Future<void> _backgroundFetch() async {
    final repo = ref.read(authRepositoryProvider);
    final result = await repo.getCurrentUser();
    result.match(
      (failure) {
        // If the server confirms the session is invalid/expired, log out immediately.
        // Ignore general network or server-down errors so the user remains offline-capable.
        if (failure.statusCode == 401) {
          logout();
        }
      },
      (user) {
        _cacheUser(user);
        state = AsyncData(user);
      },
    );
  }

  /// Deliberately does NOT set state to AsyncLoading while the request is in
  /// flight. The router's redirect treats authControllerProvider.isLoading
  /// as "app is still checking session on boot" and bounces to /splash — if
  /// that fires mid-login, LoginScreen gets disposed before the result comes
  /// back, which silently drops the error message on failure (and causes a
  /// jarring splash flash even on success). LoginScreen already tracks its
  /// own local isLoading for the button spinner, so this provider's state
  /// should only change once we have a real result — same as registration.
  Future<AppFailure?> login({required String emailOrUsername, required String password}) async {
    final repo = ref.read(authRepositoryProvider);
    final result = await repo.login(emailOrUsername: emailOrUsername, password: password);
    return result.match(
      (failure) => failure,
      (user) {
        _cacheUser(user);
        state = AsyncData(user);
        return null;
      },
    );
  }

  Future<void> logout() async {
    try {
      final repo = ref.read(authRepositoryProvider);
      await repo.logout();
    } catch (e) {
      print('Logout repo error: $e');
    }

    try {
      await HiveService.clearAllOnLogout();
    } catch (e) {
      print('Logout Hive error: $e');
    }

    try {
      final secureStorage = ref.read(secureStorageProvider);
      await secureStorage.clear();
    } catch (e) {
      print('Logout secure storage error: $e');
    }

    state = const AsyncData(null);
  }

  void setUser(UserModel user) {
    _cacheUser(user);
    state = AsyncData(user);
  }

  /// Re-fetches /auth/me — used after actions elsewhere in the app (e.g.
  /// completing KYC) might have changed flags like `kycVerified` that this
  /// cached state doesn't know about yet.
  Future<void> refreshUser() async {
    final repo = ref.read(authRepositoryProvider);
    final result = await repo.getCurrentUser();
    result.match(
      (failure) => null,
      (user) {
        _cacheUser(user);
        state = AsyncData(user);
      },
    );
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, UserModel?>(AuthController.new);

/// Convenience derived providers — screens should prefer these over reading
/// the full AsyncValue, so they don't rebuild on every loading/error tick.
final isAuthenticatedProvider = Provider<bool>((ref) {
  return ref.watch(authControllerProvider).valueOrNull != null;
});

final currentUserProvider = Provider<UserModel?>((ref) {
  return ref.watch(authControllerProvider).valueOrNull;
});
