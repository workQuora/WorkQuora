import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../data/talent_profile_providers.dart';

class ReviewModal extends ConsumerStatefulWidget {
  const ReviewModal({
    super.key,
    required this.jobId,
    required this.revieweeId,
    required this.revieweeName,
  });

  final String jobId;
  final String revieweeId;
  final String revieweeName;

  static Future<void> show(
    BuildContext context, {
    required String jobId,
    required String revieweeId,
    required String revieweeName,
  }) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ReviewModal(
          jobId: jobId,
          revieweeId: revieweeId,
          revieweeName: revieweeName,
        ),
      ),
    );
  }

  @override
  ConsumerState<ReviewModal> createState() => _ReviewModalState();
}

class _ReviewModalState extends ConsumerState<ReviewModal> {
  int _rating = 5;
  final _commentController = TextEditingController();
  bool _isSubmitting = false;
  String? _error;

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final comment = _commentController.text.trim();
    final words = comment.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();

    if (words.length < 5) {
      setState(() => _error = 'Please write at least 5 words for feedback.');
      return;
    }

    setState(() {
      _isSubmitting = true;
      _error = null;
    });

    final repo = ref.read(talentProfileRepositoryProvider);
    final result = await repo.submitReview(
      jobId: widget.jobId,
      revieweeId: widget.revieweeId,
      rating: _rating,
      comment: comment,
    );

    if (!mounted) return;
    setState(() => _isSubmitting = false);

    result.match(
      (failure) => setState(() => _error = failure.message),
      (_) {
        // Invalidate profile bundle to refresh the public review rating
        ref.invalidate(talentProfileProvider(widget.revieweeId));
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Review submitted successfully!'), backgroundColor: AppColors.secondary),
        );
        Navigator.of(context).pop();
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final textTheme = AppTypography.light;

    return Container(
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Drag handle
          Center(
            child: Container(
              width: 48,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.outlineVariant.withOpacity(0.6),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),

          Text(
            'Rate / Review Freelancer',
            style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 4),
          Text(
            'Share your experience working with ${widget.revieweeName}.',
            style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
          ),
          const SizedBox(height: 24),

          // 5-Star selector
          Center(
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: List.generate(5, (index) {
                final starValue = index + 1;
                final isActive = starValue <= _rating;

                return GestureDetector(
                  onTap: () => setState(() => _rating = starValue),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 6),
                    child: Icon(
                      isActive ? Icons.star_rounded : Icons.star_border_rounded,
                      color: isActive ? AppColors.promoOrange : AppColors.outlineVariant,
                      size: 44,
                    ),
                  ),
                );
              }),
            ),
          ),
          const SizedBox(height: 8),
          Center(
            child: Text(
              _rating == 5
                  ? 'Excellent!'
                  : _rating == 4
                      ? 'Very Good'
                      : _rating == 3
                          ? 'Good / Average'
                          : _rating == 2
                              ? 'Fair'
                              : 'Poor',
              style: textTheme.labelMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w800),
            ),
          ),
          const SizedBox(height: 24),

          if (_error != null) ...[
            Container(
              padding: const EdgeInsets.all(12),
              width: double.infinity,
              decoration: BoxDecoration(
                color: AppColors.errorContainer.withOpacity(0.3),
                borderRadius: AppRadius.lgR,
                border: Border.all(color: AppColors.error.withOpacity(0.3)),
              ),
              child: Text(
                _error!,
                style: textTheme.bodyMedium?.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
              ),
            ),
            const SizedBox(height: 16),
          ],

          Text(
            'Feedback Comments',
            style: textTheme.labelSmall?.copyWith(color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 8),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: AppRadius.lgR,
              border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
            ),
            child: TextField(
              controller: _commentController,
              maxLines: 4,
              style: textTheme.bodyMedium,
              decoration: InputDecoration(
                hintText: 'Describe key qualities, skills, communication, and overall execution...',
                hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 24),

          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                  ),
                  onPressed: () => Navigator.of(context).pop(),
                  child: Text(
                    'Cancel',
                    style: textTheme.labelMedium?.copyWith(color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w700),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: PrimaryButton(
                  label: 'Submit Review',
                  isLoading: _isSubmitting,
                  onPressed: _submit,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],
      ),
    );
  }
}
