import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../core/providers/chat_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/shimmer_list.dart';

class ConversationsScreen extends StatefulWidget {
  const ConversationsScreen({super.key});
  @override
  State<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends State<ConversationsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<ChatProvider>().fetchConversations());
  }

  String _timeAgo(String? raw) {
    if (raw == null) return '';
    // lastMessageTime is already a localized date string (en-IN) from the
    // backend, not raw ISO — try to parse it, but fall back to showing it
    // verbatim if it doesn't parse as a DateTime.
    final dt = DateTime.tryParse(raw);
    if (dt == null) return raw;
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${dt.day}/${dt.month}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final chat = context.watch<ChatProvider>();
    // Most-recent-first — backend already sorts messages newest-first when
    // building the conversation map, so the list arrives in that order.
    final conversations = chat.conversations;

    return Scaffold(
      appBar: AppBar(title: const Text('Messages')),
      body: RefreshIndicator(
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surface,
        onRefresh: () => chat.fetchConversations(force: true),
        child: chat.isLoading && conversations.isEmpty
            ? const ShimmerList()
            : conversations.isEmpty
                    ? _buildEmpty(theme, tokens)
                    : ListView.separated(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(vertical: AppSpace.sm),
                        itemCount: conversations.length,
                        separatorBuilder: (_, __) => Divider(color: tokens.border, height: 1, indent: 78),
                        itemBuilder: (_, i) => _ConversationTile(convo: conversations[i], timeAgo: _timeAgo),
                      ),
      ),
    );
  }


  Widget _buildEmpty(ThemeData theme, AppTokens tokens) {
    return ListView(physics: const AlwaysScrollableScrollPhysics(), children: [
      const SizedBox(height: 120),
      Icon(Icons.chat_bubble_outline_rounded, size: 64, color: tokens.muted),
      const SizedBox(height: AppSpace.md),
      Center(child: Text('No conversations yet', style: theme.textTheme.titleMedium)),
      const SizedBox(height: 4),
      Center(child: Text('Messages appear after posting a job', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted))),
    ]);
  }
}

class _ConversationTile extends StatelessWidget {
  final dynamic convo;
  final String Function(String?) timeAgo;
  const _ConversationTile({required this.convo, required this.timeAgo});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final name = convo['name']?.toString() ?? 'User';
    final pic = convo['profilePic']?.toString() ?? '';
    final unread = (convo['unreadCount'] ?? 0) as int;

    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: 4),
      leading: CircleAvatar(
        radius: 26,
        backgroundColor: tokens.brandSoft,
        backgroundImage: pic.isNotEmpty ? CachedNetworkImageProvider(pic, maxWidth: 160, maxHeight: 160) : null,
        child: pic.isEmpty ? Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)) : null,
      ),
      title: Text(name, style: theme.textTheme.titleMedium, maxLines: 1, overflow: TextOverflow.ellipsis),
      subtitle: Text(
        convo['lastMessage']?.toString() ?? '',
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: theme.textTheme.bodySmall?.copyWith(color: unread > 0 ? theme.colorScheme.onSurface : tokens.muted, fontWeight: unread > 0 ? FontWeight.w600 : FontWeight.normal),
      ),
      trailing: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.end, children: [
        Text(timeAgo(convo['lastMessageTime']?.toString()), style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
        if (unread > 0) ...[
          const SizedBox(height: 6),
          Container(
            padding: const EdgeInsets.all(5),
            decoration: BoxDecoration(color: theme.colorScheme.primary, shape: BoxShape.circle),
            constraints: const BoxConstraints(minWidth: 18, minHeight: 18),
            child: Text('$unread', textAlign: TextAlign.center, style: theme.textTheme.labelSmall?.copyWith(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold, height: 1.2)),
          ),
        ],
      ]),
      onTap: () => context.push('/chat', extra: {
        'jobId': convo['jobId'],
        'otherUserId': convo['otherUserId'],
        'otherUserName': name,
        'otherUserAvatar': pic,
      }),
    );
  }
}
