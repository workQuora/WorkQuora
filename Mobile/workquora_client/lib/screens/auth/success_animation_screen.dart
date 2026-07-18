import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../theme/app_theme.dart';

/// Full-screen branded success animation shown for ~2.5s after a successful
/// login or registration, before continuing to [nextRoute]. Deliberately
/// fixed-indigo regardless of theme — same precedent as Splash's own logo
/// treatment (a brief always-on-brand moment, not a themed surface) — and
/// deliberately not skippable: no back button, no tap-through.
class SuccessAnimationScreen extends StatefulWidget {
  final String nextRoute;
  const SuccessAnimationScreen({super.key, required this.nextRoute});

  @override
  State<SuccessAnimationScreen> createState() => _SuccessAnimationScreenState();
}

class _SuccessAnimationScreenState extends State<SuccessAnimationScreen> with SingleTickerProviderStateMixin {
  static const _duration = Duration(milliseconds: 2600);

  late final AnimationController _controller;
  late final Animation<double> _logoScale;
  late final Animation<double> _logoFade;
  late final Animation<double> _ringScale;
  late final Animation<double> _ringFade;
  late final Animation<double> _checkFade;
  Timer? _navTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: _duration)..forward();

    _logoScale = TweenSequence<double>([
      TweenSequenceItem(tween: Tween(begin: 0.4, end: 1.15).chain(CurveTween(curve: Curves.easeOutBack)), weight: 35),
      TweenSequenceItem(tween: Tween(begin: 1.15, end: 1.0).chain(CurveTween(curve: Curves.easeOut)), weight: 15),
      TweenSequenceItem(tween: ConstantTween(1.0), weight: 50),
    ]).animate(_controller);
    _logoFade = CurvedAnimation(parent: _controller, curve: const Interval(0.0, 0.2, curve: Curves.easeIn));
    _ringScale = Tween<double>(begin: 0.6, end: 2.4)
        .animate(CurvedAnimation(parent: _controller, curve: const Interval(0.1, 0.65, curve: Curves.easeOut)));
    _ringFade = CurvedAnimation(parent: _controller, curve: const Interval(0.1, 0.65, curve: Curves.easeIn));
    _checkFade = CurvedAnimation(parent: _controller, curve: const Interval(0.55, 0.8, curve: Curves.easeIn));

    _navTimer = Timer(_duration, () {
      if (mounted) context.go(widget.nextRoute);
    });
  }

  @override
  void dispose() {
    _navTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: Scaffold(
        backgroundColor: AppColors.brand,
        body: Center(
          child: AnimatedBuilder(
            animation: _controller,
            builder: (context, _) {
              return Stack(alignment: Alignment.center, children: [
                Opacity(
                  opacity: (1 - _ringFade.value).clamp(0.0, 1.0),
                  child: Transform.scale(
                    scale: _ringScale.value,
                    child: Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: 0.5), width: 2)),
                    ),
                  ),
                ),
                FadeTransition(
                  opacity: _logoFade,
                  child: Transform.scale(
                    scale: _logoScale.value,
                    child: Container(
                      width: 96,
                      height: 96,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(26),
                        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 28, offset: const Offset(0, 10))],
                      ),
                      child: ClipRRect(borderRadius: BorderRadius.circular(26), child: Image.asset('assets/logo.png', fit: BoxFit.cover)),
                    ),
                  ),
                ),
                Positioned(
                  bottom: -44,
                  child: FadeTransition(
                    opacity: _checkFade,
                    child: Row(mainAxisSize: MainAxisSize.min, children: [
                      const Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                      const SizedBox(width: 6),
                      Text('Success', style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Colors.white, fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ),
              ]);
            },
          ),
        ),
      ),
    );
  }
}
