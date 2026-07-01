import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../data/post_job_providers.dart';
import '../../data/models/job_model.dart';

class ProjectSuccessScreen extends ConsumerWidget {
  const ProjectSuccessScreen({super.key, required this.jobId});
  final String jobId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final jobAsync = ref.watch(jobDetailsProvider(jobId));
    final textTheme = AppTypography.light;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Project Invoicing',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.onSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: SafeArea(
        child: jobAsync.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primary)),
          error: (error, _) => SingleChildScrollView(
            child: Padding(
              padding: const EdgeInsets.all(32.0),
              child: Column(
                children: [
                  const Icon(Icons.error_outline_rounded, size: 48, color: AppColors.outline),
                  const SizedBox(height: 12),
                  Text(error.toString(), textAlign: TextAlign.center, style: textTheme.bodyLarge),
                  const SizedBox(height: 24),
                  PrimaryButton(label: 'Go Back', onPressed: () => context.go('/home')),
                ],
              ),
            ),
          ),
          data: (job) => _buildInvoiceContent(context, job),
        ),
      ),
    );
  }

  Widget _buildInvoiceContent(BuildContext context, JobModel job) {
    final textTheme = AppTypography.light;

    // Calculate invoice breakdown details
    final baseBudget = job.budget > 0 ? job.budget : (job.maxBudget ?? 12000.0);
    final platformFee = (baseBudget * 0.03); // 3%
    final cgst = (baseBudget * 0.09); // 9%
    final sgst = (baseBudget * 0.09); // 9%
    final totalAmount = baseBudget + platformFee + cgst + sgst;

    final clientShortId = job.id.length > 6
        ? job.id.substring(job.id.length - 6).toUpperCase()
        : 'XXXXXX';

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.containerMargin),
      child: Column(
        children: [
          // 1. Celebration Section
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.secondary.withOpacity(0.08),
              shape: BoxShape.circle,
            ),
            child: const Icon(
              Icons.stars_rounded,
              color: AppColors.secondary,
              size: 54,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Project Completed & Finalized!',
            style: textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: AppColors.secondary,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'All milestones have been successfully delivered and payment has been processed securely via escrow.',
            style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 28),

          // 2. Invoice Card
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: AppRadius.xlR,
              border: Border.all(color: AppColors.outlineVariant.withOpacity(0.3)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.02),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Stack(
              children: [
                // Diagonal Paid validation watermark stamp
                Positioned(
                  top: 40,
                  right: 20,
                  child: Transform.rotate(
                    angle: -0.2,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.secondary.withOpacity(0.6), width: 3),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'PAID VIA ESCROW',
                        style: textTheme.labelSmall?.copyWith(
                          color: AppColors.secondary.withOpacity(0.6),
                          fontWeight: FontWeight.w900,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ),
                  ),
                ),

                Padding(
                  padding: const EdgeInsets.all(20.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'BILLING SUMMARY',
                        style: textTheme.labelSmall?.copyWith(
                          color: AppColors.outline,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 1.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Invoice WQ-$clientShortId',
                        style: textTheme.labelSmall?.copyWith(
                          color: AppColors.onSurface,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const Divider(height: 24),

                      _buildInvoiceRow('Gig / Job Title', job.title, isBold: true),
                      _buildInvoiceRow('Freelancer Hired', 'Verified Professional'),
                      _buildInvoiceRow('Status', job.status.toUpperCase(), valueColor: AppColors.secondary),
                      const Divider(height: 24),

                      Text(
                        'Milestones & Pricing Breakdown',
                        style: textTheme.labelSmall?.copyWith(
                          color: AppColors.outline,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.8,
                        ),
                      ),
                      const SizedBox(height: 12),
                      _buildInvoiceRow('Milestone 1 Deliverables', '₹${baseBudget.toStringAsFixed(2)}'),
                      _buildInvoiceRow('Platform Escrow Fee (3%)', '₹${platformFee.toStringAsFixed(2)}'),
                      _buildInvoiceRow('CGST (9%)', '₹${cgst.toStringAsFixed(2)}'),
                      _buildInvoiceRow('SGST (9%)', '₹${sgst.toStringAsFixed(2)}'),
                      const Divider(height: 24),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'TOTAL PAID AMOUNT',
                            style: textTheme.labelMedium?.copyWith(
                              color: AppColors.onSurface,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                          Text(
                            '₹${totalAmount.toStringAsFixed(2)}',
                            style: textTheme.titleLarge?.copyWith(
                              color: AppColors.primary,
                              fontWeight: FontWeight.w900,
                              fontSize: 22,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 36),

          // 3. CTA Buttons
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.onPrimary,
                shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                elevation: 0,
              ),
              onPressed: () => context.go('/home'),
              icon: const Icon(Icons.dashboard_rounded, size: 18),
              label: Text(
                'Back to Dashboard',
                style: textTheme.labelMedium?.copyWith(
                  color: AppColors.onPrimary,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                side: const BorderSide(color: AppColors.outlineVariant),
              ),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Downloading invoice PDF...'), backgroundColor: AppColors.secondary),
                );
              },
              icon: const Icon(Icons.download_rounded, size: 18, color: AppColors.onSurfaceVariant),
              label: Text(
                'Download PDF Invoice',
                style: textTheme.labelMedium?.copyWith(
                  color: AppColors.onSurfaceVariant,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildInvoiceRow(
    String label,
    String value, {
    bool isBold = false,
    Color? valueColor,
  }) {
    final textTheme = AppTypography.light;
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            flex: 2,
            child: Text(
              label,
              style: textTheme.bodyMedium?.copyWith(
                color: AppColors.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            flex: 3,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: textTheme.bodyMedium?.copyWith(
                color: valueColor ?? AppColors.onSurface,
                fontWeight: isBold ? FontWeight.w800 : FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
