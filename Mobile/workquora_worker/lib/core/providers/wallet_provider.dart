import 'package:flutter/material.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';

class WalletProvider extends ChangeNotifier {
  Map<String, dynamic>? _wallet;
  List<dynamic> _transactions = [];
  bool _isLoading = false;

  Map<String, dynamic>? get wallet => _wallet;
  List<dynamic> get transactions => _transactions;
  bool get isLoading => _isLoading;
  double get balance => ((_wallet?['balance'] ?? 0) / 100).toDouble();

  Future<void> fetchWallet() async {
    _isLoading = true; notifyListeners();
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.wallet);
      _wallet = res.data['data'] ?? res.data;
      final txRes = await DioClient.instance.dio.get(ApiConstants.transactions);
      _transactions = txRes.data['data']?['transactions'] ?? txRes.data['transactions'] ?? [];
    } catch (_) {}
    _isLoading = false; notifyListeners();
  }
}
