import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_colors.dart';
import 'core/providers/auth_provider.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/worker/home_screen.dart';
import 'screens/worker/jobs_screen.dart';
import 'screens/worker/earnings_screen.dart';
import 'screens/worker/profile_screen.dart';

class WorkQuoraWorkerApp extends StatelessWidget {
  const WorkQuoraWorkerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(builder: (context, auth, _) {
      final router = GoRouter(
        initialLocation: '/',
        redirect: (context, state) {
          final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register';
          if (state.matchedLocation == '/') return null;
          if (!auth.isAuthenticated && !loggingIn) return '/login';
          if (auth.isAuthenticated && loggingIn) return '/home';
          return null;
        },
        routes: [
          GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
          GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
          GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
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

      return MaterialApp.router(
        title: 'WorkQuora Worker',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true, brightness: Brightness.dark,
          scaffoldBackgroundColor: AppColors.bg,
          colorScheme: const ColorScheme.dark(primary: AppColors.primary, surface: AppColors.surface, error: AppColors.error),
          appBarTheme: const AppBarTheme(backgroundColor: AppColors.bg, elevation: 0, iconTheme: IconThemeData(color: AppColors.text), titleTextStyle: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
        ),
        routerConfig: router,
      );
    });
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
          backgroundColor: AppColors.surface, selectedItemColor: AppColors.primary, unselectedItemColor: AppColors.textMuted, type: BottomNavigationBarType.fixed,
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
