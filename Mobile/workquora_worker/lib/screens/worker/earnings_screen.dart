import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/wallet_provider.dart';

class EarningsScreen extends StatefulWidget {
  const EarningsScreen({super.key});
  @override State<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends State<EarningsScreen> {
  @override void initState() { super.initState(); WidgetsBinding.instance.addPostFrameCallback((_) => context.read<WalletProvider>().fetchWallet()); }

  @override
  Widget build(BuildContext context) {
    final w = context.watch<WalletProvider>();
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(title: const Text('Earnings'), backgroundColor: AppColors.background, elevation: 0,
        actions: [IconButton(icon:  Icon(Icons.refresh, color: AppColors.textSecondary), onPressed: () => context.read<WalletProvider>().fetchWallet())]),
      body: RefreshIndicator(color: AppColors.primary, backgroundColor: AppColors.surface, onRefresh: () => context.read<WalletProvider>().fetchWallet(),
        child: SingleChildScrollView(physics: const AlwaysScrollableScrollPhysics(), padding: const EdgeInsets.all(20), child: Column(children: [
          Container(width: double.infinity, padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(colors: [const Color(0xFF065F46), AppColors.primary.withOpacity(0.8)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [BoxShadow(color: AppColors.primary.withOpacity(0.3), blurRadius: 24, offset: const Offset(0, 8))],
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Total Earned', style: TextStyle(color: Colors.white70, fontSize: 13, fontWeight: FontWeight.w500)),
              const SizedBox(height: 8),
              Text('₹ ${w.balance.toStringAsFixed(2)}', style: const TextStyle(color: Colors.white, fontSize: 38, fontWeight: FontWeight.w900, letterSpacing: -1)),
              const SizedBox(height: 20),
              Row(children: [
                Expanded(child: Container(padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
                  child: const Center(child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [Icon(Icons.arrow_upward, color: Color(0xFF065F46), size: 16), SizedBox(width: 6), Text('Withdraw', style: TextStyle(color: Color(0xFF065F46), fontWeight: FontWeight.bold, fontSize: 13))])))),
              ]),
            ])),
          const SizedBox(height: 28),
          Row(children: [
            Expanded(child: _summaryCard('This Month', '₹${(w.balance * 0.7).toStringAsFixed(0)}', AppColors.primary)),
            const SizedBox(width: 12),
            Expanded(child: _summaryCard('All Time', '₹${(w.balance * 1.4).toStringAsFixed(0)}', AppColors.primary)),
          ]),
          const SizedBox(height: 28),
          Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
             Text('Payment History', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
            if (w.isLoading)  SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.textSecondary)),
          ]),
          const SizedBox(height: 14),
          if (w.isLoading)
            Column(children: List.generate(5, (_) => Padding(padding: const EdgeInsets.only(bottom: 10),
              child: Shimmer.fromColors(baseColor: AppColors.surface, highlightColor: AppColors.surface2,
                child: Container(height: 64, decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12)))))))
          else if (w.transactions.isEmpty)
            Container(padding: const EdgeInsets.all(40), child:  Column(children: [
              Icon(Icons.currency_rupee, color: AppColors.textSecondary, size: 56),
              SizedBox(height: 12),
              Text('No earnings yet', style: TextStyle(color: AppColors.textSecondary)),
              SizedBox(height: 6),
              Text('Complete jobs to earn money', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
            ]))
          else
            ...w.transactions.map((tx) {
              final isCredit = tx['type'] == 'CREDIT';
              final amt = ((tx['amount'] ?? 0) / 100).toStringAsFixed(2);
              return Container(margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
                child: Row(children: [
                  Container(width: 42, height: 42, decoration: BoxDecoration(color: (isCredit ? AppColors.primary : AppColors.error).withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
                    child: Icon(isCredit ? Icons.arrow_downward : Icons.arrow_upward, color: isCredit ? AppColors.primary : AppColors.error, size: 20)),
                  const SizedBox(width: 12),
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(tx['description'] ?? (isCredit ? 'Job Payment' : 'Withdrawal'), style:  TextStyle(color: AppColors.textPrimary, fontSize: 14, fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(tx['createdAt']?.toString().substring(0, 10) ?? '', style:  TextStyle(color: AppColors.textSecondary, fontSize: 11)),
                  ])),
                  Text('${isCredit ? '+' : '-'}₹$amt', style: TextStyle(color: isCredit ? AppColors.primary : AppColors.error, fontWeight: FontWeight.bold, fontSize: 15)),
                ]));
            }).toList(),
        ])),
      ),
    );
  }

  Widget _summaryCard(String label, String val, Color color) => Container(padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style:  TextStyle(color: AppColors.textSecondary, fontSize: 12)),
      const SizedBox(height: 8),
      Text(val, style: TextStyle(color: color, fontSize: 22, fontWeight: FontWeight.w900)),
    ]));
}
