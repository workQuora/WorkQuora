import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/providers/wallet_provider.dart';
import '../../core/utils/error_helper.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';

// Client-only app — Withdraw is intentionally not offered here. The backend
// withdraw route is freelancer-only (authorize('freelancer')), so a client
// tapping it would always 403; Add Money (topping up escrow-linked balance)
// is the client-appropriate action and is all that's kept.
class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});
  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => context.read<WalletProvider>().fetchWallet());
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final w = context.watch<WalletProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('My Wallet'), actions: [
        IconButton(icon: const Icon(Icons.refresh_rounded), onPressed: () => context.read<WalletProvider>().fetchWallet()),
      ]),
      body: RefreshIndicator(
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surface,
        onRefresh: () => context.read<WalletProvider>().fetchWallet(),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(AppSpace.xl),
          child: Column(children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpace.xl),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary,
                borderRadius: BorderRadius.circular(AppRadius.card),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  const Text('Available Balance', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500, letterSpacing: 0.5)),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpace.sm, vertical: 4),
                    decoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(AppRadius.chip)),
                    child: const Text('WorkQuora Pay', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                  ),
                ]),
                const SizedBox(height: AppSpace.sm),
                Text('₹ ${w.balance.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 38, fontWeight: FontWeight.w900, letterSpacing: -1)),
                const SizedBox(height: AppSpace.lg),
                SizedBox(
                  width: double.infinity,
                  child: GestureDetector(
                    onTap: () => showDialog(context: context, builder: (_) => const AddMoneyDialog()),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: AppSpace.sm),
                      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(AppRadius.button)),
                      child: Center(
                        child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                          Icon(Icons.add_rounded, color: theme.colorScheme.primary, size: 16),
                          const SizedBox(width: AppSpace.xs),
                          Text('Add Money', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 13)),
                        ]),
                      ),
                    ),
                  ),
                ),
              ]),
            ),
            const SizedBox(height: AppSpace.xl),
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Text('Transaction History', style: theme.textTheme.titleMedium),
              if (w.isLoading) SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: tokens.muted)),
            ]),
            const SizedBox(height: AppSpace.md),
            if (w.isLoading)
              Column(
                children: List.generate(
                  5,
                  (_) => Padding(
                    padding: const EdgeInsets.only(bottom: AppSpace.sm),
                    child: Shimmer.fromColors(
                      baseColor: tokens.border,
                      highlightColor: theme.colorScheme.surface,
                      child: Container(height: 64, decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(AppRadius.card))),
                    ),
                  ),
                ),
              )
            else if (w.transactions.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpace.xl * 1.5),
                child: Column(children: [
                  Icon(Icons.account_balance_wallet_outlined, color: tokens.muted, size: 56),
                  const SizedBox(height: AppSpace.md),
                  Text('No transactions yet', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
                  const SizedBox(height: 4),
                  Text('Add money to get started', style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
                ]),
              )
            else
              ...w.transactions.map((tx) {
                final isCredit = (tx['type'] ?? '') == 'credit';
                final amt = ((tx['amount'] ?? 0) / 100).toStringAsFixed(2);
                final color = isCredit ? tokens.success : tokens.danger;
                return Container(
                  margin: const EdgeInsets.only(bottom: AppSpace.sm),
                  padding: const EdgeInsets.all(AppSpace.md),
                  decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(AppRadius.card), border: Border.all(color: tokens.border, width: 0.5)),
                  child: Row(children: [
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppRadius.button)),
                      child: Icon(isCredit ? Icons.arrow_downward_rounded : Icons.arrow_upward_rounded, color: color, size: 20),
                    ),
                    const SizedBox(width: AppSpace.md),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(tx['description']?.toString() ?? (isCredit ? 'Top Up' : 'Withdrawal'), style: theme.textTheme.bodyMedium),
                        const SizedBox(height: 2),
                        Text(tx['createdAt']?.toString().substring(0, 10) ?? '', style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
                      ]),
                    ),
                    Text('${isCredit ? '+' : '-'}₹$amt', style: theme.textTheme.bodyMedium?.copyWith(color: color, fontWeight: FontWeight.bold)),
                  ]),
                );
              }),
          ]),
        ),
      ),
    );
  }
}

class AddMoneyDialog extends StatefulWidget {
  const AddMoneyDialog({super.key});
  @override
  State<AddMoneyDialog> createState() => _AddMoneyDialogState();
}

class _AddMoneyDialogState extends State<AddMoneyDialog> {
  final _amountCtrl = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _amountCtrl.dispose();
    super.dispose();
  }

  Future<void> _proceed() async {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final rupees = double.tryParse(_amountCtrl.text);
    if (rupees == null || rupees <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Enter a valid amount'), backgroundColor: tokens.danger));
      return;
    }
    setState(() => _loading = true);
    try {
      final order = await context.read<WalletProvider>().createAddMoneyOrder((rupees * 100).round());
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Order created (ID: ${order?['orderId'] ?? '—'}). In-app payment is coming soon — complete this top-up from the WorkQuora web app for now.'),
        backgroundColor: theme.colorScheme.primary,
      ));
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorHelper.extractError(e)), backgroundColor: tokens.danger));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
      title: const Text('Add Money'),
      content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Enter amount to add to your wallet', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
        const SizedBox(height: AppSpace.md),
        TextField(controller: _amountCtrl, keyboardType: TextInputType.number, decoration: const InputDecoration(hintText: 'e.g. 500', prefixIcon: Icon(Icons.currency_rupee))),
      ]),
      actions: [
        TextButton(onPressed: _loading ? null : () => Navigator.of(context).pop(), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
        SizedBox(width: 160, child: PrimaryButton(label: 'Proceed to Payment', loading: _loading, onPressed: _proceed)),
      ],
    );
  }
}
