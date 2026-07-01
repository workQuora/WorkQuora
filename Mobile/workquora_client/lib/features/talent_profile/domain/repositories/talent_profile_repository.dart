import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../data/models/review_model.dart';
import '../../data/models/talent_profile_model.dart';

class TalentProfileBundle {
  const TalentProfileBundle({required this.profile, required this.reviews});
  final TalentProfileModel profile;
  final List<ReviewModel> reviews;
}

abstract class TalentProfileRepository {
  Future<Either<AppFailure, TalentProfileBundle>> getProfileBundle(String userId);
  Future<Either<AppFailure, void>> submitReview({
    required String jobId,
    required String revieweeId,
    required int rating,
    required String comment,
  });
}
