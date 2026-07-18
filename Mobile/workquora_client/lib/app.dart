import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/chat_provider.dart';
import 'core/providers/job_detail_provider.dart';
import 'core/providers/jobs_provider.dart';
import 'core/providers/notifications_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/network/dio_client.dart';
import 'core/services/socket_service.dart';
import 'theme/app_theme.dart';
import 'widgets/bottom_nav.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/otp_screen.dart';
import 'screens/auth/success_animation_screen.dart';
import 'screens/client/dashboard_screen.dart';
import 'screens/client/home_screen.dart';
import 'screens/client/post_job_screen.dart';
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

class _WorkQuoraClientAppState extends State<WorkQuoraClientApp> with WidgetsBindingObserver {
  late final GoRouter _router;
  late final AuthProvider _auth;
  bool _wasAuthenticated = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    final auth = context.read<AuthProvider>();
    _auth = auth;
    _wasAuthenticated = auth.isAuthenticated;
    // Every provider clears its own state and unsubscribes/rejoins nothing
    // it shouldn't — the two real logout paths (this Settings-driven one and
    // DioClient.onSessionExpired below) both go through AuthProvider.logout(),
    // so hooking the transition here covers both without duplicating the
    // reset call at every call site.
    auth.addListener(_onAuthChanged);

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
        GoRoute(
          path: '/success',
          builder: (context, state) {
            final extra = state.extra as Map<String, dynamic>;
            return SuccessAnimationScreen(nextRoute: extra['nextRoute'] as String);
          },
        ),
        GoRoute(path: '/terms-accept', builder: (_, __) => const TermsScreen(acceptanceMode: true)),
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
                path: '/dashboard', builder: (_, __) => const DashboardScreen()),
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
        // Not a bottom-nav tab anymore (Dashboard replaced it) — reachable
        // from Profile → My Jobs instead, pushed the same way /conversations is.
        GoRoute(
            path: '/my-jobs', builder: (_, __) => const MyJobsScreen()),
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

  // Fires on every AuthProvider.notifyListeners() call, so it must check the
  // actual true->false transition rather than resetting on every auth event
  // (login/register also notify, sometimes twice in one flow).
  void _onAuthChanged() {
    final isAuth = _auth.isAuthenticated;
    if (_wasAuthenticated && !isAuth) {
      context.read<JobsProvider>().reset();
      context.read<ChatProvider>().reset();
      context.read<NotificationsProvider>().reset();
      context.read<JobDetailProvider>().reset();
      // ThemeProvider is deliberately NOT reset — theme mode is a device
      // preference, not per-account data; it should survive a logout.
    }
    _wasAuthenticated = isAuth;
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state != AppLifecycleState.resumed) return;
    // socket_io_client's own enableReconnection() already recovers from
    // brief network blips without any help — this only matters for the
    // longer case: the app was backgrounded long enough that the OS
    // suspended the socket and its 5 automatic reconnection attempts (see
    // SocketService.connect) were exhausted while we weren't watching. If
    // still authenticated and genuinely disconnected, reconnect explicitly;
    // SocketService's onConnect listeners (NotificationsProvider, any open
    // ChatScreen/JobTrackingScreen) re-subscribe/re-join themselves once the
    // resulting 'connect' event fires.
    if (_auth.isAuthenticated && !SocketService().isConnected) {
      DioClient.instance.getToken().then((token) {
        if (token != null) SocketService().connect(token);
      });
    }
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _auth.removeListener(_onAuthChanged);
    super.dispose();
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
  final _tabs = ['/home', null, '/post-job', '/dashboard', '/profile'];

  void _onTap(int i) async {
    final path = _tabs[i];
    if (path == null) {
      // Not a shell route — pushed on top instead of switched to. Refresh
      // on return so the badge reflects whatever got read while it was open.
      await context.push('/conversations');
      if (mounted) context.read<ChatProvider>().fetchConversations(force: true);
      return;
    }
    setState(() => _currentIndex = i);
    context.go(path);
  }

  @override
  Widget build(BuildContext context) {
    // select, not watch — this shell wraps every tab, and a full watch would
    // rebuild the Scaffold/BottomNav on any conversation-list change (e.g. a
    // live message updating lastMessage text) even when the unread total
    // itself hasn't moved.
    final unreadMessages = context.select<ChatProvider, int>((c) => c.totalUnreadCount);
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: BottomNav(currentIndex: _currentIndex, onTap: _onTap, unreadMessages: unreadMessages),
    );
  }
}
