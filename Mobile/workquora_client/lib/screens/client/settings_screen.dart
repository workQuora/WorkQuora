import 'dart:io' show Platform;
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_languages.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/providers/theme_provider.dart';
import '../../core/providers/wallet_provider.dart';
import '../../core/utils/error_helper.dart';
import '../../core/utils/location_picker.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';
import 'profile_screen.dart' show EditProfileSheet;

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final Set<String> _expanded = {'account'};

  bool _privacyLoaded = false;
  bool _showEmail = false;
  bool _showPhone = false;
  bool _showEarnings = false;
  String _profileVisibility = 'public';

  bool _emailNotifs = true;
  bool _smsAlerts = true;
  bool _jobAlerts = true;
  bool _paymentAlerts = true;
  bool _messageAlerts = true;

  double _searchRadius = 25.0;

  String _currentLanguage = 'en';

  @override
  void initState() {
    super.initState();
    _loadNotifPrefs();
    _loadPrivacySettings();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      context.read<WalletProvider>().fetchWallet();
    });
  }

  Future<void> _loadPrivacySettings() async {
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.privacySettings);
      final data = res.data['data'] ?? {};
      if (!mounted) return;
      setState(() {
        _showEmail = data['showEmail'] ?? false;
        _showPhone = data['showPhone'] ?? false;
        _showEarnings = data['showEarnings'] ?? false;
        _profileVisibility = data['profileVisibility'] ?? 'public';
        _privacyLoaded = true;
      });
    } catch (_) {
      if (mounted) setState(() => _privacyLoaded = true); // show toggles even if load fails
    }
  }

  Future<void> _loadNotifPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _emailNotifs = prefs.getBool('emailNotifs') ?? true;
      _smsAlerts = prefs.getBool('smsAlerts') ?? true;
      _jobAlerts = prefs.getBool('jobAlerts') ?? true;
      _paymentAlerts = prefs.getBool('paymentAlerts') ?? true;
      _messageAlerts = prefs.getBool('messageAlerts') ?? true;
      _currentLanguage = prefs.getString('app_language') ?? 'en';
    });
  }

  Future<void> _updatePrivacy(Map<String, dynamic> updates) async {
    try {
      await DioClient.instance.dio.put(ApiConstants.privacySettings, data: updates);
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to save — try again'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _saveNotifPref(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
  }

  bool _languagePickerOpen = false;

  Future<void> _showLanguagePicker() async {
    if (_languagePickerOpen) return;
    _languagePickerOpen = true;
    await showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (_) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        maxChildSize: 0.9,
        minChildSize: 0.5,
        expand: false,
        builder: (ctx, scrollController) => Column(children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2))),
          ),
          Text('Choose Language', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 4),
          Text('App text will display in your selected language', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 12),
          Expanded(
            child: Material(
              color: Colors.transparent,
              child: ListView.builder(
                controller: scrollController,
                itemCount: supportedLanguages.length,
                itemBuilder: (ctx, i) {
                  final lang = supportedLanguages[i];
                  final isSelected = _currentLanguage == lang.code;
                  return ListTile(
                    leading: Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: isSelected ? AppColors.primary.withOpacity(0.15) : AppColors.textMuted.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(child: Text(
                        lang.nativeName.characters.first,
                        style: TextStyle(color: isSelected ? AppColors.primary : AppColors.textMuted, fontSize: 16, fontWeight: FontWeight.bold),
                      )),
                    ),
                    title: Text(lang.nativeName, style: TextStyle(color: AppColors.text, fontSize: 15)),
                    subtitle: Text(lang.name, style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    trailing: isSelected ? Icon(Icons.check_circle, color: AppColors.primary, size: 22) : null,
                    onTap: () async {
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.setString('app_language', lang.code);
                      if (mounted) setState(() => _currentLanguage = lang.code);
                      if (ctx.mounted) Navigator.of(ctx).pop();
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text('Language set to ${lang.name}. Full translation coming in next update.'),
                        ));
                      }
                    },
                  );
                },
              ),
            ),
          ),
        ]),
      ),
    );
    _languagePickerOpen = false;
  }

  bool _editProfileSheetOpen = false;

  Future<void> _showEditProfileSheet() async {
    if (_editProfileSheetOpen) return;
    _editProfileSheetOpen = true;
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => const EditProfileSheet(),
    );
    _editProfileSheetOpen = false;
  }

  bool _changePasswordSheetOpen = false;

  Future<void> _showChangePasswordSheet() async {
    if (_changePasswordSheetOpen) return;
    _changePasswordSheetOpen = true;
    final email = context.read<AuthProvider>().user?['email'] ?? '';
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (_) => _ChangePasswordSheet(email: email),
    );
    _changePasswordSheetOpen = false;
  }

  bool _photoSheetOpen = false;

  Future<void> _changePhoto() async {
    if (_photoSheetOpen) return;
    _photoSheetOpen = true;
    final picker = ImagePicker();
    await showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: Icon(Icons.camera_alt, color: AppColors.primary),
            title: Text('Take Photo', style: TextStyle(color: AppColors.text)),
            onTap: () async { Navigator.pop(context); await _uploadPhoto(await picker.pickImage(source: ImageSource.camera, imageQuality: 70, maxWidth: 800)); },
          ),
          ListTile(
            leading: Icon(Icons.photo_library, color: AppColors.primary),
            title: Text('Choose from Gallery', style: TextStyle(color: AppColors.text)),
            onTap: () async { Navigator.pop(context); await _uploadPhoto(await picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 800)); },
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
    _photoSheetOpen = false;
  }

  // XFile.path is a blob URL on web, not a real filesystem path — reading
  // bytes up front keeps this working on both web and mobile (dart:io's
  // File/MultipartFile.fromFile do not work on web).
  Future<void> _uploadPhoto(XFile? image) async {
    if (image == null) return;
    final bytes = await image.readAsBytes();
    try {
      final formData = FormData.fromMap({'photo': MultipartFile.fromBytes(bytes, filename: image.name)});
      final res = await DioClient.instance.dio.post(ApiConstants.profilePhoto, data: formData);
      final url = res.data['profilePic'] as String?;
      if (!mounted) return;
      if (url != null) {
        context.read<AuthProvider>().patchUser({'profilePic': url, 'avatar': url});
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Photo updated'), backgroundColor: AppColors.success));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorHelper.extractError(e)), backgroundColor: AppColors.error));
    }
  }

  // Guards against a rapid double-tap on the tile calling showModalBottomSheet
  // twice before the first sheet's route has settled — a known source of
  // "GlobalKey was used multiple times" crashes in Flutter's Navigator.
  bool _pinSheetOpen = false;

  Future<void> _showSetPinSheet() async {
    if (_pinSheetOpen) return;
    _pinSheetOpen = true;
    final newPinCtrl = TextEditingController();
    final oldPinCtrl = TextEditingController();
    bool submitting = false;

    final defaultPinTheme = PinTheme(
      width: 44, height: 48,
      textStyle: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold),
      decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
    );
    final focusedPinTheme = defaultPinTheme.copyWith(
      decoration: defaultPinTheme.decoration!.copyWith(border: Border.all(color: AppColors.primary, width: 2)),
    );

    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (sheetContext) => StatefulBuilder(
        builder: (sheetContext, setSheetState) {
          Future<void> submit() async {
            setSheetState(() => submitting = true);
            try {
              await DioClient.instance.dio.post(ApiConstants.setWithdrawalPin, data: {
                'pin': newPinCtrl.text,
                if (oldPinCtrl.text.isNotEmpty) 'oldPin': oldPinCtrl.text,
              });
              if (sheetContext.mounted) Navigator.of(sheetContext).pop();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Withdrawal PIN set'), backgroundColor: AppColors.success));
              }
            } catch (e) {
              setSheetState(() => submitting = false);
              ScaffoldMessenger.of(sheetContext).showSnackBar(SnackBar(content: Text(ErrorHelper.extractError(e)), backgroundColor: AppColors.error));
            }
          }

          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(sheetContext).viewInsets.bottom),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Set Withdrawal PIN', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text('4-digit PIN used to confirm withdrawals', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
                const SizedBox(height: 20),
                Text('Current PIN (leave blank if none set yet)', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Pinput(length: 4, controller: oldPinCtrl, obscureText: true, defaultPinTheme: defaultPinTheme, focusedPinTheme: focusedPinTheme),
                const SizedBox(height: 20),
                Text('New PIN', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
                const SizedBox(height: 8),
                Pinput(length: 4, controller: newPinCtrl, obscureText: true, defaultPinTheme: defaultPinTheme, focusedPinTheme: focusedPinTheme),
                const SizedBox(height: 24),
                AppButton(label: 'Save PIN', loading: submitting, onPressed: submit),
                const SizedBox(height: 12),
              ]),
            ),
          );
        },
      ),
    );
    newPinCtrl.dispose();
    oldPinCtrl.dispose();
    _pinSheetOpen = false;
  }

  Future<void> _showVisibilityDialog() async {
    final selected = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Profile Visibility', style: TextStyle(color: AppColors.text)),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          RadioListTile<String>(value: 'public', groupValue: _profileVisibility, activeColor: AppColors.primary,
            title: Text('Public', style: TextStyle(color: AppColors.text)),
            subtitle: Text('Anyone can view your profile', style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
            onChanged: (v) => Navigator.of(dialogContext).pop(v)),
          RadioListTile<String>(value: 'registered', groupValue: _profileVisibility, activeColor: AppColors.primary,
            title: Text('Registered Users Only', style: TextStyle(color: AppColors.text)),
            onChanged: (v) => Navigator.of(dialogContext).pop(v)),
          RadioListTile<String>(value: 'private', groupValue: _profileVisibility, activeColor: AppColors.primary,
            title: Text('Private', style: TextStyle(color: AppColors.text)),
            onChanged: (v) => Navigator.of(dialogContext).pop(v)),
        ]),
      ),
    );
    if (selected == null || selected == _profileVisibility || !mounted) return;
    setState(() => _profileVisibility = selected);
    _updatePrivacy({'profileVisibility': selected});
  }

  Future<void> _confirmLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Logout?', style: TextStyle(color: AppColors.text)),
        content: Text('You will need to sign in again to continue.', style: TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: Text('Logout', style: TextStyle(color: AppColors.warning, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await context.read<AuthProvider>().logout();
    if (!mounted) return;
    context.go('/login');
  }

  Future<void> _confirmLogoutAll() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        backgroundColor: AppColors.surface,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Logout all devices?', style: TextStyle(color: AppColors.text)),
        content: Text('This will sign you out everywhere, including this device.', style: TextStyle(color: AppColors.textMuted)),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: Text('Logout All', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    try {
      await DioClient.instance.dio.post(ApiConstants.logoutAll);
    } catch (_) {
      // Best-effort — even if the server call fails, still clear the local session below.
    }
    if (!mounted) return;
    await context.read<AuthProvider>().logout();
    if (!mounted) return;
    context.go('/login');
  }

  Future<void> _confirmDeleteAccount() async {
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) {
          final canDelete = controller.text == 'DELETE';
          return AlertDialog(
            backgroundColor: AppColors.surface,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: Text('Delete Account', style: TextStyle(color: AppColors.error)),
            content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('This action cannot be undone. Type DELETE to confirm.', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
              const SizedBox(height: 14),
              TextField(
                controller: controller,
                onChanged: (_) => setDialogState(() {}),
                style: TextStyle(color: AppColors.text),
                decoration: InputDecoration(
                  hintText: 'DELETE',
                  hintStyle: TextStyle(color: AppColors.textMuted),
                  filled: true,
                  fillColor: AppColors.bg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.border)),
                ),
              ),
            ]),
            actions: [
              TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
              TextButton(
                onPressed: canDelete ? () => Navigator.of(dialogContext).pop(true) : null,
                child: Text('Delete', style: TextStyle(color: canDelete ? AppColors.error : AppColors.textMuted, fontWeight: FontWeight.bold)),
              ),
            ],
          );
        },
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      await DioClient.instance.dio.delete(ApiConstants.deleteAccount);
      if (!mounted) return;
      await context.read<AuthProvider>().logout();
      if (!mounted) return;
      context.go('/login');
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorHelper.extractError(e)), backgroundColor: AppColors.error));
    }
  }

  Future<void> _launchLink(String url) async {
    final uri = Uri.parse(url);
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Could not open $url'), backgroundColor: AppColors.error));
    }
  }

  // ── Reusable pieces ──────────────────────────────────────────────

  Widget _sectionCard({
    required String id,
    required IconData icon,
    required Color iconColor,
    required String title,
    required List<Widget> children,
  }) {
    final isExpanded = _expanded.contains(id);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      // Only the border lives on this outer decoration — a DecoratedBox with
      // a background color sitting between a ListTile and its nearest
      // Material ancestor hides the ListTile's ink splashes (Flutter flags
      // this at runtime). The actual surface color comes from the Material
      // below instead, which is also the correct ink/splash ancestor.
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
      child: Material(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          // Only the header toggles expand/collapse — wrapping the whole card
          // (including the tiles/switches/slider inside) would make every tap
          // on the content also risk collapsing the section.
          InkWell(
            borderRadius: BorderRadius.circular(16),
            onTap: () => setState(() {
              if (isExpanded) _expanded.remove(id); else _expanded.add(id);
            }),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(color: iconColor.withOpacity(0.12), borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, color: iconColor, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(child: Text(title, style: TextStyle(color: AppColors.text, fontWeight: FontWeight.w600, fontSize: 15))),
                AnimatedRotation(
                  turns: isExpanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.keyboard_arrow_down, color: AppColors.textMuted, size: 20),
                ),
              ]),
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            child: isExpanded
                ? Column(children: [
                    Divider(color: AppColors.border, height: 1),
                    ...children,
                    const SizedBox(height: 8),
                  ])
                : const SizedBox.shrink(),
          ),
        ]),
      ),
    );
  }

  Widget _tile(IconData icon, String title, {String? subtitle, Widget? trailing, Color? leadingColor, Color? titleColor, VoidCallback? onTap}) => ListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
    leading: Icon(icon, color: leadingColor ?? AppColors.textMuted, size: 20),
    title: Text(title, style: TextStyle(color: titleColor ?? AppColors.text, fontSize: 14)),
    subtitle: subtitle != null ? Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 12)) : null,
    trailing: trailing,
    onTap: onTap,
  );

  Widget _toggle(IconData icon, String title, {String? subtitle, required bool value, required ValueChanged<bool> onChanged}) => SwitchListTile(
    contentPadding: const EdgeInsets.symmetric(horizontal: 16),
    secondary: Icon(icon, color: AppColors.textMuted, size: 20),
    title: Text(title, style: TextStyle(color: AppColors.text, fontSize: 14)),
    subtitle: subtitle != null ? Text(subtitle, style: TextStyle(color: AppColors.textMuted, fontSize: 12)) : null,
    value: value,
    onChanged: onChanged,
    activeThumbColor: AppColors.primary,
  );

  Widget get _arrow => Icon(Icons.arrow_forward_ios, size: 14, color: AppColors.textMuted);

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user ?? {};
    final rating = (user['averageRating'] ?? 0.0).toDouble();
    final reviews = user['totalReviews'] ?? 0;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Settings'), backgroundColor: AppColors.bg, elevation: 0),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: 12),
        children: [
          _sectionCard(id: 'account', icon: Icons.person_outline, iconColor: AppColors.primary, title: 'Account', children: [
            _tile(Icons.edit_outlined, 'Edit Profile', subtitle: user['name'], trailing: _arrow, onTap: _showEditProfileSheet),
            _tile(Icons.camera_alt_outlined, 'Change Photo', trailing: _arrow, onTap: _changePhoto),
            _tile(Icons.star_outline, 'My Rating',
              subtitle: rating > 0 ? '${rating.toStringAsFixed(1)} ★  ($reviews reviews)' : 'No ratings yet',
              trailing: rating > 0
                  ? Text(rating.toStringAsFixed(1), style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold, fontSize: 18))
                  : null),
            _tile(Icons.lock_reset_outlined, 'Change Password', subtitle: 'Via OTP to your email', trailing: _arrow, onTap: _showChangePasswordSheet),
          ]),

          _sectionCard(id: 'privacy', icon: Icons.lock_outline, iconColor: AppColors.primary, title: 'Privacy', children: [
            if (!_privacyLoaded)
              Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)))
            else ...[
              _toggle(Icons.email_outlined, 'Show Email', subtitle: 'Let others see your email', value: _showEmail,
                onChanged: (v) { setState(() => _showEmail = v); _updatePrivacy({'showEmail': v}); }),
              _toggle(Icons.phone_outlined, 'Show Phone', subtitle: 'Let others see your mobile number', value: _showPhone,
                onChanged: (v) { setState(() => _showPhone = v); _updatePrivacy({'showPhone': v}); }),
              _toggle(Icons.payments_outlined, 'Show Earnings', subtitle: 'Display your earnings publicly', value: _showEarnings,
                onChanged: (v) { setState(() => _showEarnings = v); _updatePrivacy({'showEarnings': v}); }),
              _tile(Icons.visibility_outlined, 'Profile Visibility',
                subtitle: _profileVisibility == 'public' ? 'Public' : _profileVisibility == 'registered' ? 'Registered Users Only' : 'Private',
                trailing: _arrow, onTap: _showVisibilityDialog),
            ],
          ]),

          _sectionCard(id: 'notifications', icon: Icons.notifications_outlined, iconColor: AppColors.warning, title: 'Notifications', children: [
            Padding(padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
              child: Text('Preferences saved on this device', style: TextStyle(color: AppColors.textMuted.withOpacity(0.8), fontSize: 11))),
            _toggle(Icons.email_outlined, 'Email Notifications', value: _emailNotifs,
              onChanged: (v) { setState(() => _emailNotifs = v); _saveNotifPref('emailNotifs', v); }),
            _toggle(Icons.sms_outlined, 'SMS Alerts', value: _smsAlerts,
              onChanged: (v) { setState(() => _smsAlerts = v); _saveNotifPref('smsAlerts', v); }),
            _toggle(Icons.work_outline, 'Job Match Alerts', value: _jobAlerts,
              onChanged: (v) { setState(() => _jobAlerts = v); _saveNotifPref('jobAlerts', v); }),
            _toggle(Icons.payments_outlined, 'Payment Alerts', value: _paymentAlerts,
              onChanged: (v) { setState(() => _paymentAlerts = v); _saveNotifPref('paymentAlerts', v); }),
            _toggle(Icons.chat_outlined, 'Message Alerts', value: _messageAlerts,
              onChanged: (v) { setState(() => _messageAlerts = v); _saveNotifPref('messageAlerts', v); }),
          ]),

          _sectionCard(id: 'payments', icon: Icons.account_balance_wallet_outlined, iconColor: AppColors.emerald, title: 'Payments', children: [
            Consumer<WalletProvider>(builder: (ctx, wallet, _) => Column(children: [
              _tile(Icons.account_balance_wallet_outlined, 'Wallet Balance',
                subtitle: '₹${wallet.balance.toStringAsFixed(2)}',
                trailing: TextButton(onPressed: () => context.push('/wallet'), child: Text('Open', style: TextStyle(color: AppColors.primary)))),
              _tile(Icons.pin_outlined, 'Set Withdrawal PIN', subtitle: 'Secure your withdrawals', trailing: _arrow, onTap: _showSetPinSheet),
              _tile(Icons.history_outlined, 'Transaction History', trailing: _arrow, onTap: () => context.push('/wallet')),
            ])),
          ]),

          _sectionCard(id: 'location', icon: Icons.location_on_outlined, iconColor: AppColors.primary, title: 'Location', children: [
            Consumer<JobsProvider>(builder: (ctx, jobs, _) => Column(children: [
              _tile(Icons.my_location, 'Current Location',
                subtitle: jobs.locationLabel.isNotEmpty ? jobs.locationLabel : 'Not set',
                trailing: _arrow, onTap: () => showLocationPicker(context)),
              _tile(Icons.radar, 'Search Radius', subtitle: '${_searchRadius.round()} km'),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: SliderTheme(
                  data: SliderTheme.of(context).copyWith(
                    activeTrackColor: AppColors.primary,
                    thumbColor: AppColors.primary,
                    inactiveTrackColor: AppColors.border,
                  ),
                  child: Slider(
                    value: _searchRadius, min: 5, max: 50, divisions: 9,
                    label: '${_searchRadius.round()} km',
                    onChanged: (v) => setState(() => _searchRadius = v),
                    onChangeEnd: (v) => jobs.fetchNearbyWorkers(radius: v.round()),
                  ),
                ),
              ),
            ])),
          ]),

          _sectionCard(id: 'security', icon: Icons.security_outlined, iconColor: AppColors.error, title: 'Security', children: [
            _tile(Icons.devices_outlined, 'Current Session',
              subtitle: kIsWeb ? 'Web Browser · Active now' : Platform.isAndroid ? 'Android · Active now' : 'iOS · Active now',
              trailing: Container(width: 8, height: 8, decoration: BoxDecoration(color: AppColors.emerald, shape: BoxShape.circle))),
            _tile(Icons.logout_outlined, 'Logout All Devices', subtitle: 'Sign out from all sessions', trailing: _arrow, onTap: _confirmLogoutAll),
          ]),

          _sectionCard(id: 'preferences', icon: Icons.tune_outlined, iconColor: AppColors.textMuted, title: 'App Preferences', children: [
            Consumer<ThemeProvider>(builder: (ctx, theme, _) => _toggle(
              theme.isDarkMode ? Icons.dark_mode_outlined : Icons.light_mode_outlined,
              'Theme',
              subtitle: theme.isDarkMode ? 'Dark' : 'Light',
              value: theme.isDarkMode,
              onChanged: (v) => ctx.read<ThemeProvider>().setDarkMode(v),
            )),
            _tile(Icons.language_outlined, 'Language',
              subtitle: supportedLanguages.firstWhere((l) => l.code == _currentLanguage, orElse: () => supportedLanguages.first).name,
              trailing: _arrow,
              onTap: _showLanguagePicker),
          ]),

          _sectionCard(id: 'about', icon: Icons.info_outline, iconColor: AppColors.textMuted, title: 'About', children: [
            _tile(Icons.info_outline, 'App Version', subtitle: 'WorkQuora v1.0.0'),
            _tile(Icons.person_pin_outlined, 'Share My Profile', subtitle: 'Share your profile link',
              trailing: Icon(Icons.share_outlined, color: AppColors.textMuted, size: 18),
              onTap: () {
                final id = user['_id'] ?? user['id'];
                Share.share('Check out my profile on WorkQuora!\nhttps://workquora.com/freelancer/$id', subject: '${user['name']} on WorkQuora');
              }),
            _tile(Icons.description_outlined, 'Terms of Service',
              trailing: Icon(Icons.open_in_new, size: 14, color: AppColors.textMuted),
              onTap: () => _launchLink('https://workquora.com/info/terms')),
            _tile(Icons.privacy_tip_outlined, 'Privacy Policy',
              trailing: Icon(Icons.open_in_new, size: 14, color: AppColors.textMuted),
              onTap: () => _launchLink('https://workquora.com/info/privacy')),
            _tile(Icons.support_agent_outlined, 'Contact Support', subtitle: 'support@workquora.com',
              trailing: Icon(Icons.open_in_new, size: 14, color: AppColors.textMuted),
              onTap: () => _launchLink('mailto:support@workquora.com')),
          ]),

          Container(
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.error.withOpacity(0.05),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.error.withOpacity(0.3)),
            ),
            clipBehavior: Clip.antiAlias,
            child: Material(
              color: Colors.transparent,
              child: Column(children: [
                ListTile(
                  leading: Icon(Icons.logout, color: AppColors.warning),
                  title: Text('Logout', style: TextStyle(color: AppColors.warning, fontSize: 14)),
                  trailing: _arrow,
                  onTap: _confirmLogout,
                ),
                Divider(color: AppColors.error.withOpacity(0.2), height: 1),
                ListTile(
                  leading: Icon(Icons.delete_forever, color: AppColors.error),
                  title: Text('Delete Account', style: TextStyle(color: AppColors.error, fontSize: 14)),
                  subtitle: Text('Permanently delete your data', style: TextStyle(color: AppColors.error.withOpacity(0.7), fontSize: 11)),
                  trailing: _arrow,
                  onTap: _confirmDeleteAccount,
                ),
              ]),
            ),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  final String email;
  const _ChangePasswordSheet({required this.email});
  @override State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
}

class _ChangePasswordSheetState extends State<_ChangePasswordSheet> {
  int _step = 1;
  bool _loading = false;
  String? _error;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  final _otpCtrl = TextEditingController();
  final _newPasswordCtrl = TextEditingController();
  final _confirmPasswordCtrl = TextEditingController();

  @override
  void dispose() {
    _otpCtrl.dispose();
    _newPasswordCtrl.dispose();
    _confirmPasswordCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    setState(() { _loading = true; _error = null; });
    try {
      await DioClient.instance.dio.post(ApiConstants.forgotPassword, data: {'email': widget.email});
      if (!mounted) return;
      setState(() { _step = 2; _loading = false; });
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; _error = ErrorHelper.extractError(e); });
    }
  }

  Future<void> _resetPassword() async {
    if (_newPasswordCtrl.text.length < 8) {
      setState(() => _error = 'New password must be at least 8 characters');
      return;
    }
    if (_newPasswordCtrl.text != _confirmPasswordCtrl.text) {
      setState(() => _error = 'Passwords do not match');
      return;
    }
    setState(() { _loading = true; _error = null; });
    try {
      await DioClient.instance.dio.post(ApiConstants.resetPassword, data: {
        'email': widget.email,
        'otp': _otpCtrl.text,
        'newPassword': _newPasswordCtrl.text,
      });
      if (!mounted) return;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Password changed successfully!'), backgroundColor: AppColors.success));
    } catch (e) {
      if (!mounted) return;
      setState(() { _loading = false; _error = ErrorHelper.extractError(e); });
    }
  }

  @override
  Widget build(BuildContext context) {
    final defaultPinTheme = PinTheme(
      width: 44, height: 48,
      textStyle: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold),
      decoration: BoxDecoration(color: AppColors.bg, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.border)),
    );
    final focusedPinTheme = defaultPinTheme.copyWith(
      decoration: defaultPinTheme.decoration!.copyWith(border: Border.all(color: AppColors.primary, width: 2)),
    );

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 20),
          Text(_step == 1 ? 'Change Password' : 'Enter OTP & New Password', style: TextStyle(color: AppColors.text, fontSize: 18, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          if (_error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              margin: const EdgeInsets.only(bottom: 16),
              decoration: BoxDecoration(color: AppColors.error.withOpacity(0.1), borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.error.withOpacity(0.3))),
              child: Text(_error!, style: TextStyle(color: AppColors.error, fontSize: 13)),
            ),
          if (_step == 1) ...[
            Text('We will send a one-time code to ${widget.email}', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
            const SizedBox(height: 24),
            AppButton(label: 'Send OTP', loading: _loading, onPressed: _sendOtp),
          ] else ...[
            Text('Enter the 6-digit code sent to your email', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            Pinput(length: 6, controller: _otpCtrl, defaultPinTheme: defaultPinTheme, focusedPinTheme: focusedPinTheme),
            const SizedBox(height: 20),
            Text('New Password', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            AppTextField(
              controller: _newPasswordCtrl, hint: 'At least 8 characters', icon: Icons.lock_outline, obscure: _obscureNew,
              suffix: IconButton(
                icon: Icon(_obscureNew ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppColors.textMuted, size: 20),
                onPressed: () => setState(() => _obscureNew = !_obscureNew),
              ),
            ),
            const SizedBox(height: 12),
            Text('Confirm New Password', style: TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.w600)),
            const SizedBox(height: 8),
            AppTextField(
              controller: _confirmPasswordCtrl, hint: 'Re-enter new password', icon: Icons.lock_outline, obscure: _obscureConfirm,
              suffix: IconButton(
                icon: Icon(_obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined, color: AppColors.textMuted, size: 20),
                onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
              ),
            ),
            const SizedBox(height: 24),
            AppButton(label: 'Change Password', loading: _loading, onPressed: _resetPassword),
            const SizedBox(height: 8),
            Center(child: TextButton(
              onPressed: _loading ? null : _sendOtp,
              child: Text('Resend OTP', style: TextStyle(color: AppColors.primary)),
            )),
          ],
          const SizedBox(height: 12),
        ]),
      ),
    );
  }
}
