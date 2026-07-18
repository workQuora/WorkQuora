import 'package:flutter/material.dart';
import '../theme/app_theme.dart';

/// Pill-shaped status chip. Pass a semantic [color] (e.g. from
/// Theme.of(context).extension<AppTokens>()!.success/danger/warning, or
/// colorScheme.primary) — the tint is derived from it via the same
/// alpha-blend recipe AppTokens uses for its own chipBg/chipText, so it's
/// correct in both themes automatically.
class StatusChip extends StatelessWidget {
  final String label;
  final Color color;

  const StatusChip({super.key, required this.label, required this.color});

  /// Common job-status → semantic color mapping shared across job cards.
  factory StatusChip.forJobStatus(BuildContext context, String status) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final normalized = status.toLowerCase();
    final color = switch (normalized) {
      'open' => theme.colorScheme.primary,
      'in-progress' || 'in_progress' => tokens.warning,
      'completed' => tokens.success,
      'cancelled' => tokens.danger,
      _ => tokens.muted,
    };
    final label = normalized.isEmpty
        ? 'Unknown'
        : normalized[0].toUpperCase() + normalized.substring(1).replaceAll('-', ' ').replaceAll('_', ' ');
    return StatusChip(label: label, color: color);
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bg = Color.alphaBlend(color.withAlpha(isDark ? 46 : 26), Theme.of(context).colorScheme.surface);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpace.md, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.chip),
      ),
      child: Text(
        label,
        style: Theme.of(context).textTheme.labelSmall?.copyWith(color: color, fontWeight: FontWeight.w600),
      ),
    );
  }
}
