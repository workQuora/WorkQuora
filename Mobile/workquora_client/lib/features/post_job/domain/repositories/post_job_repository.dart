import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../data/models/job_model.dart';

abstract class PostJobRepository {
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
  });

  Future<Either<AppFailure, List<JobModel>>> getMyJobs();
  Future<Either<AppFailure, JobModel>> getJobById(String id);
}
