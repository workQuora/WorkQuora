import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../domain/repositories/talent_profile_repository.dart';
import '../datasources/talent_profile_remote_datasource.dart';
import '../models/review_model.dart';

class TalentProfileRepositoryImpl implements TalentProfileRepository {
  TalentProfileRepositoryImpl(this._remote);
  final TalentProfileRemoteDataSource _remote;

  @override
  Future<Either<AppFailure, TalentProfileBundle>> getProfileBundle(String userId) async {
    try {
      final profile = await _remote.getPublicProfile(userId);

      // Reviews are secondary — a reviews-endpoint hiccup shouldn't blank
      // out the whole profile screen, so it fails soft to an empty list.
      List<ReviewModel> reviews = const [];
      try {
        reviews = await _remote.getReviews(userId);
      } catch (_) {
        reviews = const [];
      }

      return Right(TalentProfileBundle(profile: profile, reviews: reviews));
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
        return Left(AppFailure.network());
      }
      if (e.response?.statusCode == 404) {
        return Left(AppFailure.fromMessage('This profile is no longer available.', statusCode: 404));
      }
      final message = (e.response?.data is Map) ? e.response?.data['message'] as String? : null;
      return Left(AppFailure.fromMessage(message ?? 'Could not load this profile.'));
    } catch (_) {
      return Left(AppFailure.fromMessage('Unexpected error loading profile.'));
    }
  }

  @override
  Future<Either<AppFailure, void>> submitReview({
    required String jobId,
    required String revieweeId,
    required int rating,
    required String comment,
  }) async {
    try {
      await _remote.submitReview(
        jobId: jobId,
        revieweeId: revieweeId,
        rating: rating,
        comment: comment,
      );
      return const Right(null);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
        return Left(AppFailure.network());
      }
      final message = (e.response?.data is Map) ? e.response?.data['message'] as String? : null;
      return Left(AppFailure.fromMessage(message ?? 'Could not submit review.'));
    } catch (_) {
      return Left(AppFailure.fromMessage('Unexpected error submitting review.'));
    }
  }
}
