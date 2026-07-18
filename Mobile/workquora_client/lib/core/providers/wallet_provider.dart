import 'package:flutter/material.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';
import '../utils/error_helper.dart';

class WalletProvider extends ChangeNotifier {
  Map<String, dynamic>? _wallet;
  List<dynamic> _transactions = [];
  bool _isLoading = false;
  String? _error;

  Map<String, dynamic>? get wallet => _wallet;
  List<dynamic> get transactions => _transactions;
  bool get isLoading => _isLoading;
  String? get error => _error;
  double get balance => ((_wallet?['balance'] ?? 0) / 100).toDouble();

  Future<void> fetchWallet() async {
    _isLoading = true; _error = null; notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.wallet);
      _wallet = res.data['data'] ?? res.data;
      final txRes = await DioClient.instance.dio.get(ApiConstants.transactions);
      _transactions = txRes.data['data']?['transactions'] ?? txRes.data['transactions'] ?? [];
    } catch (e) {
      // Was a bare catch(_){} — a failed fetch silently rendered as "no
      // transactions yet" instead of a genuine error, indistinguishable
      // from a real empty wallet.
      _error = ErrorHelper.extractError(e);
    }
    _isLoading = false; notifyListeners();
  }

  Future<Map<String, dynamic>?> createAddMoneyOrder(int amountPaise) async {
    final res = await DioClient.instance.dio.post(
      '/wallet/add-money/create-order',
      data: {'amount': amountPaise},
    );
    return res.data['data'];
  }

  // Called on logout (see app.dart) — otherwise a different account's next
  // Wallet visit could briefly flash the previous account's balance/history.
  void reset() {
    _wallet = null;
    _transactions = [];
    _isLoading = false;
    _error = null;
    notifyListeners();
  }
}
