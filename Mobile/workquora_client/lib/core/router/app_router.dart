import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../features/auth/application/auth_controller.dart';
import '../../features/auth/presentation/screens/login_screen.dart';
import '../../features/auth/presentation/screens/register_screen.dart';
import '../../features/discover/presentation/screens/discover_screen.dart';
import '../../features/messages/presentation/screens/chat_screen.dart';
import '../../features/messages/presentation/screens/conversations_screen.dart';
import '../../features/post_job/presentation/screens/post_job_screen.dart';
import '../../features/post_job/presentation/screens/project_success_screen.dart';
import '../../features/profile_kyc/presentation/screens/profile_screen.dart';
import '../../features/talent_profile/presentation/screens/talent_profile_screen.dart';
import '../../features/wallet/presentation/screens/wallet_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../shared/widgets/splash_screen.dart';
import 'main_shell.dart';

/// Re-evaluates redirects whenever authControllerProvider changes, without
/// needing a full widget rebuild of the router itself.
class _AuthRefreshListenable extends ChangeNotifier {
  _AuthRefreshListenable(Ref ref) {
    ref.listen(authControllerProvider, (_, __) => notifyListeners());
  }
}

final routerProvider = Provider<GoRouter>((ref) {
  final refreshListenable = _AuthRefreshListenable(ref);

  return GoRouter(
    initialLocation: '/login',
    refreshListenable: refreshListenable,
    redirect: (context, state) {
      final authState = ref.read(authControllerProvider);
      final isLoading = authState.isLoading;
      final isAuthenticated = authState.valueOrNull != null;
      final isAuthRoute = state.matchedLocation == '/login' || state.matchedLocation == '/register';

      if (isLoading) return '/splash';
      if (!isAuthenticated && !isAuthRoute) return '/login';
      if (isAuthenticated && (isAuthRoute || state.matchedLocation == '/splash')) return '/home';
      if (!isAuthenticated && state.matchedLocation == '/splash') return '/login';
      return null;
    },
    routes: [
      GoRoute(path: '/splash', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      GoRoute(path: '/wallet', builder: (_, __) => const WalletScreen()),
      GoRoute(path: '/notifications', builder: (_, __) => const NotificationsScreen()),
      GoRoute(
        path: '/project-success/:jobId',
        builder: (context, state) => ProjectSuccessScreen(
          jobId: state.pathParameters['jobId']!,
        ),
      ),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) => MainShell(navigationShell: navigationShell),
        branches: [
          StatefulShellBranch(routes: [
            GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/discover',
              builder: (_, __) => const DiscoverScreen(),
              routes: [
                GoRoute(
                  path: ':userId',
                  builder: (_, state) => TalentProfileScreen(userId: state.pathParameters['userId']!),
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/post', builder: (_, __) => const PostJobScreen()),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(
              path: '/messages',
              builder: (_, __) => const ConversationsScreen(),
              routes: [
                GoRoute(
                  path: ':jobId/:otherUserId',
                  builder: (_, state) {
                    final extra = state.extra as Map<String, dynamic>?;
                    return ChatScreen(
                      jobId: state.pathParameters['jobId']!,
                      otherUserId: state.pathParameters['otherUserId']!,
                      otherUserName: extra?['name'] as String?,
                      otherUserAvatar: extra?['profilePic'] as String?,
                      jobTitle: extra?['jobTitle'] as String?,
                    );
                  },
                ),
              ],
            ),
          ]),
          StatefulShellBranch(routes: [
            GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
          ]),
        ],
      ),
    ],
  );
});
