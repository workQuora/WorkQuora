import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/app_theme.dart';

/// Shared skeleton placeholder for list screens that fetch on open —
/// previously duplicated ad hoc in conversations/notifications/wallet
/// screens; consolidated here so every "fetching a list" screen looks and
/// behaves the same instead of a blank frame or a lone spinner.
///
/// [crossAxisCount] > 1 switches from a single-column list to a grid (e.g.
/// Home's category grid while it loads) — same shimmer styling either way,
/// just a different layout. Defaults to 1 so every existing caller is
/// unaffected.
class ShimmerList extends StatelessWidget {
  final int count;
  final double itemHeight;
  final EdgeInsetsGeometry padding;
  // Set true when embedding inside another scrollable (e.g. Home's own
  // page-level ListView) instead of using this as a screen's whole body.
  final bool shrinkWrap;
  final int crossAxisCount;
  final double childAspectRatio;

  const ShimmerList({
    super.key,
    this.count = 6,
    this.itemHeight = 64,
    this.padding = const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: AppSpace.md),
    this.shrinkWrap = false,
    this.crossAxisCount = 1,
    this.childAspectRatio = 1.5,
  });

  Widget _tile(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return Shimmer.fromColors(
      baseColor: tokens.border,
      highlightColor: theme.colorScheme.surface,
      child: Container(
        decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(AppRadius.card)),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (crossAxisCount > 1) {
      return GridView.builder(
        shrinkWrap: shrinkWrap,
        physics: shrinkWrap ? const NeverScrollableScrollPhysics() : const AlwaysScrollableScrollPhysics(),
        padding: padding,
        itemCount: count,
        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: crossAxisCount,
          mainAxisSpacing: AppSpace.md,
          crossAxisSpacing: AppSpace.md,
          childAspectRatio: childAspectRatio,
        ),
        itemBuilder: (context, __) => _tile(context),
      );
    }
    return ListView.builder(
      shrinkWrap: shrinkWrap,
      physics: shrinkWrap ? const NeverScrollableScrollPhysics() : const AlwaysScrollableScrollPhysics(),
      padding: padding,
      itemCount: count,
      itemBuilder: (context, __) => Padding(
        padding: const EdgeInsets.only(bottom: AppSpace.sm),
        child: SizedBox(height: itemHeight, child: _tile(context)),
      ),
    );
  }
}
