import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/network/dio_client.dart';
import '../../core/constants/api_constants.dart';
import '../../core/utils/error_helper.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';

class WorkerDetailScreen extends StatefulWidget {
  final String workerId;
  const WorkerDetailScreen({super.key, required this.workerId});
  @override State<WorkerDetailScreen> createState() => _WorkerDetailScreenState();
}

class _WorkerDetailScreenState extends State<WorkerDetailScreen> {
  Map<String, dynamic>? _worker;
  bool _loading = true;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final res = await DioClient.instance.dio.get('${ApiConstants.workerProfile}/${widget.workerId}');
      _worker = res.data['data'] ?? res.data;
    } catch (e) {
      // Was a bare catch(_){} — any failure (network error, 500, timeout)
      // rendered identically to a genuine 404 as "Worker not found", which
      // is misleading and gave no way to retry a transient failure.
      _error = ErrorHelper.extractError(e);
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    if (_loading) return Scaffold(body: Center(child: CircularProgressIndicator(color: theme.colorScheme.primary)));
    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(AppSpace.xl),
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Icon(Icons.error_outline_rounded, color: tokens.muted, size: 48),
              const SizedBox(height: AppSpace.md),
              Text(_error!, textAlign: TextAlign.center, style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
              const SizedBox(height: AppSpace.md),
              TextButton(onPressed: _load, child: Text('Retry', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold))),
            ]),
          ),
        ),
      );
    }
    if (_worker == null) return Scaffold(body: Center(child: Text('Worker not found', style: TextStyle(color: tokens.muted))));

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
      body: CustomScrollView(slivers: [
        SliverAppBar(
          expandedHeight: 280, pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: Stack(children: [
              Container(decoration: BoxDecoration(gradient: LinearGradient(colors: [theme.colorScheme.primary, const Color(0xFF7C3AED)], begin: Alignment.topLeft, end: Alignment.bottomRight))),
              Positioned(bottom: 0, left: 0, right: 0, child: Container(height: 40, decoration: BoxDecoration(color: theme.scaffoldBackgroundColor, borderRadius: const BorderRadius.vertical(top: Radius.circular(28))))),
              Center(child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const SizedBox(height: 30),
                Container(width: 90, height: 90, decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 3)),
                  child: ClipOval(child: pic.isNotEmpty
                    ? CachedNetworkImage(
                        imageUrl: pic,
                        fit: BoxFit.cover,
                        memCacheWidth: 270,
                        memCacheHeight: 270,
                        placeholder: (context, url) => Container(
                          color: tokens.brandSoft,
                          child: Center(child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.primary)),
                        ),
                        errorWidget: (context, url, error) => Container(
                          color: theme.colorScheme.primary,
                          child: Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold))),
                        ),
                      )
                    : Container(color: theme.colorScheme.primary, child: Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)))))),
                const SizedBox(height: 10),
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
                Text(title, style: const TextStyle(color: Colors.white70, fontSize: 13)),
                const SizedBox(height: 6),
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(Icons.star_rounded, color: tokens.warning, size: 16),
                  Text(' ${rating.toStringAsFixed(1)}', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  const SizedBox(width: 12),
                  Text('₹$rate/hr', style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.bold)),
                  if (kyc) ...[const SizedBox(width: 12), Container(padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2), decoration: BoxDecoration(color: tokens.success.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(8)), child: Text('✓ KYC', style: TextStyle(color: tokens.success, fontSize: 10, fontWeight: FontWeight.bold)))],
                ]),
              ])),
            ]),
          ),
        ),
        SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            Container(width: 8, height: 8, decoration: BoxDecoration(color: avail ? tokens.success : tokens.muted, shape: BoxShape.circle)),
            const SizedBox(width: 6),
            Text(avail ? 'Available now' : 'Currently busy', style: TextStyle(color: avail ? tokens.success : tokens.muted, fontSize: 13)),
          ]),
          const SizedBox(height: 20),
          Text('About', style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(bio, style: TextStyle(color: tokens.muted, fontSize: 14, height: 1.6)),
          const SizedBox(height: 20),
          if (skills.isNotEmpty) ...[
            Text('Skills', style: TextStyle(color: theme.colorScheme.onSurface, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            Wrap(spacing: 8, runSpacing: 8, children: skills.map((s) => Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(color: theme.colorScheme.primary.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20), border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.3))),
              child: Text(s, style: TextStyle(color: theme.colorScheme.primary, fontSize: 12, fontWeight: FontWeight.w600)))).toList()),
            const SizedBox(height: 24),
          ],
          PrimaryButton(label: 'Post a Job for ${name.split(' ').first} →', onPressed: () => context.push('/post-job')),
          const SizedBox(height: 12),
          PrimaryButton(
            label: '💬 Send Message',
            outlined: true,
            onPressed: () => showDialog(
              context: context,
              builder: (_) => AlertDialog(
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                title: const Text('Post a Job First'),
                content: Text(
                  'Messaging opens once you post a job — that\'s the conversation ${name.split(' ').first} will reply in.',
                ),
                actions: [
                  TextButton(onPressed: () => Navigator.of(context).pop(), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
                  TextButton(
                    onPressed: () { Navigator.of(context).pop(); context.push('/post-job'); },
                    child: Text('Post a Job', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 30),
        ]))),
      ]),
    );
  }
}
