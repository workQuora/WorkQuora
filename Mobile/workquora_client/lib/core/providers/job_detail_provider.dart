import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import '../network/dio_client.dart';
import '../constants/api_constants.dart';

class JobDetailProvider extends ChangeNotifier {
  Map<String, dynamic>? _job;
  List<Map<String, dynamic>> _proposals = [];
  bool _isLoading = false;
  bool _isActing = false;
  String? _error;

  Map<String, dynamic>? get job => _job;
  List<Map<String, dynamic>> get proposals => _proposals;
  bool get isLoading => _isLoading;
  bool get isActing => _isActing;
  String? get error => _error;

  String get jobStatus => _job?['status'] ?? '';
  bool get isOpen => jobStatus == 'open';
  bool get isInProgress => jobStatus == 'in-progress';
  bool get isCancelled => jobStatus == 'cancelled';
  bool get isCompleted => jobStatus == 'completed';

  bool get clientRequestedCancel => _job?['cancellationRequestedByClient'] == true;
  bool get freelancerRequestedCancel => _job?['cancellationRequestedByFreelancer'] == true;

  Future<void> fetchJob(String jobId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await DioClient.instance.dio.get('${ApiConstants.jobs}/$jobId');
      _job = Map<String, dynamic>.from(res.data['data']);

      // proposals (enriched with freelancerInfo) are only present when the
      // requester is the job's own client — GET /jobs/:id embeds them.
      final rawProposals = _job?['proposals'];
      _proposals = rawProposals is List
          ? rawProposals.map((p) => Map<String, dynamic>.from(p)).toList()
          : [];
    } catch (e) {
      _error = _extractError(e);
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> acceptProposal(String proposalId) async {
    _isActing = true;
    notifyListeners();

    try {
      await DioClient.instance.dio.put('${ApiConstants.proposals}/$proposalId/accept');
      final jobId = _job?['_id']?.toString();
      if (jobId != null) await fetchJob(jobId);
      _isActing = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isActing = false;
      _error = _extractError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> rejectProposal(String proposalId) async {
    _isActing = true;
    notifyListeners();

    try {
      await DioClient.instance.dio.put('${ApiConstants.proposals}/$proposalId/reject');
      final jobId = _job?['_id']?.toString();
      if (jobId != null) await fetchJob(jobId);
      _isActing = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isActing = false;
      _error = _extractError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> requestCancellation(String jobId) async {
    _isActing = true;
    notifyListeners();

    try {
      await DioClient.instance.dio.put('${ApiConstants.jobs}/$jobId/cancel');
      await fetchJob(jobId);
      _isActing = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isActing = false;
      _error = _extractError(e);
      notifyListeners();
      return false;
    }
  }

  Future<bool> deleteJob(String jobId) async {
    _isActing = true;
    notifyListeners();

    try {
      await DioClient.instance.dio.delete('${ApiConstants.jobs}/$jobId');
      _isActing = false;
      notifyListeners();
      return true;
    } catch (e) {
      _isActing = false;
      _error = _extractError(e);
      notifyListeners();
      return false;
    }
  }

  String _extractError(dynamic e) {
    if (e is DioException) {
      return e.response?.data?['message'] ?? 'Something went wrong';
    }
    return e.toString();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }

  void reset() {
    _job = null;
    _proposals = [];
    _error = null;
    _isLoading = false;
    _isActing = false;
  }
}
