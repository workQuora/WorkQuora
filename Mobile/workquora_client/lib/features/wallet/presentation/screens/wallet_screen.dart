import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../application/wallet_controller.dart';
import '../../application/transactions_controller.dart';
import '../../data/models/wallet_transaction_model.dart';
import '../widgets/add_money_sheet.dart';
import '../widgets/add_bank_account_sheet.dart';

/// Wallet screen — "Secure Wallet" target design, all figures live from the
/// backend. Balance comes pre-formatted from the server (paise→rupee is
/// server-side only, per the project's wallet-unit rule).
class WalletScreen extends ConsumerWidget {
  const WalletScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final walletAsync = ref.watch(walletControllerProvider);
    final txState = ref.watch(transactionsControllerProvider);
    final tt = AppTypography.light;
    final inr = NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2);

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            await ref.read(walletControllerProvider.notifier).refresh();
            await ref.read(transactionsControllerProvider.notifier).refresh();
          },
          child: CustomScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            slivers: [
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([

                    // ── Header ──────────────────────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(children: [
                          Container(
                            width: 36, height: 36,
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                  colors: [AppColors.primary, AppColors.primaryContainer]),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: const Icon(Icons.person_rounded,
                                color: Colors.white, size: 20),
                          ),
                          const SizedBox(width: 8),
                          Text('wQ Recruit',
                              style: tt.titleLarge?.copyWith(
                                  fontWeight: FontWeight.w800, color: AppColors.primary)),
                        ]),
                        IconButton(
                          icon: const Icon(Icons.notifications_none_rounded),
                          onPressed: () => context.push('/notifications'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text('Secure Wallet',
                        style: tt.headlineLarge?.copyWith(fontWeight: FontWeight.w900)),
                    Text('Manage your recruitment funds and billing',
                        style: tt.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant)),
                    const SizedBox(height: 16),

                    // ── Statement / Deposit buttons ─────────────────────────
                    Row(children: [
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            side: const BorderSide(color: AppColors.outlineVariant),
                            shape:
                                RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: () {},
                          child: const Text('Statement',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            elevation: 0,
                            shape:
                                RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                          ),
                          onPressed: () => showModalBottomSheet(
                            context: context,
                            isScrollControlled: true,
                            backgroundColor: Colors.transparent,
                            builder: (_) => const AddMoneySheet(),
                          ),
                          child: const Text('Deposit Funds',
                              style: TextStyle(fontWeight: FontWeight.w800)),
                        ),
                      ),
                    ]),
                    const SizedBox(height: 16),

                    // ── Balance card ────────────────────────────────────────
                    walletAsync.when(
                      loading: () => const _BalanceCardShimmer(),
                      error: (e, _) => _BalanceError(
                          message: e.toString(),
                          onRetry: () =>
                              ref.read(walletControllerProvider.notifier).refresh()),
                      data: (wallet) => Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(24),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFF1E00A9), Color(0xFF3525CD)],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          borderRadius: BorderRadius.circular(24),
                          boxShadow: [
                            BoxShadow(
                                color: AppColors.primary.withOpacity(0.35),
                                blurRadius: 20,
                                offset: const Offset(0, 10)),
                          ],
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('TOTAL AVAILABLE BALANCE',
                                    style: tt.labelSmall?.copyWith(
                                        color: Colors.white70,
                                        letterSpacing: 1,
                                        fontWeight: FontWeight.w700)),
                                const Icon(Icons.account_balance_wallet_outlined,
                                    color: Colors.white54),
                              ],
                            ),
                            const SizedBox(height: 8),
                            Text(
                              inr.format(wallet?.formattedBalance ?? 0),
                              style: tt.displaySmall?.copyWith(
                                  color: Colors.white, fontWeight: FontWeight.w900),
                            ),
                            const SizedBox(height: 20),
                            Row(children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                    color: Colors.white.withOpacity(0.15),
                                    borderRadius: AppRadius.fullR),
                                child: Text(
                                    '${wallet?.bankAccounts.length ?? 0} linked account(s)',
                                    style: tt.labelSmall
                                        ?.copyWith(color: Colors.white)),
                              ),
                            ]),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),

                    // ── Payment Methods ─────────────────────────────────────
                    Text('Payment Methods',
                        style: tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                    const SizedBox(height: 8),
                    walletAsync.maybeWhen(
                      data: (wallet) => Column(
                        children: [
                          ...?wallet?.bankAccounts.map((acc) => Container(
                                margin: const EdgeInsets.only(bottom: 10),
                                padding: const EdgeInsets.all(16),
                                decoration: BoxDecoration(
                                    color: Colors.white,
                                    borderRadius: AppRadius.xlR),
                                child: Row(children: [
                                  Container(
                                    width: 40, height: 40,
                                    decoration: BoxDecoration(
                                        color: AppColors.primaryFixed,
                                        borderRadius: AppRadius.mdR),
                                    child: const Icon(Icons.account_balance_rounded,
                                        color: AppColors.primary, size: 20),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(acc.bankName,
                                            style: tt.bodyLarge?.copyWith(
                                                fontWeight: FontWeight.w700)),
                                        Text('•••• ${acc.accountEnding}',
                                            style: tt.labelSmall?.copyWith(
                                                color: AppColors.outline)),
                                      ],
                                    ),
                                  ),
                                  if (acc.isPrimary)
                                    Container(
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 8, vertical: 2),
                                      decoration: BoxDecoration(
                                          color: AppColors.secondaryFixed
                                              .withOpacity(0.4),
                                          borderRadius: AppRadius.fullR),
                                      child: Text('Primary',
                                          style: tt.labelSmall?.copyWith(
                                              color: AppColors.secondary,
                                              fontWeight: FontWeight.w800)),
                                    ),
                                ]),
                              )),
                          // Add method (dashed)
                          GestureDetector(
                            onTap: () => showModalBottomSheet(
                              context: context,
                              isScrollControlled: true,
                              backgroundColor: Colors.transparent,
                              builder: (_) => const AddBankAccountSheet(),
                            ),
                            child: Container(
                              width: double.infinity,
                              padding: const EdgeInsets.symmetric(vertical: 18),
                              decoration: BoxDecoration(
                                border: Border.all(
                                    color: AppColors.outlineVariant, width: 1.4),
                                borderRadius: AppRadius.xlR,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Icon(Icons.add_rounded,
                                      color: AppColors.onSurfaceVariant, size: 20),
                                  const SizedBox(width: 6),
                                  Text('Add Method',
                                      style: tt.labelMedium?.copyWith(
                                          fontWeight: FontWeight.w700,
                                          color: AppColors.onSurfaceVariant)),
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      orElse: () => const SizedBox.shrink(),
                    ),
                    const SizedBox(height: 20),

                    // ── Recent Transactions ─────────────────────────────────
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Recent Transactions',
                            style:
                                tt.titleLarge?.copyWith(fontWeight: FontWeight.w800)),
                        TextButton(
                          onPressed: () => ref
                              .read(transactionsControllerProvider.notifier)
                              .loadMore(),
                          child: Text('View All',
                              style: tt.labelMedium?.copyWith(
                                  color: AppColors.primary,
                                  fontWeight: FontWeight.w700)),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),

                    if (txState.isLoading)
                      const Padding(
                        padding: EdgeInsets.all(24),
                        child: Center(
                            child: CircularProgressIndicator(
                                color: AppColors.primary, strokeWidth: 2)),
                      )
                    else if (txState.transactions.isEmpty)
                      Padding(
                        padding: const EdgeInsets.all(24),
                        child: Center(
                          child: Text('No transactions yet.',
                              style: tt.bodyMedium
                                  ?.copyWith(color: AppColors.outline)),
                        ),
                      )
                    else
                      ...txState.transactions
                          .take(10)
                          .map((tx) => _TransactionTile(tx: tx, inr: inr)),

                    const SizedBox(height: 100),
                  ]),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ── Transaction tile ──────────────────────────────────────────────────────────
class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.tx, required this.inr});
  final WalletTransactionModel tx;
  final NumberFormat inr;

  @override
  Widget build(BuildContext context) {
    final tt = AppTypography.light;
    final isCredit = tx.isCredit;
    final (icon, iconBg, iconColor) = switch (tx.status) {
      'pending' => (Icons.schedule_rounded, AppColors.primaryFixed, AppColors.primary),
      'failed' => (Icons.cancel_outlined, AppColors.errorContainer, AppColors.error),
      _ => isCredit
          ? (Icons.add_circle_outline_rounded, const Color(0xFFEAF7ED), AppColors.secondary)
          : (Icons.check_circle_outline_rounded, const Color(0xFFEAF7ED), AppColors.secondary),
    };

    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration:
          BoxDecoration(color: Colors.white, borderRadius: AppRadius.xlR),
      child: Row(children: [
        Container(
          width: 40, height: 40,
          decoration: BoxDecoration(color: iconBg, shape: BoxShape.circle),
          child: Icon(icon, color: iconColor, size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(
              tx.description.isNotEmpty ? tx.description : tx.source.replaceAll('_', ' '),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: tt.bodyLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            Text(
              DateFormat('MMM d, yyyy').format(tx.createdAt),
              style: tt.labelSmall?.copyWith(color: AppColors.outline),
            ),
          ]),
        ),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text(
            '${isCredit ? '+' : '-'}${inr.format(tx.amountRupees)}',
            style: tt.bodyLarge?.copyWith(
              fontWeight: FontWeight.w800,
              color: isCredit ? AppColors.secondary : AppColors.onSurface,
            ),
          ),
          Text(
            tx.status[0].toUpperCase() + tx.status.substring(1),
            style: tt.labelSmall?.copyWith(
              color: switch (tx.status) {
                'completed' => AppColors.secondary,
                'failed' => AppColors.error,
                _ => AppColors.promoOrange,
              },
              fontWeight: FontWeight.w700,
            ),
          ),
        ]),
      ]),
    );
  }
}

class _BalanceCardShimmer extends StatelessWidget {
  const _BalanceCardShimmer();
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 160,
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerHigh,
        borderRadius: BorderRadius.circular(24),
      ),
      child: const Center(
          child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)),
    );
  }
}

class _BalanceError extends StatelessWidget {
  const _BalanceError({required this.message, required this.onRetry});
  final String message;
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
          color: AppColors.errorContainer.withOpacity(0.4),
          borderRadius: BorderRadius.circular(24)),
      child: Column(children: [
        Text(message,
            textAlign: TextAlign.center,
            style: AppTypography.light.bodyMedium?.copyWith(color: AppColors.error)),
        const SizedBox(height: 8),
        TextButton(onPressed: onRetry, child: const Text('Retry')),
      ]),
    );
  }
}
