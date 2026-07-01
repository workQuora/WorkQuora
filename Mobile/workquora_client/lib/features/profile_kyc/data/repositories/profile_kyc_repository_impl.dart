import 'dart:io';
import 'package:dio/dio.dart';
import 'package:fpdart/fpdart.dart';
import '../../../../core/error/app_exception.dart';
import '../../domain/repositories/profile_kyc_repository.dart';
import '../datasources/kyc_remote_datasource.dart';
import '../datasources/profile_remote_datasource.dart';
import '../models/kyc_status_model.dart';
import '../models/profile_model.dart';

Future<Either<AppFailure, T>> _guard<T>(Future<T> Function() action) async {
  try {
    return Right(await action());
  } on DioException catch (e) {
    if (e.type == DioExceptionType.connectionError || e.type == DioExceptionType.connectionTimeout) {
      return Left(AppFailure.network());
    }
    final message = (e.response?.data is Map) ? e.response?.data['message'] as String? : null;
    return Left(AppFailure.fromMessage(message ?? 'Something went wrong.', statusCode: e.response?.statusCode));
  } catch (_) {
    return Left(AppFailure.fromMessage('Unexpected error.'));
  }
}

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._remote);
  final ProfileRemoteDataSource _remote;

  @override
  Future<Either<AppFailure, ProfileModel>> getProfile() => _guard(() => _remote.getProfile());

  @override
  Future<Either<AppFailure, void>> updateProfile({
    String? name,
    String? bio,
    String? title,
    String? username,
    String? address,
    String? city,
  }) =>
      _guard(() => _remote.updateProfile(
            name: name,
            bio: bio,
            title: title,
            username: username,
            address: address,
            city: city,
          ));

  @override
  Future<Either<AppFailure, String>> uploadPhoto(File file) =>
      _guard(() => _remote.uploadPhoto(file));
}

class KycRepositoryImpl implements KycRepository {
  KycRepositoryImpl(this._remote);
  final KycRemoteDataSource _remote;

  @override
  Future<Either<AppFailure, void>> sendOtp(String mobileNumber) => _guard(() => _remote.sendOtp(mobileNumber));

  @override
  Future<Either<AppFailure, void>> verifyOtp(String otp) => _guard(() => _remote.verifyOtp(otp));

  @override
  Future<Either<AppFailure, void>> submitPan({required String panNumber, File? document}) =>
      _guard(() => _remote.submitPan(panNumber: panNumber, document: document));

  @override
  Future<Either<AppFailure, void>> submitAadhaar({required String aadhaarNumber, File? document}) =>
      _guard(() => _remote.submitAadhaar(aadhaarNumber: aadhaarNumber, document: document));

  @override
  Future<Either<AppFailure, void>> submitBank({
    required String accountNumber,
    required String ifsc,
    required String holderName,
    String? pin,
    File? document,
  }) =>
      _guard(() => _remote.submitBank(
            accountNumber: accountNumber,
            ifsc: ifsc,
            holderName: holderName,
            pin: pin,
            document: document,
          ));

  @override
  Future<Either<AppFailure, void>> submitSelfie(File selfie) => _guard(() => _remote.submitSelfie(selfie));

  @override
  Future<Either<AppFailure, KycStatusModel>> getStatus() => _guard(() => _remote.getStatus());
}
