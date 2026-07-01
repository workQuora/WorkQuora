/// Maps GET /profile/me. Uses `aadhaarVerified` (canonical, double-a) per
/// the established fix from this codebase's KYC field-typo bug — never the
/// `aadharVerified` (single-a) legacy alias.
///
/// NOTE: profileController.getProfile only echoes a reduced `kyc` object
/// ({status, aadhaarVerified, panVerified}) — it does NOT include
/// mobileVerified/bankVerified/selfieVerified. Those step flags only exist
/// on the full doc from GET /kyc/status (see KycStatusModel). Don't assume
/// this model has every KYC step flag.
class ProfileModel {
  const ProfileModel({
    required this.id,
    required this.name,
    required this.email,
    this.username,
    this.bio = '',
    this.title = '',
    this.avatar,
    this.mobileNumber,
    this.kycVerified = false,
    this.kycStatus = 'pending',
    this.panVerified = false,
    this.aadhaarVerified = false,
    this.twoFactorEnabled = false,
  });

  final String id;
  final String name;
  final String email;
  final String? username;
  final String bio;
  final String title;
  final String? avatar;
  final String? mobileNumber;
  final bool kycVerified;
  final String kycStatus;
  final bool panVerified;
  final bool aadhaarVerified;
  final bool twoFactorEnabled;

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    final kyc = json['kyc'] as Map<String, dynamic>?;
    return ProfileModel(
      id: (json['_id'] ?? json['id'] ?? '').toString(),
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      username: json['username'] as String?,
      bio: json['bio'] as String? ?? '',
      title: json['title'] as String? ?? '',
      avatar: json['avatar'] as String?,
      mobileNumber: json['mobileNumber'] as String?,
      kycVerified: json['kycVerified'] as bool? ?? false,
      kycStatus: kyc?['status'] as String? ?? 'pending',
      panVerified: kyc?['panVerified'] as bool? ?? false,
      aadhaarVerified: kyc?['aadhaarVerified'] as bool? ?? false,
      twoFactorEnabled: json['twoFactorEnabled'] as bool? ?? false,
    );
  }
}
