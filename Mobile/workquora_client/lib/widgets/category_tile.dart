import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Image-forward category tile: photo on top, label below.
///
/// [imageUrl] (from the backend's /categories catalog) is tried first when
/// non-empty; on a network failure it falls back to the local [imagePath]
/// asset, and if that ALSO doesn't resolve, an icon-on-tint tile — no
/// placeholder photos are faked at any layer. Callers that only have a
/// local asset (Dashboard's popular-services rail, still using the
/// hardcoded category list) simply omit [imageUrl] and get the original
/// local-only behavior unchanged.
class CategoryTile extends StatelessWidget {
  final String label;
  final String imagePath;
  final IconData fallbackIcon;
  final VoidCallback onTap;
  final String? imageUrl;

  const CategoryTile({
    super.key,
    required this.label,
    required this.imagePath,
    required this.fallbackIcon,
    required this.onTap,
    this.imageUrl,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    Widget localAsset() => Image.asset(
          imagePath,
          fit: BoxFit.cover,
          errorBuilder: (_, __, ___) => Container(
            color: tokens.brandSoft,
            child: Icon(fallbackIcon, color: theme.colorScheme.primary, size: 32),
          ),
        );

    return ClipRRect(
      borderRadius: BorderRadius.circular(AppRadius.card),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Container(
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: tokens.border, width: 0.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                AspectRatio(
                  aspectRatio: 1.4,
                  child: (imageUrl != null && imageUrl!.isNotEmpty)
                      ? CachedNetworkImage(
                          imageUrl: imageUrl!,
                          fit: BoxFit.cover,
                          memCacheWidth: 320,
                          placeholder: (_, __) => Container(color: tokens.brandSoft),
                          errorWidget: (_, __, ___) => localAsset(),
                        )
                      : localAsset(),
                ),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.sm, vertical: AppSpace.sm),
                  child: Text(
                    label,
                    textAlign: TextAlign.center,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textTheme.bodySmall,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
