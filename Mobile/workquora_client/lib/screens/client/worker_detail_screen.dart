import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../widgets/app_button.dart';

class WorkerDetailScreen extends StatefulWidget {
  final String workerId;
  const WorkerDetailScreen({super.key, required this.workerId});
  @override State<WorkerDetailScreen> createState() => _WorkerDetailScreenState();
}

class _WorkerDetailScreenState extends State<WorkerDetailScreen> {
  Map<String, dynamic>? _worker;
  bool _loading = true;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final res = await DioClient.instance.dio.get('${ApiConstants.workerProfile}/${widget.workerId}');
      _worker = res.data['data'] ?? res.data;
    } catch (_) {}
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(backgroundColor: AppColors.bg, body: Center(child: CircularProgressIndicator(color: AppColors.primary)));
    if (_worker == null) return const Scaffold(backgroundColor: AppColors.bg, body: Center(child: Text('Worker not found', style: TextStyle(color: AppColors.textMuted))));

    final name    = _worker!['name'] ?? 'Worker';
    final title   = _worker!['title'] ?? 'Freelancer';
    final bio     = _worker!['bio'] ?? 'No bio provided.';
    final rating  = (_worker!['averageRating'] ?? 0).toDouble();
    final rate    = _worker!['hourlyRate'] ?? 0;
    final skills  = List<String>.from(_worker!['skills'] ?? []);
    final kyc     = _worker!['isKycVerified'] == true;
    final avail   = _worker!['isAvailable'] == true;
    final pic     = _worker!['profilePic'] ?? _worker!['avatar'] ?? '';

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          backgroundColor: AppColors.bg, expandedHeight: 280, pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(children: [
              Container(decoration: const BoxDecoration(gradient: LinearGradient(colors: [AppColors.primary, Color(0xFF7C3AED)], begin: Alignment.topLeft, end: Alignment.bottomRight))),
              Positioned(bottom: 0, left: 0, right: 0, child: Container(height: 40, decoration: const BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.vertical(top: Radius.circular(28))))),
              Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const SizedBox(height: 30),
                Container(width: 90, height: 90, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3)),
                  child: ClipOval(child: pic.isNotEmpty ? CachedNetworkImage(imageUrl: pic, fit: BoxFit.cover) : Container(color: AppColors.primaryDark, child: Center(child: Text(name[0].toUpperCase(), style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)))))),
                const SizedBox(height: 10),
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                Text(title, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 6),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  const Icon(Icons.star_rounded, color: AppColors.amber, size: 16),
                  Text(' ${rating.toStringAsFixed(1)}', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 12),
                  Text('₹$rate/hr', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  if (kyc) ...[const SizedBox(width: 12), Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: AppColors.emerald.withOpacity(0.2), borderRadius: BorderRadius.circular(8)), child: const Text('✓ KYC', style: TextStyle(color: AppColors.emerald, fontSize: 10, fontWeight: FontWeight.bold)))],
                ]),
              ])),
            ]),
          ),
        ),
        SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: avail ? AppColors.success : AppColors.textMuted, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(avail ? 'Available now' : 'Currently busy', style: TextStyle(color: avail ? AppColors.success : AppColors.textMuted, fontSize: 13)),
          ]),
          const SizedBox(height: 20),
          const Text('About', style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(bio, style: const TextStyle(color: AppColors.textMuted, fontSize: 14, height: 1.6)),
          const SizedBox(height: 20),
          if (skills.isNotEmpty) ...[
            const Text('Skills', style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: skills.map((s) => Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.primary.withOpacity(0.3))),
              child: Text(s, style: const TextStyle(color: AppColors.primary, fontSize: 12, fontWeight: FontWeight.w600)))).toList()),
            const SizedBox(height: 24),
          ],
          AppButton(label: 'Post a Job for ${name.split(' ').first} →', onPressed: () => context.push('/post-job')),
          const SizedBox(height: 12),
          AppButton(label: '💬 Send Message', onPressed: () => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Chat coming soon!'))), outlined: true),
          const SizedBox(height: 30),
        ]))),
      ]),
    );
  }
}
