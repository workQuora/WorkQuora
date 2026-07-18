import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Image-forward category tile: photo on top, label below. Falls back to an
/// icon-on-tint tile when [imagePath] doesn't resolve to a real asset yet —
/// no placeholder photos are faked; drop real service photos into
/// assets/images/categories/ and the image takes over automatically.
class CategoryTile extends StatelessWidget {
  final String label;
  final String imagePath;
  final IconData fallbackIcon;
  final VoidCallback onTap;

  const CategoryTile({
    super.key,
    required this.label,
    required this.imagePath,
    required this.fallbackIcon,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

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
                  child: Image.asset(
                    imagePath,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Container(
                      color: tokens.brandSoft,
                      child: Icon(fallbackIcon, color: theme.colorScheme.primary, size: 32),
                    ),
                  ),
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
