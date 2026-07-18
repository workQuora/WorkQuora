import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/utils/error_helper.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';

const _kMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

void _shareProfile(BuildContext context, Map user) {
  final userId = user['_id'] ?? user['id'];
  final name = user['name'] ?? 'User';
  final shareText = '''
Check out $name's profile on WorkQuora! 🚀

Find skilled workers near you.
Profile: https://workquora.com/freelancer/$userId

Download WorkQuora: https://workquora.com
'''
      .trim();

  Share.share(shareText, subject: '$name on WorkQuora');
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Guards against a rapid double-tap calling showModalBottomSheet twice
  // before the first sheet's route has settled — a known source of
  // "GlobalKey was used multiple times" crashes in Flutter's Navigator.
  bool _editProfileSheetOpen = false;
  bool _uploadingPhoto = false;
  bool _sendingEmailOtp = false;
  bool _sendingMobileOtp = false;

  // Inline OTP verification — null when no verification is in progress,
  // otherwise 'email' or 'mobile' identifies which field's OTP box is open
  // right on this screen (no navigation to a separate OTP screen).
  String? _verifyingField;
  final _otpCtrl = TextEditingController();
  bool _submittingOtp = false;
  String? _otpError;

  @override
  void dispose() {
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _changePhoto() async {
    final image = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1024);
    if (image == null) return;
    setState(() => _uploadingPhoto = true);
    try {
      final bytes = await image.readAsBytes();
      final formData = FormData.fromMap({
        'photo': MultipartFile.fromBytes(bytes, filename: image.name),
      });
      final res = await DioClient.instance.dio.post(ApiConstants.profilePhoto, data: formData);
      final url = res.data['profilePic'] as String?;
      if (!mounted) return;
      if (url != null) {
        context.read<AuthProvider>().patchUser({'profilePic': url, 'avatar': url});
      }
    } catch (e) {
      if (mounted) {
        final tokens = Theme.of(context).extension<AppTokens>()!;
        final message = kVerboseErrors ? ErrorHelper.debugDetail(e) : ErrorHelper.extractError(e);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: tokens.danger));
      }
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  Future<void> _showEditProfileSheet() async {
    if (_editProfileSheetOpen) return;
    _editProfileSheetOpen = true;
    final theme = Theme.of(context);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
      builder: (_) => const EditProfileSheet(),
    );
    _editProfileSheetOpen = false;
  }

  Future<void> _startVerify(String field, String email) async {
    setState(() {
      if (field == 'email') {
        _sendingEmailOtp = true;
      } else {
        _sendingMobileOtp = true;
      }
    });
    final auth = context.read<AuthProvider>();
    final ok = field == 'email'
        ? await auth.resendEmailVerificationOtp(email)
        : await auth.sendMobileVerificationOtp(email);
    if (!mounted) return;
    setState(() {
      _sendingEmailOtp = false;
      _sendingMobileOtp = false;
      if (ok) {
        _verifyingField = field;
        _otpCtrl.clear();
        _otpError = null;
      }
    });
    if (!ok) _showSnack(auth.error ?? 'Could not send OTP. Try again.', danger: true);
  }

  Future<void> _submitOtp(String email) async {
    final field = _verifyingField;
    if (field == null) return;
    if (_otpCtrl.text.trim().length != 6) {
      setState(() => _otpError = 'Enter the 6-digit code');
      return;
    }
    setState(() { _submittingOtp = true; _otpError = null; });
    final auth = context.read<AuthProvider>();
    final ok = field == 'email'
        ? await auth.verifyEmailReverification(email, _otpCtrl.text.trim())
        : await auth.verifyMobileReverification(email, _otpCtrl.text.trim());
    if (!mounted) return;
    setState(() {
      _submittingOtp = false;
      if (ok) {
        _verifyingField = null;
        _otpCtrl.clear();
      } else {
        _otpError = auth.error ?? 'Invalid OTP';
      }
    });
    if (ok) _showSnack('${field == 'email' ? 'Email' : 'Mobile'} verified', danger: false);
  }

  void _cancelVerify() {
    setState(() { _verifyingField = null; _otpError = null; _otpCtrl.clear(); });
  }

  void _showSnack(String message, {required bool danger}) {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: danger ? tokens.danger : tokens.success));
  }

  String? _memberSince(dynamic iso) {
    final dt = DateTime.tryParse(iso?.toString() ?? '');
    if (dt == null) return null;
    return 'Member since ${_kMonths[dt.month - 1]} ${dt.year}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final auth = context.watch<AuthProvider>();
    final user = auth.user ?? {};
    final name = user['name']?.toString() ?? 'User';
    final email = user['email']?.toString() ?? '';
    final mobile = user['mobileNumber']?.toString() ?? '';
    final isEmailVerified = user['isEmailVerified'] == true;
    final isMobileVerified = user['isMobileVerified'] == true;
    final rating = (user['averageRating'] ?? 0.0).toDouble();
    final totalReviews = user['totalReviews'] ?? 0;
    final photoUrl = (user['profilePic'] ?? user['avatar'] ?? '').toString();
    final memberSince = _memberSince(user['createdAt']);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
        actions: [
          IconButton(icon: const Icon(Icons.share_outlined), onPressed: () => _shareProfile(context, user)),
        ],
      ),
      body: RefreshIndicator(
        color: theme.colorScheme.primary,
        backgroundColor: theme.colorScheme.surface,
        onRefresh: () => auth.refreshUser(),
        child: ListView(
        padding: const EdgeInsets.all(AppSpace.xl),
        children: [
          // Header
          Center(
            child: Column(children: [
              GestureDetector(
                onTap: _uploadingPhoto ? null : _changePhoto,
                child: Stack(children: [
                  Container(
                    width: 88,
                    height: 88,
                    decoration: BoxDecoration(color: tokens.brandSoft, shape: BoxShape.circle, border: Border.all(color: tokens.border, width: 0.5)),
                    child: ClipOval(
                      child: _uploadingPhoto
                          ? Center(child: CircularProgressIndicator(color: theme.colorScheme.primary, strokeWidth: 2))
                          : (photoUrl.isNotEmpty
                              ? CachedNetworkImage(
                                  imageUrl: photoUrl,
                                  fit: BoxFit.cover,
                                  width: 88,
                                  height: 88,
                                  memCacheWidth: 264,
                                  memCacheHeight: 264,
                                  errorWidget: (_, __, ___) => Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: TextStyle(color: theme.colorScheme.primary, fontSize: 36, fontWeight: FontWeight.bold))),
                                )
                              : Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: TextStyle(color: theme.colorScheme.primary, fontSize: 36, fontWeight: FontWeight.bold)))),
                    ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: Container(
                      width: 28,
                      height: 28,
                      decoration: BoxDecoration(color: theme.colorScheme.primary, shape: BoxShape.circle, border: Border.all(color: theme.colorScheme.surface, width: 2)),
                      child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 14),
                    ),
                  ),
                ]),
              ),
              const SizedBox(height: AppSpace.md),
              Text(name, style: theme.textTheme.headlineMedium),
              const SizedBox(height: 2),
              Text('Client', style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted, letterSpacing: 1)),
              const SizedBox(height: AppSpace.sm),
              if (rating > 0)
                Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                  ...List.generate(5, (i) {
                    final icon = i < rating.floor()
                        ? Icons.star_rounded
                        : (i < rating.ceil() && rating % 1 > 0)
                            ? Icons.star_half_rounded
                            : Icons.star_border_rounded;
                    return Icon(icon, color: tokens.warning, size: 16);
                  }),
                  const SizedBox(width: AppSpace.xs),
                  Text(rating.toStringAsFixed(1), style: theme.textTheme.bodySmall?.copyWith(fontWeight: FontWeight.bold)),
                  Text(' ($totalReviews reviews)', style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
                ])
              else
                Text('No ratings yet', style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
              if (memberSince != null) ...[
                const SizedBox(height: 4),
                Text(memberSince, style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)),
              ],
              const SizedBox(height: AppSpace.md),
              Wrap(spacing: AppSpace.sm, runSpacing: AppSpace.sm, alignment: WrapAlignment.center, children: [
                _VerifyBadge(label: 'Email', verified: isEmailVerified, loading: _sendingEmailOtp, onTap: email.isEmpty ? null : () => _startVerify('email', email)),
                _VerifyBadge(
                  label: 'Mobile',
                  verified: isMobileVerified,
                  loading: _sendingMobileOtp,
                  // Backend requires email verified before mobile can be —
                  // gated here so tapping doesn't send an OTP that's
                  // guaranteed to fail verification at the last step.
                  onTap: mobile.isEmpty || email.isEmpty
                      ? null
                      : (!isEmailVerified
                          ? () => _showSnack('Verify your email first', danger: true)
                          : () => _startVerify('mobile', email)),
                ),
              ]),
              if (_verifyingField != null) ...[
                const SizedBox(height: AppSpace.md),
                _InlineOtpBox(
                  label: _verifyingField == 'email' ? 'Email' : 'Mobile',
                  controller: _otpCtrl,
                  error: _otpError,
                  submitting: _submittingOtp,
                  onSubmit: () => _submitOtp(email),
                  onCancel: _cancelVerify,
                  onResend: () => _startVerify(_verifyingField!, email),
                ),
              ],
            ]),
          ),
          const SizedBox(height: AppSpace.xl),
          Divider(color: tokens.border, height: 1),
          const SizedBox(height: AppSpace.md),

          // Sections
          _SectionRow(icon: Icons.edit_outlined, label: 'Edit Profile', onTap: _showEditProfileSheet),
          _SectionRow(icon: Icons.work_outline_rounded, label: 'My Jobs', onTap: () => context.push('/my-jobs')),
          _SectionRow(icon: Icons.notifications_outlined, label: 'Notifications', onTap: () => context.push('/notifications')),
          _SectionRow(icon: Icons.settings_outlined, label: 'Settings', onTap: () => context.push('/settings')),
          _SectionRow(icon: Icons.description_outlined, label: 'Terms & Conditions', onTap: () => context.push('/terms')),
          const SizedBox(height: AppSpace.md),
          _SectionRow(
            icon: Icons.logout_rounded,
            label: 'Logout',
            danger: true,
            onTap: () async {
              await auth.logout();
              if (context.mounted) context.go('/login');
            },
          ),
        ],
        ),
      ),
    );
  }
}

class _InlineOtpBox extends StatelessWidget {
  final String label;
  final TextEditingController controller;
  final String? error;
  final bool submitting;
  final VoidCallback onSubmit;
  final VoidCallback onCancel;
  final VoidCallback onResend;
  const _InlineOtpBox({
    required this.label,
    required this.controller,
    required this.error,
    required this.submitting,
    required this.onSubmit,
    required this.onCancel,
    required this.onResend,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final defaultPinTheme = PinTheme(
      width: 44,
      height: 48,
      textStyle: theme.textTheme.titleMedium,
      decoration: BoxDecoration(color: theme.scaffoldBackgroundColor, borderRadius: BorderRadius.circular(AppRadius.button), border: Border.all(color: tokens.border)),
    );
    final focusedPinTheme = defaultPinTheme.copyWith(decoration: defaultPinTheme.decoration!.copyWith(border: Border.all(color: theme.colorScheme.primary, width: 2)));

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpace.md),
      decoration: BoxDecoration(color: tokens.brandSoft, borderRadius: BorderRadius.circular(AppRadius.card), border: Border.all(color: tokens.border, width: 0.5)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('Enter the 6-digit code sent for $label verification', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
        const SizedBox(height: AppSpace.sm),
        Center(child: Pinput(length: 6, controller: controller, defaultPinTheme: defaultPinTheme, focusedPinTheme: focusedPinTheme)),
        if (error != null) ...[
          const SizedBox(height: AppSpace.xs),
          Text(error!, style: theme.textTheme.labelSmall?.copyWith(color: tokens.danger)),
        ],
        const SizedBox(height: AppSpace.md),
        Row(children: [
          Expanded(child: PrimaryButton(label: 'Submit', loading: submitting, onPressed: onSubmit)),
          const SizedBox(width: AppSpace.sm),
          TextButton(onPressed: submitting ? null : onCancel, child: const Text('Cancel')),
        ]),
        Center(child: TextButton(onPressed: submitting ? null : onResend, child: Text('Resend code', style: TextStyle(color: theme.colorScheme.primary)))),
      ]),
    );
  }
}

class _VerifyBadge extends StatelessWidget {
  final String label;
  final bool verified;
  final bool loading;
  final VoidCallback? onTap;
  const _VerifyBadge({required this.label, required this.verified, required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final color = verified ? tokens.success : tokens.warning;

    return GestureDetector(
      onTap: verified ? null : (loading ? null : onTap),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: AppSpace.md, vertical: 6),
        decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppRadius.chip), border: Border.all(color: color.withValues(alpha: 0.3))),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          if (loading)
            SizedBox(width: 11, height: 11, child: CircularProgressIndicator(strokeWidth: 1.5, color: color))
          else
            Icon(verified ? Icons.check_circle_rounded : Icons.error_outline_rounded, size: 13, color: color),
          const SizedBox(width: 4),
          Text(
            verified ? '$label Verified' : (onTap == null ? '$label Unverified' : 'Verify $label'),
            style: theme.textTheme.labelSmall?.copyWith(color: color, fontWeight: FontWeight.bold),
          ),
        ]),
      ),
    );
  }
}

class _SectionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;
  const _SectionRow({required this.icon, required this.label, required this.onTap, this.danger = false});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final color = danger ? tokens.danger : theme.colorScheme.onSurface;

    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.button),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpace.md),
          child: Row(children: [
            Icon(icon, size: 20, color: danger ? tokens.danger : tokens.muted),
            const SizedBox(width: AppSpace.md),
            Expanded(child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: color, fontWeight: danger ? FontWeight.w600 : FontWeight.normal))),
            if (!danger) Icon(Icons.chevron_right_rounded, color: tokens.muted, size: 20),
          ]),
        ),
      ),
    );
  }
}

class EditProfileSheet extends StatefulWidget {
  const EditProfileSheet({super.key});
  @override
  State<EditProfileSheet> createState() => EditProfileSheetState();
}

class EditProfileSheetState extends State<EditProfileSheet> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _bioCtrl;
  late final TextEditingController _skillsCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user ?? {};
    _nameCtrl = TextEditingController(text: user['name'] ?? '');
    _bioCtrl = TextEditingController(text: user['bio'] ?? '');
    final skills = user['skills'];
    _skillsCtrl = TextEditingController(text: skills is List ? skills.join(', ') : '');
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _bioCtrl.dispose();
    _skillsCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    final skills = _skillsCtrl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList();
    final ok = await context.read<AuthProvider>().updateProfile({
      'name': _nameCtrl.text.trim(),
      'bio': _bioCtrl.text.trim(),
      'skills': skills,
    });
    if (!mounted) return;
    setState(() => _saving = false);
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Profile updated'), backgroundColor: tokens.success));
    } else {
      final err = context.read<AuthProvider>().error ?? 'Failed to update profile';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: tokens.danger));
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Padding(
        padding: const EdgeInsets.all(AppSpace.xl),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: AppSpace.lg),
          Text('Edit Profile', style: theme.textTheme.headlineMedium),
          const SizedBox(height: AppSpace.lg),
          TextField(controller: _nameCtrl, decoration: const InputDecoration(hintText: 'Full Name', prefixIcon: Icon(Icons.person_outline))),
          const SizedBox(height: AppSpace.md),
          TextField(controller: _bioCtrl, maxLines: 3, decoration: const InputDecoration(hintText: 'Bio', prefixIcon: Icon(Icons.info_outline))),
          const SizedBox(height: AppSpace.md),
          TextField(controller: _skillsCtrl, decoration: const InputDecoration(hintText: 'Skills (comma separated)', prefixIcon: Icon(Icons.star_outline))),
          const SizedBox(height: AppSpace.xl),
          PrimaryButton(label: 'Save Changes', loading: _saving, onPressed: _save),
          const SizedBox(height: AppSpace.sm),
        ]),
      ),
    );
  }
}
