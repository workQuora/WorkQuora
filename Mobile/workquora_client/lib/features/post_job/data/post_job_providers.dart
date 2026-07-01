import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/core_providers.dart';
import '../domain/repositories/post_job_repository.dart';
import 'datasources/post_job_remote_datasource.dart';
import 'models/job_model.dart';
import 'repositories/post_job_repository_impl.dart';

final postJobRemoteDataSourceProvider = Provider<PostJobRemoteDataSource>((ref) {
  return PostJobRemoteDataSource(ref.watch(apiClientProvider).dio);
});

final postJobRepositoryProvider = Provider<PostJobRepository>((ref) {
  return PostJobRepositoryImpl(ref.watch(postJobRemoteDataSourceProvider));
});

final myJobsProvider = FutureProvider<List<JobModel>>((ref) async {
  final repo = ref.watch(postJobRepositoryProvider);
  final result = await repo.getMyJobs();
  return result.match((failure) => throw failure, (jobs) => jobs);
});

final jobDetailsProvider = FutureProvider.autoDispose.family<JobModel, String>((ref, id) async {
  final repo = ref.watch(postJobRepositoryProvider);
  final result = await repo.getJobById(id);
  return result.match((failure) => throw failure, (job) => job);
});
