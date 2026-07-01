import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../domain/repositories/post_job_repository.dart';
import '../datasources/post_job_remote_datasource.dart';
import '../models/job_model.dart';

class PostJobRepositoryImpl implements PostJobRepository {
  PostJobRepositoryImpl(this._remote);
  final PostJobRemoteDataSource _remote;

  @override
  Future<Either<AppFailure, JobModel>> createJob({
    required String title,
    required String description,
    required String category,
    required List<String> skillsRequired,
    required num minBudget,
    required num maxBudget,
    required double lat,
    required double lng,
    required String address,
    bool isUrgent = false,
  }) async {
    try {
      final job = await _remote.createJob(
        title: title,
        description: description,
        category: category,
        skillsRequired: skillsRequired,
        minBudget: minBudget,
        maxBudget: maxBudget,
        lat: lat,
        lng: lng,
        address: address,
        isUrgent: isUrgent,
      );
      return Right(job);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
        return Left(AppFailure.network());
      }
      final message = (e.response?.data is Map) ? e.response?.data['message'] as String? : null;
      // jobController.createJob returns this exact 400 message when Aadhaar+PAN
      // KYC isn't verified — surfaced as statusCode 428 (client-side convention
      // here, not a real HTTP status from the server) so the UI can special-case it.
      final isKycRequired = e.response?.statusCode == 400 &&
          (message?.toLowerCase().contains('kyc') ?? false);
      return Left(AppFailure.fromMessage(
        message ?? 'Could not post job. Please try again.',
        statusCode: isKycRequired ? 428 : e.response?.statusCode,
      ));
    } catch (_) {
      return Left(AppFailure.fromMessage('Unexpected error posting job.'));
    }
  }

  @override
  Future<Either<AppFailure, List<JobModel>>> getMyJobs() async {
    try {
      final jobs = await _remote.getMyJobs();
      return Right(jobs);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
        return Left(AppFailure.network());
      }
      final message = (e.response?.data is Map) ? e.response?.data['message'] as String? : null;
      return Left(AppFailure.fromMessage(message ?? 'Could not load your jobs. Please try again.'));
    } catch (_) {
      return Left(AppFailure.fromMessage('Unexpected error loading your jobs.'));
    }
  }

  @override
  Future<Either<AppFailure, JobModel>> getJobById(String id) async {
    try {
      final job = await _remote.getJobById(id);
      return Right(job);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
        return Left(AppFailure.network());
      }
      final message = (e.response?.data is Map) ? e.response?.data['message'] as String? : null;
      return Left(AppFailure.fromMessage(message ?? 'Could not load job details.'));
    } catch (_) {
      return Left(AppFailure.fromMessage('Unexpected error loading job details.'));
    }
  }
}
