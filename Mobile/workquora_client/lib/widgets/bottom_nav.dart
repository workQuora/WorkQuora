import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Fixed bottom nav used on every screen: Home · Messages · Post (center,
/// raised) · Dashboard · Profile. [currentIndex] uses the same 0..4 indexing
/// as the tab list (Post is index 2); [onTap] receives that index for all
/// five items, including the raised center button.
class BottomNav extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  // Messages tab (index 1) only, for now — the only tab with a live unread
  // concept today. 0 (default) draws no badge.
  final int unreadMessages;

  const BottomNav({super.key, required this.currentIndex, required this.onTap, this.unreadMessages = 0});

  static const _items = [
    (icon: Icons.home_rounded, outlineIcon: Icons.home_outlined, label: 'Home'),
    (icon: Icons.chat_bubble_rounded, outlineIcon: Icons.chat_bubble_outline_rounded, label: 'Messages'),
    (icon: Icons.add, outlineIcon: Icons.add, label: 'Post'),
    (icon: Icons.dashboard_rounded, outlineIcon: Icons.dashboard_outlined, label: 'Dashboard'),
    (icon: Icons.person_rounded, outlineIcon: Icons.person_outline_rounded, label: 'Profile'),
  ];

  Widget _navItem(BuildContext context, int index) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final item = _items[index];
    final selected = index == currentIndex;
    final color = selected ? theme.colorScheme.primary : tokens.muted;
    final badgeCount = index == 1 ? unreadMessages : 0;

    return Expanded(
      child: InkWell(
        onTap: () => onTap(index),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(clipBehavior: Clip.none, children: [
              Icon(selected ? item.icon : item.outlineIcon, color: color, size: 24),
              if (badgeCount > 0)
                Positioned(
                  right: -6,
                  top: -4,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    decoration: BoxDecoration(color: tokens.danger, borderRadius: BorderRadius.circular(AppRadius.chip)),
                    child: Text(
                      badgeCount > 9 ? '9+' : '$badgeCount',
                      textAlign: TextAlign.center,
                      style: theme.textTheme.labelSmall?.copyWith(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold, height: 1.2),
                    ),
                  ),
                ),
            ]),
            const SizedBox(height: 2),
            Text(item.label, style: theme.textTheme.labelSmall?.copyWith(color: color, fontWeight: selected ? FontWeight.w700 : FontWeight.w500)),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    return SizedBox(
      height: 78,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.topCenter,
        children: [
          Positioned.fill(
            top: 14,
            child: Container(
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                border: Border(top: BorderSide(color: tokens.border, width: 0.5)),
              ),
              child: Row(
                children: [
                  _navItem(context, 0),
                  _navItem(context, 1),
                  const SizedBox(width: 64),
                  _navItem(context, 3),
                  _navItem(context, 4),
                ],
              ),
            ),
          ),
          Positioned(
            top: 0,
            child: GestureDetector(
              onTap: () => onTap(2),
              child: Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: theme.scaffoldBackgroundColor, width: 4),
                  boxShadow: [
                    BoxShadow(color: theme.colorScheme.primary.withValues(alpha: 0.35), blurRadius: 16, offset: const Offset(0, 6)),
                  ],
                ),
                child: const Icon(Icons.add_rounded, color: Colors.white, size: 30),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
