import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/providers/auth_provider.dart';
import '../../theme/app_theme.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});
  @override State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;
  late Animation<double> _fade;
  late Animation<double> _scale;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 900));
    final curve = CurvedAnimation(parent: _ctrl, curve: Curves.easeOut);
    _fade = Tween<double>(begin: 0, end: 1).animate(curve);
    _scale = Tween<double>(begin: 0.85, end: 1.0).animate(curve);
    _ctrl.forward();
    _init();
  }

  Future<void> _init() async {
    // The branding delay and the token-validation network call used to run
    // serially (1800ms dead time, then the request) — now concurrent, so
    // total wait is max(1800ms, request time) instead of the sum. Keeps the
    // splash animation's minimum visible time on a fast network without
    // taxing a slow one with an extra 1.8s on top of the request itself.
    final minDelay = Future.delayed(const Duration(milliseconds: 1800));
    final auth = context.read<AuthProvider>();
    final valid = await auth.validateToken();
    await minDelay;
    if (!mounted) return;
    if (valid) {
      context.go('/home');
    } else {
      context.go('/login');
    }
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      // Fixed brand indigo, deliberately the same in both themes and
      // matching the native launch_background.xml exactly — no color flash
      // between the native splash and this one taking over.
      backgroundColor: AppColors.brand,
      body: Center(
        child: FadeTransition(
          opacity: _fade,
          child: ScaleTransition(
            scale: _scale,
            child: SvgPicture.asset('assets/logos/logo_splash.svg', width: 220, height: 220),
          ),
        ),
      ),
    );
  }
}
