import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../theme/app_theme.dart';

class WorkerCard extends StatelessWidget {
  final Map<String, dynamic> worker;
  const WorkerCard({super.key, required this.worker});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final name      = worker['name'] ?? 'Worker';
    final title     = worker['title'] ?? worker['role'] ?? 'Freelancer';
    final rating    = (worker['averageRating'] ?? 0).toDouble();
    final pic       = worker['profilePic'] ?? worker['avatar'] ?? '';
    final rate      = worker['hourlyRate'] ?? 0;
    final kyc       = worker['isKycVerified'] == true;
    final available = worker['isAvailable'] == true;
    final id        = worker['_id'] ?? worker['id'] ?? '';

    return GestureDetector(
      onTap: () => context.push('/worker/$id'),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: tokens.border)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            // Avatar
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), color: tokens.brandSoft),
              child: ClipRRect(borderRadius: BorderRadius.circular(14),
                child: pic.isNotEmpty ? CachedNetworkImage(imageUrl: pic, fit: BoxFit.cover, errorWidget: (_, __, ___) => _avatar(theme, name))
                    : _avatar(theme, name),
              ),
            ),
            const SizedBox(width: 14),
            // Info
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(name, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: theme.colorScheme.onSurface), overflow: TextOverflow.ellipsis)),
                if (kyc) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: tokens.success.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                  child: Text('✓ KYC', style: TextStyle(color: tokens.success, fontSize: 9, fontWeight: FontWeight.bold))),
              ]),
              const SizedBox(height: 2),
              Text(title, style: TextStyle(color: tokens.muted, fontSize: 12)),
              const SizedBox(height: 6),
              Row(children: [
                Icon(Icons.star_rounded, color: tokens.warning, size: 14),
                const SizedBox(width: 3),
                Text(rating.toStringAsFixed(1), style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(width: 10),
                Text('₹$rate/hr', style: TextStyle(color: theme.colorScheme.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                const Spacer(),
                Container(width: 7, height: 7, decoration: BoxDecoration(color: available ? tokens.success : tokens.muted, shape: BoxShape.circle)),
                const SizedBox(width: 4),
                Text(available ? 'Available' : 'Busy', style: TextStyle(color: available ? tokens.success : tokens.muted, fontSize: 10)),
              ]),
            ])),
            const SizedBox(width: 8),
            Icon(Icons.arrow_forward_ios, color: tokens.muted, size: 14),
          ]),
        ),
      ),
    );
  }

  Widget _avatar(ThemeData theme, String name) => Container(
    alignment: Alignment.center,
    decoration: BoxDecoration(gradient: LinearGradient(colors: [theme.colorScheme.primary, const Color(0xFF8B5CF6)])),
    child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'W', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
  );
}
