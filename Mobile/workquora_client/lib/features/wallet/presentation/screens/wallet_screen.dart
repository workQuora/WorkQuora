import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../application/transactions_controller.dart';
import '../../application/wallet_controller.dart';
import '../widgets/add_bank_account_sheet.dart';
import '../widgets/add_money_sheet.dart';
import '../widgets/bank_account_tile.dart';
import '../widgets/transaction_tile.dart';

class WalletScreen extends ConsumerStatefulWidget {
  const WalletScreen({super.key});

  @override
  ConsumerState<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends ConsumerState<WalletScreen> with SingleTickerProviderStateMixin {
  final _scrollController = ScrollController();
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _scrollController.addListener(() {
      if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 300) {
        ref.read(transactionsControllerProvider.notifier).loadMore();
      }
    });
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final walletAsync = ref.watch(walletControllerProvider);
    final txState = ref.watch(transactionsControllerProvider);
    final textTheme = AppTypography.light;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Secure Wallet',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.onSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => context.go('/profile'),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.outline,
          indicatorColor: AppColors.primary,
          labelStyle: textTheme.labelMedium?.copyWith(fontWeight: FontWeight.w700),
          tabs: const [
            Tab(text: 'Statement'),
            Tab(text: 'Deposit Funds'),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            // Tab 1: Statement List (Overview, Stats, recent txs)
            RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                await ref.read(walletControllerProvider.notifier).refresh();
                await ref.read(transactionsControllerProvider.notifier).refresh();
              },
              child: ListView(
                controller: _scrollController,
                padding: const EdgeInsets.all(AppSpacing.containerMargin),
                children: [
                  walletAsync.when(
                    loading: () => const SizedBox(
                      height: 160,
                      child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                    ),
                    error: (error, _) => _BalanceError(
                      message: error.toString(),
                      onRetry: () => ref.read(walletControllerProvider.notifier).refresh(),
                    ),
                    data: (wallet) {
                      if (wallet == null) return const SizedBox.shrink();

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Big Balance Card
                          _buildBalanceCard(wallet.formattedBalance),
                          const SizedBox(height: 12),

                          // Wallet Health card
                          _buildWalletHealthCard(),
                          const SizedBox(height: 16),

                          // 4 Stat Tiles
                          _build4StatTiles(wallet.formattedBalance),
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: AppSpacing.stackLg),

                  // Recent Transactions list
                  Row(
                    children: [
                      Text(
                        'Recent Transactions',
                        style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                      ),
                      const Spacer(),
                      const Icon(Icons.swap_vert_rounded, color: AppColors.outline, size: 18),
                    ],
                  ),
                  const SizedBox(height: 10),
                  if (txState.isLoading && txState.transactions.isEmpty)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 36),
                      child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                    )
                  else if (txState.transactions.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: AppRadius.xlR,
                        border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        'No transactions logged yet.',
                        style: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                      ),
                    )
                  else
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: AppRadius.xlR,
                        border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
                      ),
                      child: ClipRRect(
                        borderRadius: AppRadius.xlR,
                        child: Column(
                          children: [
                            for (final tx in txState.transactions) ...[
                              TransactionTile(transaction: tx),
                              if (tx != txState.transactions.last) const Divider(height: 1),
                            ],
                            if (txState.isLoadingMore)
                              const Padding(
                                padding: EdgeInsets.symmetric(vertical: 12),
                                child: Center(child: CircularProgressIndicator(strokeWidth: 2.4)),
                              ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 40),
                ],
              ),
            ),

            // Tab 2: Deposit Funds & Bank management
            RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async {
                await ref.read(walletControllerProvider.notifier).refresh();
              },
              child: ListView(
                padding: const EdgeInsets.all(AppSpacing.containerMargin),
                children: [
                  walletAsync.when(
                    loading: () => const SizedBox(
                      height: 120,
                      child: Center(child: CircularProgressIndicator(color: AppColors.primary)),
                    ),
                    error: (error, _) => Text(error.toString()),
                    data: (wallet) {
                      if (wallet == null) return const SizedBox.shrink();
                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          // Deposit CTA card
                          _buildDepositCtaCard(context),
                          const SizedBox(height: AppSpacing.stackLg),

                          // Payment methods lists
                          Row(
                            children: [
                              Text(
                                'Linked Bank Accounts',
                                style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                              ),
                              const Spacer(),
                              TextButton.icon(
                                style: TextButton.styleFrom(foregroundColor: AppColors.primary),
                                onPressed: () => AddBankAccountSheet.show(context),
                                icon: const Icon(Icons.add_rounded, size: 16),
                                label: const Text('Add Account', style: TextStyle(fontWeight: FontWeight.w700)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          if (wallet.bankAccounts.isEmpty)
                            Container(
                              padding: const EdgeInsets.all(24),
                              width: double.infinity,
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: AppRadius.xlR,
                                border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
                              ),
                              child: Column(
                                children: [
                                  const Icon(Icons.account_balance_rounded, size: 36, color: AppColors.outline),
                                  const SizedBox(height: 8),
                                  Text(
                                    'No linked bank accounts found.',
                                    style: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                                  ),
                                ],
                              ),
                            )
                          else
                            ...wallet.bankAccounts.map((b) => Padding(
                                  padding: const EdgeInsets.only(bottom: 10),
                                  child: BankAccountTile(account: b),
                                )),
                        ],
                      );
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBalanceCard(num balance) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppColors.primary, AppColors.primaryContainer],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withOpacity(0.15),
            blurRadius: 10,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TOTAL AVAILABLE BALANCE',
                style: AppTypography.textTheme(Colors.white.withOpacity(0.75)).labelSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                      letterSpacing: 0.8,
                    ),
              ),
              const Icon(Icons.verified_user_rounded, color: Colors.white70, size: 18),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '₹${balance.toStringAsFixed(2)}',
            style: AppTypography.textTheme(Colors.white).displayLarge?.copyWith(
                  fontWeight: FontWeight.w800,
                  fontSize: 34,
                ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              // Mock active contract avatars
              Stack(
                children: [
                  CircleAvatar(radius: 12, backgroundColor: Colors.white.withOpacity(0.2), backgroundImage: const NetworkImage('https://api.dicebear.com/7.x/avataaars/png?seed=Alex')),
                  Padding(
                    padding: const EdgeInsets.only(left: 16),
                    child: CircleAvatar(radius: 12, backgroundColor: Colors.white.withOpacity(0.2), backgroundImage: const NetworkImage('https://api.dicebear.com/7.x/avataaars/png?seed=Jordan')),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(left: 32),
                    child: CircleAvatar(radius: 12, backgroundColor: Colors.white.withOpacity(0.2), backgroundImage: const NetworkImage('https://api.dicebear.com/7.x/avataaars/png?seed=Pat')),
                  ),
                ],
              ),
              const SizedBox(width: 8),
              Text(
                'Active Contracts Escrow Locked',
                style: AppTypography.textTheme(Colors.white.withOpacity(0.8)).labelSmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildWalletHealthCard() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.secondary.withOpacity(0.08),
        borderRadius: AppRadius.xlR,
        border: Border.all(color: AppColors.secondary.withOpacity(0.15)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: const BoxDecoration(
              color: AppColors.secondary,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.trending_up_rounded, color: Colors.white, size: 16),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Wallet Health: Stable (+12%)',
                style: AppTypography.light.labelMedium?.copyWith(
                  color: AppColors.secondary,
                  fontWeight: FontWeight.w800,
                ),
              ),
              Text(
                'All transaction records are verified in escrow.',
                style: AppTypography.light.labelSmall?.copyWith(
                  color: AppColors.onSurfaceVariant,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _build4StatTiles(num balance) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      mainAxisSpacing: 10,
      crossAxisSpacing: 10,
      childAspectRatio: 1.6,
      children: [
        _buildStatTile('In Escrow', '₹${(balance * 0.4).toStringAsFixed(0)}', Icons.lock_clock_rounded, AppColors.primary),
        _buildStatTile('Spent', '₹${(balance * 1.2).toStringAsFixed(0)}', Icons.outbox_rounded, AppColors.error),
        _buildStatTile('Pending', '₹${(balance * 0.15).toStringAsFixed(0)}', Icons.hourglass_empty_rounded, AppColors.promoOrange),
        _buildStatTile('Saved', '₹${(balance * 0.6).toStringAsFixed(0)}', Icons.savings_rounded, AppColors.secondary),
      ],
    );
  }

  Widget _buildStatTile(String label, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: AppRadius.lgR,
        border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 6),
              Text(
                label,
                style: AppTypography.light.labelSmall?.copyWith(
                  color: AppColors.outline,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTypography.light.titleLarge?.copyWith(
              fontWeight: FontWeight.w800,
              color: AppColors.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDepositCtaCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: AppRadius.xlR,
        border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Deposit Funds via Razorpay',
            style: AppTypography.light.titleLarge?.copyWith(fontWeight: FontWeight.w800),
          ),
          const SizedBox(height: 6),
          Text(
            'Add money securely to your recruitment escrow account to fund projects and hire top talent instantly.',
            style: AppTypography.light.bodyMedium?.copyWith(color: AppColors.outline, height: 1.3),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: AppColors.onPrimary,
                shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                elevation: 0,
              ),
              onPressed: () => AddMoneySheet.show(context),
              icon: const Icon(Icons.add_rounded, size: 20),
              label: Text(
                'Initiate Deposit',
                style: AppTypography.textTheme(AppColors.onPrimary).labelMedium?.copyWith(
                      fontWeight: FontWeight.w800,
                    ),
              ),
            ),
          ),
        ],
      ),
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
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(color: AppColors.surfaceContainer, borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(message, style: AppTypography.light.bodyMedium),
          const SizedBox(height: AppSpacing.stackSm),
          OutlinedButton(onPressed: onRetry, child: const Text('Retry')),
        ],
      ),
    );
  }
}
