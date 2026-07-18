import 'package:flutter/material.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../theme/app_theme.dart';
import '../../widgets/worker_card.dart';

/// Client-only service search — public GET /jobs/search (no auth) returns
/// both jobs and freelancers matching the keyword; freelancers are what a
/// client is looking for from Home (hire someone), so that's what's shown.
Future<void> showSearchResults(BuildContext context, String keyword) {
  final theme = Theme.of(context);
  return showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    backgroundColor: theme.colorScheme.surface,
    shape: RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
    builder: (_) => _SearchResultsSheet(keyword: keyword),
  );
}

class _SearchResultsSheet extends StatefulWidget {
  final String keyword;
  const _SearchResultsSheet({required this.keyword});

  @override
  State<_SearchResultsSheet> createState() => _SearchResultsSheetState();
}

class _SearchResultsSheetState extends State<_SearchResultsSheet> {
  bool _loading = true;
  bool _error = false;
  List<dynamic> _freelancers = [];

  @override
  void initState() {
    super.initState();
    _search();
  }

  Future<void> _search() async {
    setState(() { _loading = true; _error = false; });
    try {
      final res = await DioClient.instance.dio.get(
        ApiConstants.jobsSearch,
        queryParameters: {'keyword': widget.keyword},
      );
      _freelancers = res.data['freelancers'] ?? [];
    } catch (_) {
      _error = true;
    }
    if (mounted) setState(() => _loading = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.md, AppSpace.lg, AppSpace.lg),
        child: ConstrainedBox(
          constraints: BoxConstraints(maxHeight: MediaQuery.of(context).size.height * 0.75),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(
                  width: 40, height: 4,
                  margin: const EdgeInsets.only(bottom: AppSpace.lg),
                  decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(2)),
                ),
              ),
              Text('Results for "${widget.keyword}"', style: theme.textTheme.titleMedium),
              const SizedBox(height: AppSpace.lg),
              Flexible(
                child: _loading
                    ? Padding(
                        padding: const EdgeInsets.all(AppSpace.xl),
                        child: Center(child: CircularProgressIndicator(color: theme.colorScheme.primary)),
                      )
                    : _error
                        ? _emptyState(theme, tokens, Icons.error_outline, 'Something went wrong. Try again.')
                        : _freelancers.isEmpty
                            ? _emptyState(theme, tokens, Icons.search_off_rounded, 'No matches for "${widget.keyword}"')
                            : ListView.builder(
                                shrinkWrap: true,
                                itemCount: _freelancers.length,
                                itemBuilder: (_, i) => WorkerCard(worker: Map<String, dynamic>.from(_freelancers[i])),
                              ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _emptyState(ThemeData theme, AppTokens tokens, IconData icon, String message) => Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpace.xl),
        child: Column(
          children: [
            Icon(icon, color: tokens.muted, size: 40),
            const SizedBox(height: AppSpace.md),
            Text(message, style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted), textAlign: TextAlign.center),
          ],
        ),
      );
}
