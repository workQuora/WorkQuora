import 'package:flutter/material.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../theme/app_theme.dart';

/// Read-only Terms & Conditions — GET /terms/current, no interaction beyond
/// scrolling (acceptance already happens at registration; see authRoutes).
class TermsScreen extends StatefulWidget {
  const TermsScreen({super.key});
  @override
  State<TermsScreen> createState() => _TermsScreenState();
}

class _TermsScreenState extends State<TermsScreen> {
  Map<String, dynamic>? _terms;
  bool _loading = true;
  bool _error = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = false;
    });
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.currentTerms);
      _terms = Map<String, dynamic>.from(res.data['terms']);
    } catch (_) {
      _error = true;
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final sections = (_terms?['content'] as List?) ?? [];

    return Scaffold(
      appBar: AppBar(title: const Text('Terms & Conditions')),
      body: _loading
          ? Center(child: CircularProgressIndicator(color: theme.colorScheme.primary))
          : _error
              ? Center(
                  child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(Icons.error_outline_rounded, color: tokens.muted, size: 48),
                    const SizedBox(height: AppSpace.md),
                    Text('Failed to load terms', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
                    const SizedBox(height: AppSpace.md),
                    TextButton(onPressed: _load, child: Text('Retry', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold))),
                  ]),
                )
              : ListView(
                  padding: const EdgeInsets.all(AppSpace.xl),
                  children: [
                    Text(_terms?['name']?.toString() ?? 'Terms & Conditions', style: theme.textTheme.headlineMedium),
                    const SizedBox(height: 4),
                    Text(
                      'Version ${_terms?['version'] ?? '—'}${_terms?['effectiveDate'] != null ? ' · Effective ${_terms!['effectiveDate']}' : ''}',
                      style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted),
                    ),
                    const SizedBox(height: AppSpace.xl),
                    for (final section in sections) ...[
                      Text(section['title']?.toString() ?? '', style: theme.textTheme.titleMedium),
                      const SizedBox(height: AppSpace.xs),
                      Text(section['text']?.toString() ?? '', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted, height: 1.5)),
                      const SizedBox(height: AppSpace.lg),
                    ],
                  ],
                ),
    );
  }
}
