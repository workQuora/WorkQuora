import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/chat_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/network/dio_client.dart';
import 'theme/app_theme.dart';
import 'widgets/bottom_nav.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/otp_screen.dart';
import 'screens/client/home_screen.dart';
import 'screens/client/post_job_screen.dart';
import 'screens/client/wallet_screen.dart';
import 'screens/client/profile_screen.dart';
import 'screens/client/worker_detail_screen.dart';
import 'screens/client/notifications_screen.dart';
import 'screens/client/settings_screen.dart';
import 'screens/chat/conversations_screen.dart';
import 'screens/chat/chat_screen.dart';
import 'screens/client/job_detail_screen.dart';
import 'screens/client/job_tracking_screen.dart';
import 'screens/client/my_jobs_screen.dart';
import 'screens/client/terms_screen.dart';

class WorkQuoraClientApp extends StatefulWidget {
  const WorkQuoraClientApp({super.key});

  @override
  State<WorkQuoraClientApp> createState() => _WorkQuoraClientAppState();
}

class _WorkQuoraClientAppState extends State<WorkQuoraClientApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();

    // Built exactly once. refreshListenable re-runs `redirect` whenever
    // AuthProvider calls notifyListeners() — without ever recreating the
    // router itself. Recreating GoRouter on every rebuild (the previous
    // approach, via Consumer<AuthProvider> wrapping this whole widget) reset
    // the router to initialLocation on every notifyListeners() call — and
    // login() alone fires notifyListeners() twice (isLoading=true, then the
    // result) — bouncing the app back to Splash mid-login and losing the
    // in-flight navigation, which is what caused the "stuck on loading" bug.
    _router = GoRouter(
      initialLocation: '/',
      refreshListenable: auth,
      redirect: (context, state) {
        final loggingIn = state.matchedLocation == '/login' ||
            state.matchedLocation == '/register' ||
            state.matchedLocation == '/otp';
        if (state.matchedLocation == '/') return null;
        if (!auth.isAuthenticated && !loggingIn) {
          return '/login';
        }
        if (auth.isAuthenticated && loggingIn) {
          return '/home';
        }
        return null;
      },
      routes: [
        GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
        GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
        GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
        GoRoute(
          path: '/otp',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return OtpScreen(
              title: extra['title'] as String,
              subtitle: extra['subtitle'] as String,
              isMobileOtp: extra['isMobileOtp'] as bool,
              reverifyEmail: extra['reverifyEmail'] as String?,
            );
          },
        ),
        ShellRoute(
          builder: (context, state, child) => ClientShell(child: child),
          routes: [
            GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
            GoRoute(
              path: '/post-job',
              builder: (context, state) => PostJobScreen(
                initialCategory: (state.extra as Map?)?['category'] as String?,
              ),
            ),
            GoRoute(
                path: '/my-jobs', builder: (_, __) => const MyJobsScreen()),
            GoRoute(
                path: '/profile', builder: (_, __) => const ProfileScreen()),
          ],
        ),
        GoRoute(
          path: '/worker/:id',
          builder: (context, state) =>
              WorkerDetailScreen(workerId: state.pathParameters['id']!),
        ),
        GoRoute(
            path: '/notifications',
            builder: (_, __) => const NotificationsScreen()),
        GoRoute(path: '/settings', builder: (_, __) => const SettingsScreen()),
        GoRoute(path: '/terms', builder: (_, __) => const TermsScreen()),
        GoRoute(
            path: '/conversations',
            builder: (_, __) => const ConversationsScreen()),
        GoRoute(
          path: '/chat',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return ChatScreen(
              jobId: extra['jobId'] as String,
              otherUserId: extra['otherUserId'] as String,
              otherUserName: extra['otherUserName'] as String,
              otherUserAvatar: extra['otherUserAvatar'] as String?,
            );
          },
        ),
        // Phase A: client KYC removed. Wallet is reachable from Settings
        // (balance/transaction history) but is no longer a bottom-nav tab —
        // History (/my-jobs) replaced it, per the new nav.
        GoRoute(path: '/wallet', builder: (_, __) => const WalletScreen()),
        GoRoute(
          path: '/job/:jobId',
          builder: (context, state) =>
              JobDetailScreen(jobId: state.pathParameters['jobId']!),
        ),
        GoRoute(
          path: '/job/:jobId/track',
          builder: (context, state) =>
              JobTrackingScreen(jobId: state.pathParameters['jobId']!),
        ),
      ],
    );

    DioClient.instance.onSessionExpired = () {
      auth.logout();
      _router.go('/login');
    };
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = context.watch<ThemeProvider>();
    final isDark = themeProvider.isDarkMode;

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: isDark
          ? const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.light,
              statusBarBrightness: Brightness.dark,
            )
          : const SystemUiOverlayStyle(
              statusBarColor: Colors.transparent,
              statusBarIconBrightness: Brightness.dark,
              statusBarBrightness: Brightness.light,
            ),
      child: MaterialApp.router(
        title: 'WorkQuora Client',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light,
        darkTheme: AppTheme.dark,
        themeMode: themeProvider.themeMode,
        routerConfig: _router,
      ),
    );
  }
}

class ClientShell extends StatefulWidget {
  final Widget child;
  const ClientShell({super.key, required this.child});

  @override
  State<ClientShell> createState() => _ClientShellState();
}

class _ClientShellState extends State<ClientShell> {
  int _currentIndex = 0;
  // Messages (index 1) isn't a shell route — /conversations lives outside
  // the ShellRoute, so it's pushed rather than switched to like the other
  // persistent tabs. null marks that slot.
  final _tabs = ['/home', null, '/post-job', '/my-jobs', '/profile'];

  void _onTap(int i) async {
    final path = _tabs[i];
    if (path == null) {
      // Not a shell route — pushed on top instead of switched to. Refresh
      // on return so the badge reflects whatever got read while it was open.
      await context.push('/conversations');
      if (mounted) context.read<ChatProvider>().fetchConversations();
      return;
    }
    setState(() => _currentIndex = i);
    context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    final unreadMessages = context.watch<ChatProvider>().totalUnreadCount;
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNav(currentIndex: _currentIndex, onTap: _onTap, unreadMessages: unreadMessages),
    );
  }
}
