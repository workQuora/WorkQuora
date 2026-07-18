import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/providers/notifications_provider.dart';
import '../theme/app_theme.dart';

/// Standard app bar: menu · "WorkQuora" wordmark · bell w/ unread dot.
class AppBarBrand extends StatelessWidget implements PreferredSizeWidget {
  const AppBarBrand({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final unread = context.watch<NotificationsProvider>().unreadCount;

    return AppBar(
      centerTitle: false,
      leading: IconButton(
        icon: const Icon(Icons.menu_rounded),
        onPressed: () => context.push('/settings'),
        tooltip: 'Menu',
      ),
      title: Text('WorkQuora', style: theme.appBarTheme.titleTextStyle),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: AppSpace.md),
          child: Stack(
            clipBehavior: Clip.none,
            children: [
              IconButton(
                icon: const Icon(Icons.notifications_outlined),
                onPressed: () => context.push('/notifications'),
                tooltip: 'Notifications',
              ),
              if (unread > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    width: 9,
                    height: 9,
                    decoration: BoxDecoration(
                      color: theme.extension<AppTokens>()!.danger,
                      shape: BoxShape.circle,
                      border: Border.all(color: theme.scaffoldBackgroundColor, width: 1.5),
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }
}
