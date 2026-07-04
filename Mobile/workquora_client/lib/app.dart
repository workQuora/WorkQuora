import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'core/constants/app_colors.dart';
import 'core/providers/auth_provider.dart';
import 'screens/auth/splash_screen.dart';
import 'screens/auth/login_screen.dart';
import 'screens/auth/register_screen.dart';
import 'screens/auth/otp_screen.dart';
import 'screens/client/home_screen.dart';
import 'screens/client/discover_screen.dart';
import 'screens/client/post_job_screen.dart';
import 'screens/client/wallet_screen.dart';
import 'screens/client/profile_screen.dart';
import 'screens/client/worker_detail_screen.dart';

class WorkQuoraClientApp extends StatelessWidget {
  const WorkQuoraClientApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        final router = GoRouter(
          initialLocation: '/',
          redirect: (context, state) {
            final loggingIn = state.matchedLocation == '/login' || state.matchedLocation == '/register' || state.matchedLocation == '/otp';
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
                );
              },
            ),
            ShellRoute(
              builder: (context, state, child) => ClientShell(child: child),
              routes: [
                GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
                GoRoute(path: '/discover', builder: (_, __) => const DiscoverScreen()),
                GoRoute(path: '/post-job', builder: (_, __) => const PostJobScreen()),
                GoRoute(path: '/wallet', builder: (_, __) => const WalletScreen()),
                GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
              ],
            ),
            GoRoute(
              path: '/worker/:id',
              builder: (context, state) => WorkerDetailScreen(workerId: state.pathParameters['id']!),
            ),
          ],
        );

        return MaterialApp.router(
          title: 'WorkQuora Client',
          debugShowCheckedModeBanner: false,
          theme: ThemeData(
            useMaterial3: true,
            brightness: Brightness.dark,
            scaffoldBackgroundColor: AppColors.bg,
            colorScheme: const ColorScheme.dark(
              primary: AppColors.primary,
              surface: AppColors.surface,
              error: AppColors.error,
            ),
            appBarTheme: const AppBarTheme(
              backgroundColor: AppColors.bg,
              elevation: 0,
              iconTheme: IconThemeData(color: AppColors.text),
              titleTextStyle: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold),
            ),
          ),
          routerConfig: router,
        );
      },
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
  final _tabs = ['/home', '/discover', '/post-job', '/wallet', '/profile'];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: widget.child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.surface,
          border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) {
            setState(() => _currentIndex = i);
            context.go(_tabs[i]);
          },
          backgroundColor: AppColors.surface,
          selectedItemColor: AppColors.primary,
          unselectedItemColor: AppColors.textMuted,
          type: BottomNavigationBarType.fixed,
          selectedLabelStyle: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontSize: 10),
          items: const [
            BottomNavigationBarItem(icon: Icon(Icons.home_rounded), label: 'Home'),
            BottomNavigationBarItem(icon: Icon(Icons.explore_rounded), label: 'Discover'),
            BottomNavigationBarItem(icon: Icon(Icons.add_circle_rounded), label: 'Post Job'),
            BottomNavigationBarItem(icon: Icon(Icons.account_balance_wallet_rounded), label: 'Wallet'),
            BottomNavigationBarItem(icon: Icon(Icons.person_rounded), label: 'Me'),
          ],
        ),
      ),
    );
  }
}
