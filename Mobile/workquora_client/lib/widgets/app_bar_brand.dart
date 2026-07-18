import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../core/providers/auth_provider.dart';
import '../core/providers/notifications_provider.dart';
import '../theme/app_theme.dart';

/// Standard app bar: "WorkQuora" wordmark · bell w/ unread dot · profile
/// avatar (was a hamburger that pushed Settings — Profile is reachable from
/// there instead, and the avatar is a more direct affordance than a generic
/// menu icon for a destination that's always the same screen).
class AppBarBrand extends StatelessWidget implements PreferredSizeWidget {
  const AppBarBrand({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    // select, not watch — this app bar is on nearly every screen, and a full
    // watch would rebuild it on any notification-list change (new item,
    // markAsRead, fetchNotifications' isLoading toggling) even when the
    // unread count itself hasn't moved.
    final unread = context.select<NotificationsProvider, int>((p) => p.unreadCount);
    final user = context.watch<AuthProvider>().user ?? {};
    final name = (user['name'] ?? '').toString();
    final photoUrl = (user['profilePic'] ?? user['avatar'] ?? '').toString();

    return AppBar(
      centerTitle: false,
      automaticallyImplyLeading: false,
      title: Text('WorkQuora', style: theme.appBarTheme.titleTextStyle),
      actions: [
        Stack(
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
                    color: tokens.danger,
                    shape: BoxShape.circle,
                    border: Border.all(color: theme.scaffoldBackgroundColor, width: 1.5),
                  ),
                ),
              ),
          ],
        ),
        Padding(
          padding: const EdgeInsets.only(right: AppSpace.md, left: AppSpace.xs),
          child: GestureDetector(
            onTap: () => context.push('/profile'),
            child: CircleAvatar(
              radius: 16,
              backgroundColor: tokens.brandSoft,
              backgroundImage: photoUrl.isNotEmpty ? CachedNetworkImageProvider(photoUrl, maxWidth: 96, maxHeight: 96) : null,
              child: photoUrl.isEmpty
                  ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 13))
                  : null,
            ),
          ),
        ),
      ],
    );
  }
}
