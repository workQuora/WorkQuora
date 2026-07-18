import 'dart:async';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Shows a top-of-screen banner ("Job Accepted! 🎉") for ~4s, sliding down
/// on entry and back up before removal. flutter_local_notifications isn't
/// in this app (grepped pubspec.yaml — not present), so this is the
/// fallback the task calls for: an OverlayEntry banner instead of a system
/// notification. Needs an Overlay ancestor — pass the root navigator's
/// context (has one via MaterialApp.router's own Navigator), not any
/// arbitrary widget's context.
void showProposalAcceptedBanner(BuildContext context, {required String workerName}) {
  final overlay = Navigator.of(context, rootNavigator: true).overlay;
  if (overlay == null) return;

  late OverlayEntry entry;
  entry = OverlayEntry(
    builder: (context) => _AcceptedBanner(
      workerName: workerName,
      onDismissed: () => entry.remove(),
    ),
  );
  overlay.insert(entry);
}

class _AcceptedBanner extends StatefulWidget {
  final String workerName;
  final VoidCallback onDismissed;
  const _AcceptedBanner({required this.workerName, required this.onDismissed});

  @override
  State<_AcceptedBanner> createState() => _AcceptedBannerState();
}

class _AcceptedBannerState extends State<_AcceptedBanner> with SingleTickerProviderStateMixin {
  late final AnimationController _controller;
  late final Animation<Offset> _slide;
  Timer? _dismissTimer;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: const Duration(milliseconds: 320));
    _slide = Tween<Offset>(begin: const Offset(0, -1), end: Offset.zero)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
    _controller.forward();
    _dismissTimer = Timer(const Duration(seconds: 4), _dismiss);
  }

  Future<void> _dismiss() async {
    _dismissTimer?.cancel();
    if (!mounted) return;
    await _controller.reverse();
    widget.onDismissed();
  }

  @override
  void dispose() {
    _dismissTimer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Positioned(
      top: 0,
      left: 0,
      right: 0,
      child: SafeArea(
        child: SlideTransition(
          position: _slide,
          child: Padding(
            padding: const EdgeInsets.all(AppSpace.md),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                borderRadius: BorderRadius.circular(AppRadius.card),
                onTap: _dismiss,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: AppSpace.md),
                  decoration: BoxDecoration(
                    color: AppColors.brand,
                    borderRadius: BorderRadius.circular(AppRadius.card),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 16, offset: const Offset(0, 6))],
                  ),
                  child: Row(children: [
                    Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), shape: BoxShape.circle),
                      child: const Icon(Icons.notifications_active_rounded, color: Colors.white, size: 20),
                    ),
                    const SizedBox(width: AppSpace.md),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        const Text('Job Accepted! 🎉', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                        const SizedBox(height: 2),
                        Text(
                          '${widget.workerName} ne tumhari request accept kar li',
                          style: const TextStyle(color: Colors.white, fontSize: 13),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ]),
                    ),
                  ]),
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
