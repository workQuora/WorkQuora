import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/error/app_exception.dart';
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

    final result = await repo.getCurrentUser();
    return result.match((failure) => null, (user) => user);
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
        state = AsyncData(user);
        return null;
      },
    );
  }

  Future<void> logout() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.logout();
    state = const AsyncData(null);
  }

  void setUser(UserModel user) => state = AsyncData(user);

  /// Re-fetches /auth/me — used after actions elsewhere in the app (e.g.
  /// completing KYC) might have changed flags like `kycVerified` that this
  /// cached state doesn't know about yet.
  Future<void> refreshUser() async {
    final repo = ref.read(authRepositoryProvider);
    final result = await repo.getCurrentUser();
    result.match((failure) => null, (user) => state = AsyncData(user));
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
