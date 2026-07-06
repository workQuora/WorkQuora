import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_colors.dart';
import 'core/network/dio_client.dart';
import 'core/providers/auth_provider.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/otp_screen.dart';
import 'screens/worker/home_screen.dart';
import 'screens/worker/jobs_screen.dart';
import 'screens/worker/earnings_screen.dart';
import 'screens/worker/profile_screen.dart';

class WorkQuoraWorkerApp extends StatefulWidget {
  const WorkQuoraWorkerApp({super.key});

  @override
  State<WorkQuoraWorkerApp> createState() => _WorkQuoraWorkerAppState();
}

class _WorkQuoraWorkerAppState extends State<WorkQuoraWorkerApp> {
  late final GoRouter _router;

  @override
  void initState() {
    super.initState();
    final auth = context.read<AuthProvider>();

    // Built exactly once; refreshListenable re-runs `redirect` on every
    // auth.notifyListeners() without recreating the router itself. Rebuilding
    // the router on every notify (e.g. via Consumer<AuthProvider> wrapping
    // this widget) resets navigation to initialLocation mid-flow — fatal for
    // the multi-step OTP flow, since register()/verifyEmailOtp() each fire
    // notifyListeners() for their loading state before the result.
    _router = GoRouter(
      initialLocation: '/',
      refreshListenable: auth,
      redirect: (context, state) {
        final loggingIn = state.matchedLocation == '/login' ||
            state.matchedLocation == '/register' ||
            state.matchedLocation == '/otp';
        if (state.matchedLocation == '/') return null;
        if (!auth.isAuthenticated && !loggingIn) return '/login';
        if (auth.isAuthenticated && loggingIn) return '/home';
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
            );
          },
        ),
        ShellRoute(
          builder: (context, state, child) => WorkerShell(child: child),
          routes: [
            GoRoute(path: '/home', builder: (_, __) => const WorkerHomeScreen()),
            GoRoute(path: '/jobs', builder: (_, __) => const JobsScreen()),
            GoRoute(path: '/earnings', builder: (_, __) => const EarningsScreen()),
            GoRoute(path: '/profile', builder: (_, __) => const WorkerProfileScreen()),
          ],
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
    final isDark = AppColors.isDark;
    return MaterialApp.router(
      title: 'WorkQuora Worker',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        brightness: isDark ? Brightness.dark : Brightness.light,
        scaffoldBackgroundColor: AppColors.background,
        colorScheme: isDark
            ? ColorScheme.dark(primary: AppColors.primary, surface: AppColors.surface, error: AppColors.error)
            : ColorScheme.light(primary: AppColors.primary, surface: AppColors.surface, error: AppColors.error),
        appBarTheme: AppBarTheme(
          backgroundColor: AppColors.background,
          elevation: 0,
          iconTheme: IconThemeData(color: AppColors.textPrimary),
          titleTextStyle: TextStyle(color: AppColors.textPrimary, fontSize: 18, fontWeight: FontWeight.bold),
        ),
      ),
      routerConfig: _router,
    );
  }
}

class WorkerShell extends StatefulWidget {
  final Widget child;
  const WorkerShell({super.key, required this.child});
  @override State<WorkerShell> createState() => _WorkerShellState();
}

class _WorkerShellState extends State<WorkerShell> {
  int _idx = 0;
  final _tabs = ['/home', '/jobs', '/earnings', '/profile'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.border, width: 0.5))),
        child: BottomNavigationBar(
          currentIndex: _idx, onTap: (i) { setState(() => _idx = i); context.go(_tabs[i]); },
          backgroundColor: AppColors.surface, selectedItemColor: AppColors.primary, unselectedItemColor: AppColors.textSecondary, type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold), unselectedLabelStyle: const TextStyle(fontSize: 10),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.work_rounded), label: 'Jobs'),
            BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_rounded), label: 'Earnings'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Me'),
          ],
        ),
      ),
    );
  }
}
