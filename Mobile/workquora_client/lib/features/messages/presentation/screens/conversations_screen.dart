import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../application/conversations_controller.dart';
import '../../data/models/conversation_model.dart';

class ConversationsScreen extends ConsumerStatefulWidget {
  const ConversationsScreen({super.key});

  @override
  ConsumerState<ConversationsScreen> createState() => _ConversationsScreenState();
}

class _ConversationsScreenState extends ConsumerState<ConversationsScreen> {
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  List<ConversationModel> _filterConversations(List<ConversationModel> list) {
    if (_searchQuery.isEmpty) return list;
    return list.where((c) {
      return c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c.jobTitle.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          c.lastMessage.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
  }

  @override
  Widget build(BuildContext context) {
    final conversationsAsync = ref.watch(conversationsProvider);
    final textTheme = AppTypography.light;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Messages',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.onSurface,
        actions: [
          IconButton(
            icon: const Icon(Icons.more_horiz_rounded),
            onPressed: () {},
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        elevation: 4,
        onPressed: () => context.go('/discover'),
        icon: const Icon(Icons.chat_bubble_outline_rounded, color: AppColors.onPrimary, size: 20),
        label: Text(
          'New Chat',
          style: AppTypography.textTheme(AppColors.onPrimary).labelMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () => ref.refresh(conversationsProvider.future),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 1. Search Bar
              Padding(
                padding: const EdgeInsets.all(AppSpacing.containerMargin),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: AppRadius.fullR,
                    border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                      });
                    },
                    style: textTheme.bodyMedium,
                    decoration: InputDecoration(
                      hintText: 'Search chats, jobs, freelancers...',
                      hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                      prefixIcon: const Icon(Icons.search_rounded, color: AppColors.outline, size: 20),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 12),
                    ),
                  ),
                ),
              ),

              // 2. Active Now Horizontal Avatars
              conversationsAsync.when(
                data: (conversations) {
                  if (conversations.isEmpty) return const SizedBox.shrink();
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                        child: Text(
                          'Active Now',
                          style: textTheme.labelSmall?.copyWith(
                            color: AppColors.outline,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 76,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                          itemCount: conversations.length + 1,
                          itemBuilder: (context, index) {
                            if (index == 0) {
                              // Broadcast action pill
                              return Padding(
                                padding: const EdgeInsets.only(right: 12),
                                child: Column(
                                  children: [
                                    Container(
                                      width: 48,
                                      height: 48,
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withOpacity(0.08),
                                        shape: BoxShape.circle,
                                      ),
                                      child: const Icon(Icons.campaign_rounded, color: AppColors.primary, size: 22),
                                    ),
                                    const SizedBox(height: 6),
                                    Text(
                                      'Broadcast',
                                      style: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w700),
                                    ),
                                  ],
                                ),
                              );
                            }
                            final conv = conversations[index - 1];
                            return Padding(
                              padding: const EdgeInsets.only(right: 12),
                              child: Column(
                                children: [
                                  Stack(
                                    children: [
                                      ClipOval(
                                        child: CachedNetworkImage(
                                          imageUrl: conv.profilePic ?? 'https://api.dicebear.com/7.x/initials/svg?seed=${conv.name}',
                                          width: 48,
                                          height: 48,
                                          fit: BoxFit.cover,
                                        ),
                                      ),
                                      // Online indicator dot
                                      Positioned(
                                        right: 0,
                                        bottom: 0,
                                        child: Container(
                                          width: 12,
                                          height: 12,
                                          decoration: BoxDecoration(
                                            color: AppColors.secondary,
                                            shape: BoxShape.circle,
                                            border: Border.all(color: Colors.white, width: 2),
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  SizedBox(
                                    width: 52,
                                    child: Text(
                                      conv.name.split(' ').first,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      textAlign: TextAlign.center,
                                      style: textTheme.labelSmall?.copyWith(fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ],
                              ),
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 8),
                      const Divider(height: 1),
                    ],
                  );
                },
                loading: () => const SizedBox.shrink(),
                error: (_, __) => const SizedBox.shrink(),
              ),

              // 3. Conversations List
              Expanded(
                child: conversationsAsync.when(
                  loading: () => _buildShimmerLoading(),
                  error: (error, _) => _ErrorState(
                    message: error.toString(),
                    onRetry: () => ref.invalidate(conversationsProvider),
                  ),
                  data: (conversations) {
                    final filtered = _filterConversations(conversations);
                    if (filtered.isEmpty) {
                      return const _EmptyState();
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.all(AppSpacing.containerMargin),
                      itemCount: filtered.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final conv = filtered[index];
                        final hasUnread = conv.unreadCount > 0;

                        return Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: AppRadius.xlR,
                            border: Border.all(
                              color: hasUnread ? AppColors.primary.withOpacity(0.15) : AppColors.outlineVariant.withOpacity(0.15),
                              width: hasUnread ? 1.5 : 1.0,
                            ),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                            leading: Stack(
                              children: [
                                ClipOval(
                                  child: CachedNetworkImage(
                                    imageUrl: conv.profilePic ?? 'https://api.dicebear.com/7.x/initials/svg?seed=${conv.name}',
                                    width: 48,
                                    height: 48,
                                    fit: BoxFit.cover,
                                  ),
                                ),
                                // Online indicator
                                Positioned(
                                  right: 0,
                                  bottom: 0,
                                  child: Container(
                                    width: 12,
                                    height: 12,
                                    decoration: BoxDecoration(
                                      color: AppColors.secondary,
                                      shape: BoxShape.circle,
                                      border: Border.all(color: Colors.white, width: 2),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            title: Row(
                              children: [
                                Expanded(
                                  child: Text(
                                    conv.name,
                                    style: textTheme.bodyLarge?.copyWith(
                                      fontWeight: hasUnread ? FontWeight.w800 : FontWeight.w700,
                                      color: AppColors.onSurface,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  conv.lastMessageTime,
                                  style: textTheme.labelSmall?.copyWith(
                                    color: hasUnread ? AppColors.primary : AppColors.outline,
                                    fontWeight: hasUnread ? FontWeight.w800 : FontWeight.w500,
                                  ),
                                ),
                              ],
                            ),
                            subtitle: Padding(
                              padding: const EdgeInsets.only(top: 4.0),
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        if (conv.jobTitle.isNotEmpty)
                                          Padding(
                                            padding: const EdgeInsets.only(bottom: 2.0),
                                            child: Text(
                                              'Gig: ${conv.jobTitle}',
                                              style: textTheme.labelSmall?.copyWith(
                                                color: AppColors.primary,
                                                fontWeight: FontWeight.w700,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        Text(
                                          conv.lastMessage,
                                          style: textTheme.bodyMedium?.copyWith(
                                            color: hasUnread ? AppColors.onSurface : AppColors.onSurfaceVariant,
                                            fontWeight: hasUnread ? FontWeight.w600 : FontWeight.w400,
                                          ),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ),
                                  ),
                                  if (hasUnread) ...[
                                    const SizedBox(width: 8),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                      decoration: const BoxDecoration(
                                        color: AppColors.primary,
                                        shape: BoxShape.circle,
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        conv.unreadCount.toString(),
                                        style: AppTypography.textTheme(Colors.white).labelSmall?.copyWith(
                                              fontWeight: FontWeight.w800,
                                            ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            onTap: () => context.push(
                              '/messages/${conv.jobId}/${conv.otherUserId}',
                              extra: {
                                'name': conv.name,
                                'profilePic': conv.profilePic,
                                'jobTitle': conv.jobTitle,
                              },
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildShimmerLoading() {
    return Shimmer.fromColors(
      baseColor: AppColors.surfaceContainer,
      highlightColor: AppColors.surfaceContainerLow,
      child: ListView.separated(
        padding: const EdgeInsets.all(AppSpacing.containerMargin),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, __) => Container(
          height: 72,
          decoration: BoxDecoration(color: Colors.white, borderRadius: AppRadius.xlR),
        ),
      ),
    );
  }
}

class _EmptyState extends StatelessWidget {
  const _EmptyState();
  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.chat_bubble_outline_rounded, size: 48, color: AppColors.outline),
                  const SizedBox(height: AppSpacing.stackMd),
                  Text(
                    'No messages yet',
                    style: AppTypography.light.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Message a freelancer from search to kick off your project conversation.',
                    textAlign: TextAlign.center,
                    style: AppTypography.light.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _ErrorState extends StatelessWidget {
  const _ErrorState({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) => SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: ConstrainedBox(
          constraints: BoxConstraints(minHeight: constraints.maxHeight),
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(32),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.wifi_off_rounded, size: 40, color: AppColors.outline),
                  const SizedBox(height: AppSpacing.stackMd),
                  Text(message, textAlign: TextAlign.center, style: AppTypography.light.bodyLarge),
                  const SizedBox(height: AppSpacing.stackMd),
                  OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
