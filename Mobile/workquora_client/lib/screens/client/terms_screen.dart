import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';

const kTermsAcceptedPrefsKey = 'terms_accepted';

/// GET /terms/current, reused in two modes:
/// - Read-only (default, reached from Profile) — just scrolling, no
///   interaction; legal consent already happened at registration
///   (registerUser's agreedToTerms/agreedToPrivacy).
/// - Acceptance ([acceptanceMode]) — shown once after a fresh registration's
///   post-success animation. "I agree" checkbox gates a Continue button;
///   accepting sets [kTermsAcceptedPrefsKey] so it never shows again on this
///   device (checked in otp_screen.dart before routing here).
class TermsScreen extends StatefulWidget {
  final bool acceptanceMode;
  const TermsScreen({super.key, this.acceptanceMode = false});
  @override
  State<TermsScreen> createState() => _TermsScreenState();
}

class _TermsScreenState extends State<TermsScreen> {
  Map<String, dynamic>? _terms;
  bool _loading = true;
  bool _error = false;
  bool _agreed = false;
  bool _continuing = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _continue() async {
    setState(() => _continuing = true);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(kTermsAcceptedPrefsKey, true);
    if (!mounted) return;
    context.go('/home');
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
      appBar: AppBar(
        title: const Text('Terms & Conditions'),
        automaticallyImplyLeading: !widget.acceptanceMode,
      ),
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
              : Column(children: [
                  Expanded(
                    child: ListView(
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
                  ),
                  if (widget.acceptanceMode)
                    SafeArea(
                      top: false,
                      child: Container(
                        padding: const EdgeInsets.all(AppSpace.lg),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.surface,
                          border: Border(top: BorderSide(color: tokens.border, width: 0.5)),
                        ),
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          CheckboxListTile(
                            value: _agreed,
                            onChanged: (v) => setState(() => _agreed = v ?? false),
                            controlAffinity: ListTileControlAffinity.leading,
                            contentPadding: EdgeInsets.zero,
                            title: Text('I agree to the Terms & Conditions', style: theme.textTheme.bodyMedium),
                          ),
                          const SizedBox(height: AppSpace.sm),
                          PrimaryButton(
                            label: 'Continue',
                            loading: _continuing,
                            onPressed: _agreed ? _continue : null,
                          ),
                        ]),
                      ),
                    ),
                ]),
    );
  }
}
