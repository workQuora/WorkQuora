import 'dart:typed_data';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_cropper/image_cropper.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/providers/notifications_provider.dart';
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

  Future<void> _showPhotoOptions(String photoUrl) async {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    await showModalBottomSheet(
      context: context,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
      builder: (sheetContext) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: Icon(Icons.add_a_photo_outlined, color: theme.colorScheme.primary),
            title: Text(photoUrl.isEmpty ? 'Add Photo' : 'Change Photo'),
            onTap: () {
              Navigator.pop(sheetContext);
              _pickAndCropPhoto();
            },
          ),
          if (photoUrl.isNotEmpty) ...[
            ListTile(
              leading: Icon(Icons.visibility_outlined, color: theme.colorScheme.primary),
              title: const Text('View Photo'),
              onTap: () {
                Navigator.pop(sheetContext);
                _viewPhoto(photoUrl);
              },
            ),
            ListTile(
              leading: Icon(Icons.delete_outline_rounded, color: tokens.danger),
              title: Text('Remove Photo', style: TextStyle(color: tokens.danger)),
              onTap: () {
                Navigator.pop(sheetContext);
                _confirmRemovePhoto();
              },
            ),
          ],
          const SizedBox(height: AppSpace.sm),
        ]),
      ),
    );
  }

  Future<void> _pickAndCropPhoto() async {
    final image = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 90, maxWidth: 1600);
    if (image == null) return;
    if (!mounted) return;
    final theme = Theme.of(context);

    CroppedFile? cropped;
    try {
      cropped = await ImageCropper().cropImage(
        sourcePath: image.path,
        compressQuality: 85,
        uiSettings: [
          AndroidUiSettings(
            toolbarTitle: 'Adjust Photo',
            toolbarColor: theme.colorScheme.primary,
            toolbarWidgetColor: Colors.white,
            initAspectRatio: CropAspectRatioPreset.square,
            lockAspectRatio: true,
            cropStyle: CropStyle.circle,
          ),
          IOSUiSettings(title: 'Adjust Photo', aspectRatioLockEnabled: true, cropStyle: CropStyle.circle),
          WebUiSettings(context: context),
        ],
      );
    } catch (e) {
      if (mounted) _showSnack(kVerboseErrors ? ErrorHelper.debugDetail(e) : 'Could not open the crop editor', danger: true);
      return;
    }
    if (cropped == null) return; // user cancelled the crop step
    final bytes = await XFile(cropped.path).readAsBytes();
    await _uploadPhotoBytes(bytes, cropped.path.split('/').last);
  }

  Future<void> _uploadPhotoBytes(Uint8List bytes, String filename) async {
    setState(() => _uploadingPhoto = true);
    try {
      final formData = FormData.fromMap({'photo': MultipartFile.fromBytes(bytes, filename: filename)});
      final res = await DioClient.instance.dio.post(ApiConstants.profilePhoto, data: formData);
      final url = res.data['profilePic'] as String?;
      if (!mounted) return;
      if (url != null) {
        context.read<AuthProvider>().patchUser({'profilePic': url, 'avatar': url});
      }
    } catch (e) {
      if (mounted) {
        final message = kVerboseErrors ? ErrorHelper.debugDetail(e) : ErrorHelper.extractError(e);
        _showSnack(message, danger: true);
      }
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  void _viewPhoto(String url) {
    Navigator.of(context).push(MaterialPageRoute(
      builder: (_) => Scaffold(
        backgroundColor: Colors.black,
        appBar: AppBar(backgroundColor: Colors.black, iconTheme: const IconThemeData(color: Colors.white)),
        body: Center(child: InteractiveViewer(child: CachedNetworkImage(imageUrl: url, fit: BoxFit.contain))),
      ),
    ));
  }

  Future<void> _confirmRemovePhoto() async {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
        title: const Text('Remove photo?'),
        content: const Text('This removes your current profile photo.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: Text('Remove', style: TextStyle(color: tokens.danger))),
        ],
      ),
    );
    if (confirmed != true) return;
    setState(() => _uploadingPhoto = true);
    try {
      await DioClient.instance.dio.delete(ApiConstants.profilePhoto);
      if (!mounted) return;
      context.read<AuthProvider>().patchUser({'profilePic': null, 'avatar': null});
    } catch (e) {
      if (mounted) _showSnack(kVerboseErrors ? ErrorHelper.debugDetail(e) : ErrorHelper.extractError(e), danger: true);
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
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

  // No dedicated reviews-list screen exists — a lightweight in-place summary
  // of the rating already on the user document, rather than a new screen.
  void _showReviewsSummary(double rating, dynamic totalReviews) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
        title: const Text('Your Rating'),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            ...List.generate(5, (i) {
              final icon = i < rating.floor()
                  ? Icons.star_rounded
                  : (i < rating.ceil() && rating % 1 > 0)
                      ? Icons.star_half_rounded
                      : Icons.star_border_rounded;
              return Icon(icon, color: tokens.warning, size: 22);
            }),
          ]),
          const SizedBox(height: AppSpace.sm),
          Text('${rating.toStringAsFixed(1)} out of 5', style: theme.textTheme.titleMedium),
          const SizedBox(height: 4),
          Text('Based on $totalReviews review${totalReviews == 1 ? '' : 's'}', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
        ]),
        actions: [TextButton(onPressed: () => Navigator.of(dialogContext).pop(), child: const Text('Close'))],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final auth = context.watch<AuthProvider>();
    final user = auth.user ?? {};
    final name = user['name']?.toString() ?? 'User';
    final username = user['username']?.toString() ?? '';
    final email = user['email']?.toString() ?? '';
    final mobile = user['mobileNumber']?.toString() ?? '';
    final isEmailVerified = user['isEmailVerified'] == true;
    final isMobileVerified = user['isMobileVerified'] == true;
    final fullyVerified = isEmailVerified && isMobileVerified;
    final role = (user['role']?.toString() ?? 'CLIENT').toUpperCase();
    final roleLabel = role == 'FREELANCER' ? 'Freelancer' : 'Client';
    final rating = (user['averageRating'] ?? 0.0).toDouble();
    final totalReviews = user['totalReviews'] ?? 0;
    final photoUrl = (user['profilePic'] ?? user['avatar'] ?? '').toString();
    final memberSince = _memberSince(user['createdAt']);

    final activeJobCount = context.watch<JobsProvider>().myJobs.where((j) => j['status'] == 'in-progress').length;
    final unreadCount = context.select<NotificationsProvider, int>((p) => p.unreadCount);

    // Prompt for whichever verification is still missing (email first, since
    // the backend requires it before mobile can be verified at all).
    final unverifiedField = !isEmailVerified ? 'email' : (!isMobileVerified ? 'mobile' : null);

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
                  onTap: _uploadingPhoto ? null : () => _showPhotoOptions(photoUrl),
                  child: Stack(children: [
                    Container(
                      width: 104,
                      height: 104,
                      decoration: BoxDecoration(color: tokens.brandSoft, shape: BoxShape.circle, border: Border.all(color: theme.colorScheme.primary, width: 2.5)),
                      child: ClipOval(
                        child: _uploadingPhoto
                            ? Center(child: CircularProgressIndicator(color: theme.colorScheme.primary, strokeWidth: 2))
                            : (photoUrl.isNotEmpty
                                ? CachedNetworkImage(
                                    imageUrl: photoUrl,
                                    fit: BoxFit.cover,
                                    width: 104,
                                    height: 104,
                                    memCacheWidth: 312,
                                    memCacheHeight: 312,
                                    errorWidget: (_, __, ___) => Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: TextStyle(color: theme.colorScheme.primary, fontSize: 40, fontWeight: FontWeight.bold))),
                                  )
                                : Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: TextStyle(color: theme.colorScheme.primary, fontSize: 40, fontWeight: FontWeight.bold)))),
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: Container(
                        width: 30,
                        height: 30,
                        decoration: BoxDecoration(color: theme.colorScheme.primary, shape: BoxShape.circle, border: Border.all(color: theme.colorScheme.surface, width: 2)),
                        child: const Icon(Icons.camera_alt_rounded, color: Colors.white, size: 15),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: AppSpace.md),
                Row(mainAxisSize: MainAxisSize.min, children: [
                  Flexible(child: Text(name, style: theme.textTheme.headlineMedium, overflow: TextOverflow.ellipsis)),
                  if (fullyVerified) ...[
                    const SizedBox(width: AppSpace.xs),
                    Icon(Icons.verified_rounded, color: theme.colorScheme.primary, size: 20),
                  ],
                ]),
                if (username.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text('@$username', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
                ],
                const SizedBox(height: AppSpace.xs),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.md, vertical: 4),
                  decoration: BoxDecoration(color: tokens.chipBg, borderRadius: BorderRadius.circular(AppRadius.chip)),
                  child: Text(roleLabel, style: theme.textTheme.labelSmall?.copyWith(color: tokens.chipText, fontWeight: FontWeight.w700, letterSpacing: 0.5)),
                ),
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
                // Once both are verified, the badges collapse into the single
                // blue tick next to the name above — otherwise, a prominent
                // warning-colored button prompts for whichever is still
                // missing (email first, since the backend requires it before
                // mobile can be verified at all).
                Wrap(
                  alignment: WrapAlignment.center,
                  spacing: AppSpace.sm,
                  runSpacing: AppSpace.sm,
                  children: [
                    if (unverifiedField != null)
                      _QuickActionButton(
                        icon: Icons.error_outline_rounded,
                        label: 'Verify ${unverifiedField == 'email' ? 'Email' : 'Mobile'}',
                        color: tokens.warning,
                        loading: unverifiedField == 'email' ? _sendingEmailOtp : _sendingMobileOtp,
                        onTap: () {
                          final target = unverifiedField == 'email' ? email : mobile;
                          if (target.isEmpty) return;
                          _startVerify(unverifiedField, email);
                        },
                      ),
                    _QuickActionButton(
                      icon: Icons.edit_outlined,
                      label: 'Edit Profile',
                      color: theme.colorScheme.primary,
                      onTap: () => context.push('/edit-profile'),
                    ),
                    if (rating > 0)
                      _QuickActionButton(
                        icon: Icons.star_outline_rounded,
                        label: 'View Reviews',
                        color: tokens.success,
                        onTap: () => _showReviewsSummary(rating, totalReviews),
                      ),
                  ],
                ),
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

            // Sections
            _SectionRow(icon: Icons.edit_outlined, label: 'Edit Profile', onTap: () => context.push('/edit-profile')),
            const SizedBox(height: AppSpace.sm),
            _SectionRow(
              icon: Icons.work_outline_rounded,
              label: 'My Jobs',
              onTap: () => context.push('/my-jobs'),
              badgeText: activeJobCount > 0 ? '$activeJobCount ACTIVE' : null,
              badgeColor: tokens.success,
            ),
            const SizedBox(height: AppSpace.sm),
            _SectionRow(
              icon: Icons.notifications_outlined,
              label: 'Notifications',
              onTap: () => context.push('/notifications'),
              showDot: unreadCount > 0,
              dotColor: tokens.danger,
            ),
            const SizedBox(height: AppSpace.sm),
            _SectionRow(icon: Icons.settings_outlined, label: 'Settings', onTap: () => context.push('/settings')),
            const SizedBox(height: AppSpace.sm),
            _SectionRow(icon: Icons.description_outlined, label: 'Terms & Conditions', onTap: () => context.push('/terms')),
            const SizedBox(height: AppSpace.sm),
            _SectionRow(
              icon: Icons.logout_rounded,
              label: 'Logout',
              danger: true,
              onTap: () async {
                await auth.logout();
                if (context.mounted) context.go('/login');
              },
            ),
            const SizedBox(height: AppSpace.xl),
            Center(
              child: Text(
                'WorkQuora v1.2 • Secure & Encrypted Connection',
                style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted),
                textAlign: TextAlign.center,
              ),
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

class _QuickActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final bool loading;
  final VoidCallback? onTap;
  const _QuickActionButton({required this.icon, required this.label, required this.color, this.loading = false, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Material(
      color: color.withValues(alpha: 0.12),
      borderRadius: BorderRadius.circular(AppRadius.chip),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.chip),
        onTap: loading ? null : onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpace.md, vertical: AppSpace.sm),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            if (loading)
              SizedBox(width: 13, height: 13, child: CircularProgressIndicator(strokeWidth: 1.5, color: color))
            else
              Icon(icon, size: 15, color: color),
            const SizedBox(width: 6),
            Text(label, style: theme.textTheme.labelSmall?.copyWith(color: color, fontWeight: FontWeight.bold)),
          ]),
        ),
      ),
    );
  }
}

class _SectionRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final bool danger;
  final String? badgeText;
  final Color? badgeColor;
  final bool showDot;
  final Color? dotColor;
  const _SectionRow({
    required this.icon,
    required this.label,
    required this.onTap,
    this.danger = false,
    this.badgeText,
    this.badgeColor,
    this.showDot = false,
    this.dotColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final color = danger ? tokens.danger : theme.colorScheme.onSurface;

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: tokens.border, width: 0.5),
      ),
      clipBehavior: Clip.antiAlias,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpace.md, horizontal: AppSpace.md),
            child: Row(children: [
              Stack(clipBehavior: Clip.none, children: [
                Icon(icon, size: 20, color: danger ? tokens.danger : tokens.muted),
                if (showDot)
                  Positioned(
                    right: -2,
                    top: -2,
                    child: Container(width: 8, height: 8, decoration: BoxDecoration(color: dotColor ?? tokens.danger, shape: BoxShape.circle)),
                  ),
              ]),
              const SizedBox(width: AppSpace.md),
              Expanded(child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: color, fontWeight: danger ? FontWeight.w600 : FontWeight.normal))),
              if (badgeText != null) ...[
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.sm, vertical: 3),
                  decoration: BoxDecoration(color: (badgeColor ?? tokens.success).withValues(alpha: 0.15), borderRadius: BorderRadius.circular(AppRadius.chip)),
                  child: Text(badgeText!, style: theme.textTheme.labelSmall?.copyWith(color: badgeColor ?? tokens.success, fontWeight: FontWeight.bold, fontSize: 10)),
                ),
                const SizedBox(width: AppSpace.sm),
              ],
              if (!danger) Icon(Icons.chevron_right_rounded, color: tokens.muted, size: 20),
            ]),
          ),
        ),
      ),
    );
  }
}
