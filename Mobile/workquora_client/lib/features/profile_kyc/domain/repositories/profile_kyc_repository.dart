import 'dart:io';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../data/models/kyc_status_model.dart';
import '../../data/models/profile_model.dart';

abstract class ProfileRepository {
  Future<Either<AppFailure, ProfileModel>> getProfile();
  Future<Either<AppFailure, void>> updateProfile({
    String? name,
    String? bio,
    String? title,
    String? username,
    String? address,
    String? city,
  });
  Future<Either<AppFailure, String>> uploadPhoto(File file);
}

abstract class KycRepository {
  Future<Either<AppFailure, void>> sendOtp(String mobileNumber);
  Future<Either<AppFailure, void>> verifyOtp(String otp);
  Future<Either<AppFailure, void>> submitPan({required String panNumber, File? document});
  Future<Either<AppFailure, void>> submitAadhaar({required String aadhaarNumber, File? document});
  Future<Either<AppFailure, void>> submitBank({
    required String accountNumber,
    required String ifsc,
    required String holderName,
    String? pin,
    File? document,
  });
  Future<Either<AppFailure, void>> submitSelfie(File selfie);
  Future<Either<AppFailure, KycStatusModel>> getStatus();
}
