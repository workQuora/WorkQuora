import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import '../core/constants/app_colors.dart';

class WorkerCard extends StatelessWidget {
  final Map<String, dynamic> worker;
  const WorkerCard({super.key, required this.worker});

  @override
  Widget build(BuildContext context) {
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
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.border)),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            // Avatar
            Container(
              width: 60, height: 60,
              decoration: BoxDecoration(borderRadius: BorderRadius.circular(14), color: AppColors.surfaceAlt),
              child: ClipRRect(borderRadius: BorderRadius.circular(14),
                child: pic.isNotEmpty ? CachedNetworkImage(imageUrl: pic, fit: BoxFit.cover, errorWidget: (_, __, ___) => _avatar(name))
                    : _avatar(name),
              ),
            ),
            const SizedBox(width: 14),
            // Info
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Expanded(child: Text(name, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15, color: AppColors.text), overflow: TextOverflow.ellipsis)),
                if (kyc) Container(padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(color: AppColors.emerald.withOpacity(0.15), borderRadius: BorderRadius.circular(6)),
                  child: const Text('✓ KYC', style: TextStyle(color: AppColors.emerald, fontSize: 9, fontWeight: FontWeight.bold))),
              ]),
              const SizedBox(height: 2),
              Text(title, style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
              const SizedBox(height: 6),
              Row(children: [
                const Icon(Icons.star_rounded, color: AppColors.amber, size: 14),
                const SizedBox(width: 3),
                Text(rating.toStringAsFixed(1), style: const TextStyle(color: AppColors.text, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(width: 10),
                Text('₹$rate/hr', style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.bold)),
                const Spacer(),
                Container(width: 7, height: 7, decoration: BoxDecoration(color: available ? AppColors.success : AppColors.textMuted, shape: BoxShape.circle)),
                const SizedBox(width: 4),
                Text(available ? 'Available' : 'Busy', style: TextStyle(color: available ? AppColors.success : AppColors.textMuted, fontSize: 10)),
              ]),
            ])),
            const SizedBox(width: 8),
            const Icon(Icons.arrow_forward_ios, color: AppColors.textMuted, size: 14),
          ]),
        ),
      ),
    );
  }

  Widget _avatar(String name) => Container(
    alignment: Alignment.center,
    decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.primary, Color(0xFF8B5CF6)])),
    child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'W', style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
  );
}
