import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_theme.dart';

/// Shared skeleton placeholder for list screens that fetch on open —
/// previously duplicated ad hoc in conversations/notifications/wallet
/// screens; consolidated here so every "fetching a list" screen looks and
/// behaves the same instead of a blank frame or a lone spinner.
class ShimmerList extends StatelessWidget {
  final int count;
  final double itemHeight;
  final EdgeInsetsGeometry padding;
  // Set true when embedding inside another scrollable (e.g. Home's own
  // page-level ListView) instead of using this as a screen's whole body.
  final bool shrinkWrap;

  const ShimmerList({
    super.key,
    this.count = 6,
    this.itemHeight = 64,
    this.padding = const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: AppSpace.md),
    this.shrinkWrap = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return ListView.builder(
      shrinkWrap: shrinkWrap,
      physics: shrinkWrap ? const NeverScrollableScrollPhysics() : const AlwaysScrollableScrollPhysics(),
      padding: padding,
      itemCount: count,
      itemBuilder: (_, __) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpace.sm),
        child: Shimmer.fromColors(
          baseColor: tokens.border,
          highlightColor: theme.colorScheme.surface,
          child: Container(
            height: itemHeight,
            decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(AppRadius.card)),
          ),
        ),
      ),
    );
  }
}
