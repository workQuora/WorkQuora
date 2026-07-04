import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:dio/dio.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/wallet_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});
  @override State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  @override void initState() { super.initState(); WidgetsBinding.instance.addPostFrameCallback((_) => context.read<WalletProvider>().fetchWallet()); }

  @override
  Widget build(BuildContext context) {
    final w = context.watch<WalletProvider>();
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('My Wallet'), backgroundColor: AppColors.bg, elevation: 0, actions: [
        IconButton(icon: const Icon(Icons.refresh, color: AppColors.textMuted), onPressed: () => context.read<WalletProvider>().fetchWallet()),
      ]),
      body: RefreshIndicator(color: AppColors.primary, backgroundColor: AppColors.surface, onRefresh: () => context.read<WalletProvider>().fetchWallet(),
        child: SingleChildScrollView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.all(20), child: Column(children: [
          Container(
            width: double.infinity, padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [AppColors.primary, AppColors.primary.withOpacity(0.6), const Color(0xFF7C3AED)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 24, offset: const Offset(0, 8))],
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                const Text('Available Balance', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500, letterSpacing: 0.5)),
                Container(padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4), decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(20)),
                  child: const Text('WorkQuora Pay', style: TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold))),
              ]),
              const SizedBox(height: 10),
              Text('₹ ${w.balance.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 38, fontWeight: FontWeight.w900, letterSpacing: -1)),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(child: GestureDetector(
                  onTap: () => showDialog(context: context, builder: (_) => const AddMoneyDialog()),
                  child: Container(padding: const EdgeInsets.symmetric(vertical: 12), decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                    child: const Center(child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.add, color: AppColors.primary, size: 16), SizedBox(width: 6), Text('Add Money', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13))]))),
                )),
                const SizedBox(width: 12),
                Expanded(child: GestureDetector(
                  onTap: () => showDialog(context: context, builder: (_) => const WithdrawDialog()),
                  child: Container(padding: const EdgeInsets.symmetric(vertical: 12), decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12), border: Border.all(color: Colors.white.withOpacity(0.3))),
                    child: const Center(child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.arrow_upward, color: Colors.white, size: 16), SizedBox(width: 6), Text('Withdraw', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13))]))),
                )),
              ]),
            ]),
          ),

          const SizedBox(height: 28),

          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
            const Text('Transaction History', style: TextStyle(color: AppColors.text, fontSize: 16, fontWeight: FontWeight.bold)),
            if (w.isLoading) const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.textMuted)),
          ]),
          const SizedBox(height: 14),

          if (w.isLoading)
            Column(children: List.generate(5, (_) => Padding(padding: const EdgeInsets.only(bottom: 10),
              child: Shimmer.fromColors(baseColor: AppColors.surface, highlightColor: AppColors.surfaceAlt,
                child: Container(height: 64, decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)))))))
          else if (w.transactions.isEmpty)
            Container(padding: const EdgeInsets.all(40), child: Column(children: [
              const Icon(Icons.account_balance_wallet_outlined, color: AppColors.textMuted, size: 56),
              const SizedBox(height: 12),
              const Text('No transactions yet', style: TextStyle(color: AppColors.textMuted, fontSize: 15)),
              const SizedBox(height: 6),
              Text('Add money to get started', style: TextStyle(color: AppColors.textMuted.withOpacity(0.6), fontSize: 12)),
            ]))
          else
            ...w.transactions.map((tx) {
              final isCredit = (tx['type'] ?? '') == 'credit';
              final amt = ((tx['amount'] ?? 0) / 100).toStringAsFixed(2);
              return Container(margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  Container(width: 42, height: 42, decoration: BoxDecoration(color: (isCredit ? AppColors.emerald : AppColors.error).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                    child: Icon(isCredit ? Icons.arrow_downward : Icons.arrow_upward, color: isCredit ? AppColors.emerald : AppColors.error, size: 20)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(tx['description'] ?? (isCredit ? 'Top Up' : 'Withdrawal'), style: const TextStyle(color: AppColors.text, fontSize: 14, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(tx['createdAt']?.toString().substring(0, 10) ?? '', style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                  ])),
                  Text('${isCredit ? '+' : '-'}₹$amt', style: TextStyle(color: isCredit ? AppColors.emerald : AppColors.error, fontWeight: FontWeight.bold, fontSize: 15)),
                ]));
            }).toList(),
        ])),
      ),
    );
  }
}

class AddMoneyDialog extends StatefulWidget {
  const AddMoneyDialog({super.key});
  @override State<AddMoneyDialog> createState() => _AddMoneyDialogState();
}

class _AddMoneyDialogState extends State<AddMoneyDialog> {
  final _amountCtrl = TextEditingController();
  bool _loading = false;

  @override void dispose() { _amountCtrl.dispose(); super.dispose(); }

  Future<void> _proceed() async {
    final rupees = double.tryParse(_amountCtrl.text);
    if (rupees == null || rupees <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid amount'), backgroundColor: AppColors.error));
      return;
    }
    setState(() => _loading = true);
    try {
      final order = await context.read<WalletProvider>().createAddMoneyOrder((rupees * 100).round());
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('Order created (ID: ${order?['orderId'] ?? '—'}). In-app payment is coming soon — complete this top-up from the WorkQuora web app for now.'),
        backgroundColor: AppColors.primary,
      ));
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      final msg = e is DioException ? (e.response?.data?['message'] ?? 'Failed to create order') : 'Failed to create order';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Text('Add Money', style: TextStyle(color: AppColors.text)),
      content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Enter amount to add to your wallet', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        const SizedBox(height: 14),
        AppTextField(controller: _amountCtrl, hint: 'e.g. 500', icon: Icons.currency_rupee, keyboardType: TextInputType.number),
      ]),
      actions: [
        TextButton(onPressed: _loading ? null : () => Navigator.of(context).pop(), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
        SizedBox(width: 140, child: AppButton(label: 'Proceed to Payment', loading: _loading, onPressed: _proceed)),
      ],
    );
  }
}

class WithdrawDialog extends StatefulWidget {
  const WithdrawDialog({super.key});
  @override State<WithdrawDialog> createState() => _WithdrawDialogState();
}

class _WithdrawDialogState extends State<WithdrawDialog> {
  final _amountCtrl = TextEditingController();
  final _pinCtrl = TextEditingController();
  bool _loading = false;

  @override void dispose() { _amountCtrl.dispose(); _pinCtrl.dispose(); super.dispose(); }

  Future<void> _withdraw() async {
    final rupees = double.tryParse(_amountCtrl.text);
    if (rupees == null || rupees <= 0) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a valid amount'), backgroundColor: AppColors.error));
      return;
    }
    if (_pinCtrl.text.length != 4) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter your 4-digit withdrawal PIN'), backgroundColor: AppColors.error));
      return;
    }
    setState(() => _loading = true);
    try {
      await context.read<WalletProvider>().withdraw((rupees * 100).round(), _pinCtrl.text);
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Withdrawal initiated'), backgroundColor: AppColors.success));
    } catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      final msg = e is DioException ? (e.response?.data?['message'] ?? 'Withdrawal failed') : 'Withdrawal failed';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      backgroundColor: AppColors.surface,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      title: const Text('Withdraw', style: TextStyle(color: AppColors.text)),
      content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('Enter amount and your withdrawal PIN', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
        const SizedBox(height: 14),
        AppTextField(controller: _amountCtrl, hint: 'e.g. 500', icon: Icons.currency_rupee, keyboardType: TextInputType.number),
        const SizedBox(height: 12),
        AppTextField(controller: _pinCtrl, hint: '4-digit PIN', icon: Icons.lock_outline, obscure: true, keyboardType: TextInputType.number),
      ]),
      actions: [
        TextButton(onPressed: _loading ? null : () => Navigator.of(context).pop(), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
        SizedBox(width: 100, child: AppButton(label: 'Withdraw', loading: _loading, onPressed: _withdraw)),
      ],
    );
  }
}
