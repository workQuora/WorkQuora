import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:pinput/pinput.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/providers/theme_provider.dart';
import '../../core/utils/error_helper.dart';
import '../../core/utils/location_picker.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';
import 'profile_screen.dart' show EditProfileSheet;

// The 12 real categories on Backend/src/models/NotificationPreference.js,
// each with {email, sms, push, inApp} channels
// (Backend/src/controllers/settingsController.js). Only the push channel is
// exposed here — a 12x4 toggle grid would be unreadable on a phone — but
// the endpoint accepts partial per-channel updates, so email/sms/inApp can
// be added as rows later with no backend change.
const _kNotifCategories = [
  (key: 'jobs', icon: Icons.work_outline_rounded, label: 'Job Updates'),
  (key: 'proposals', icon: Icons.description_outlined, label: 'Proposals'),
  (key: 'messages', icon: Icons.chat_bubble_outline_rounded, label: 'Messages'),
  (key: 'chat', icon: Icons.forum_outlined, label: 'Chat'),
  (key: 'payments', icon: Icons.payments_outlined, label: 'Payments'),
  (key: 'wallet', icon: Icons.account_balance_wallet_outlined, label: 'Wallet Activity'),
  (key: 'escrow', icon: Icons.shield_outlined, label: 'Escrow Updates'),
  (key: 'security', icon: Icons.security_outlined, label: 'Security Alerts'),
  (key: 'systemUpdates', icon: Icons.system_update_outlined, label: 'System Updates'),
  (key: 'aiSuggestions', icon: Icons.auto_awesome_outlined, label: 'AI Suggestions'),
  (key: 'marketing', icon: Icons.campaign_outlined, label: 'Marketing'),
  (key: 'promotions', icon: Icons.local_offer_outlined, label: 'Promotions'),
];

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  final Set<String> _expanded = {'account'};

  bool _privacyLoaded = false;
  bool _showEmail = false;
  bool _showPhone = false;
  bool _showEarnings = false;
  String _profileVisibility = 'public';

  bool _notifPrefsLoaded = false;
  Map<String, dynamic> _notifPrefs = {};

  double _searchRadius = 25.0;

  @override
  void initState() {
    super.initState();
    _loadPrivacySettings();
    _loadNotificationPrefs();
  }

  void _showError(String message) {
    if (!mounted) return;
    final tokens = Theme.of(context).extension<AppTokens>()!;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: tokens.danger));
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

  Future<void> _updatePrivacy(Map<String, dynamic> updates) async {
    try {
      await DioClient.instance.dio.put(ApiConstants.privacySettings, data: updates);
    } catch (_) {
      _showError('Failed to save — try again');
    }
  }

  Future<void> _loadNotificationPrefs() async {
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.notificationPrefs);
      final data = Map<String, dynamic>.from(res.data['data'] ?? {});
      if (!mounted) return;
      setState(() {
        _notifPrefs = data;
        _notifPrefsLoaded = true;
      });
    } catch (_) {
      if (mounted) setState(() => _notifPrefsLoaded = true);
    }
  }

  bool _notifPush(String category) {
    final entry = _notifPrefs[category];
    if (entry is Map) return entry['push'] != false; // schema default is true
    return true;
  }

  Future<void> _updateNotifPref(String category, bool value) async {
    setState(() {
      final current = Map<String, dynamic>.from((_notifPrefs[category] as Map?) ?? {});
      current['push'] = value;
      _notifPrefs = {..._notifPrefs, category: current};
    });
    try {
      await DioClient.instance.dio.put(ApiConstants.notificationPrefs, data: {
        category: {'push': value},
      });
    } catch (_) {
      _showError('Failed to save — try again');
    }
  }

  bool _editProfileSheetOpen = false;

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

  bool _changePasswordSheetOpen = false;

  Future<void> _showChangePasswordSheet() async {
    if (_changePasswordSheetOpen) return;
    _changePasswordSheetOpen = true;
    final email = context.read<AuthProvider>().user?['email'] ?? '';
    final theme = Theme.of(context);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
      builder: (_) => _ChangePasswordSheet(email: email),
    );
    _changePasswordSheetOpen = false;
  }

  bool _changeContactSheetOpen = false;

  Future<void> _showChangeContactSheet({required bool isEmail}) async {
    if (_changeContactSheetOpen) return;
    _changeContactSheetOpen = true;
    final theme = Theme.of(context);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
      builder: (_) => _ChangeContactSheet(isEmail: isEmail),
    );
    _changeContactSheetOpen = false;
  }

  bool _sessionsSheetOpen = false;

  Future<void> _showSessionsSheet() async {
    if (_sessionsSheetOpen) return;
    _sessionsSheetOpen = true;
    final theme = Theme.of(context);
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
      builder: (_) => const _SessionsSheet(),
    );
    _sessionsSheetOpen = false;
  }

  bool _photoSheetOpen = false;
  bool _uploadingPhoto = false;

  Future<void> _changePhoto() async {
    if (_photoSheetOpen) return;
    _photoSheetOpen = true;
    final picker = ImagePicker();
    final theme = Theme.of(context);
    await showModalBottomSheet(
      context: context,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: Icon(Icons.camera_alt_rounded, color: theme.colorScheme.primary),
            title: const Text('Take Photo'),
            onTap: () async {
              Navigator.pop(context);
              await _uploadPhoto(await picker.pickImage(source: ImageSource.camera, imageQuality: 70, maxWidth: 800));
            },
          ),
          ListTile(
            leading: Icon(Icons.photo_library_rounded, color: theme.colorScheme.primary),
            title: const Text('Choose from Gallery'),
            onTap: () async {
              Navigator.pop(context);
              await _uploadPhoto(await picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 800));
            },
          ),
          const SizedBox(height: AppSpace.sm),
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
    setState(() => _uploadingPhoto = true);
    final bytes = await image.readAsBytes();
    try {
      final formData = FormData.fromMap({'photo': MultipartFile.fromBytes(bytes, filename: image.name)});
      final res = await DioClient.instance.dio.post(ApiConstants.profilePhoto, data: formData);
      final url = res.data['profilePic'] as String?;
      if (!mounted) return;
      if (url != null) {
        context.read<AuthProvider>().patchUser({'profilePic': url, 'avatar': url});
        final tokens = Theme.of(context).extension<AppTokens>()!;
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Photo updated'), backgroundColor: tokens.success));
      }
    } catch (e) {
      if (!mounted) return;
      _showError(ErrorHelper.extractError(e));
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

  Future<void> _showVisibilityDialog() async {
    final theme = Theme.of(context);
    final selected = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
        title: const Text('Profile Visibility'),
        content: RadioGroup<String>(
          groupValue: _profileVisibility,
          onChanged: (v) => Navigator.of(dialogContext).pop(v),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            RadioListTile<String>(
              value: 'public',
              activeColor: theme.colorScheme.primary,
              title: const Text('Public'),
              subtitle: const Text('Anyone can view your profile', style: TextStyle(fontSize: 11)),
            ),
            RadioListTile<String>(
              value: 'registered',
              activeColor: theme.colorScheme.primary,
              title: const Text('Registered Users Only'),
            ),
            RadioListTile<String>(
              value: 'private',
              activeColor: theme.colorScheme.primary,
              title: const Text('Private'),
            ),
          ]),
        ),
      ),
    );
    if (selected == null || selected == _profileVisibility || !mounted) return;
    setState(() => _profileVisibility = selected);
    _updatePrivacy({'profileVisibility': selected});
  }

  Future<void> _confirmLogout() async {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
        title: const Text('Logout?'),
        content: const Text('You will need to sign in again to continue.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: Text('Logout', style: TextStyle(color: tokens.warning, fontWeight: FontWeight.bold))),
        ],
      ),
    );
    if (confirmed != true || !mounted) return;
    await context.read<AuthProvider>().logout();
    if (!mounted) return;
    context.go('/login');
  }

  Future<void> _confirmLogoutAll() async {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
        title: const Text('Logout all devices?'),
        content: const Text('This will sign you out everywhere, including this device.'),
        actions: [
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
          TextButton(onPressed: () => Navigator.of(dialogContext).pop(true), child: Text('Logout All', style: TextStyle(color: tokens.danger, fontWeight: FontWeight.bold))),
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
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final controller = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) {
          final canDelete = controller.text == 'DELETE';
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
            title: Text('Delete Account', style: TextStyle(color: tokens.danger)),
            content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('This action cannot be undone. Type DELETE to confirm.', style: TextStyle(fontSize: 13)),
              const SizedBox(height: AppSpace.md),
              TextField(
                controller: controller,
                onChanged: (_) => setDialogState(() {}),
                decoration: const InputDecoration(hintText: 'DELETE'),
              ),
            ]),
            actions: [
              TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: Text('Cancel', style: TextStyle(color: tokens.muted))),
              TextButton(
                onPressed: canDelete ? () => Navigator.of(dialogContext).pop(true) : null,
                child: Text('Delete', style: TextStyle(color: canDelete ? tokens.danger : tokens.muted, fontWeight: FontWeight.bold)),
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
      _showError(ErrorHelper.extractError(e));
    }
  }

  Future<void> _launchLink(String url) async {
    final uri = Uri.parse(url);
    final ok = await launchUrl(uri, mode: LaunchMode.externalApplication);
    if (!ok && mounted) _showError('Could not open $url');
  }

  // ── Reusable pieces ──────────────────────────────────────────────

  Widget _sectionCard({
    required String id,
    required IconData icon,
    required String title,
    required List<Widget> children,
  }) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final isExpanded = _expanded.contains(id);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: AppSpace.xs),
      // Only the border lives on this outer decoration — a DecoratedBox with
      // a background color sitting between a ListTile and its nearest
      // Material ancestor hides the ListTile's ink splashes (Flutter flags
      // this at runtime). The actual surface color comes from the Material
      // below instead, which is also the correct ink/splash ancestor.
      decoration: BoxDecoration(borderRadius: BorderRadius.circular(AppRadius.card), border: Border.all(color: tokens.border, width: 0.5)),
      child: Material(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        clipBehavior: Clip.antiAlias,
        child: Column(children: [
          // Only the header toggles expand/collapse — wrapping the whole card
          // (including the tiles/switches/slider inside) would make every tap
          // on the content also risk collapsing the section.
          InkWell(
            borderRadius: BorderRadius.circular(AppRadius.card),
            onTap: () => setState(() {
              if (isExpanded) {
                _expanded.remove(id);
              } else {
                _expanded.add(id);
              }
            }),
            child: Padding(
              padding: const EdgeInsets.all(AppSpace.lg),
              child: Row(children: [
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(color: tokens.chipBg, borderRadius: BorderRadius.circular(AppRadius.button)),
                  child: Icon(icon, color: theme.colorScheme.primary, size: 20),
                ),
                const SizedBox(width: AppSpace.md),
                Expanded(child: Text(title, style: theme.textTheme.titleMedium)),
                AnimatedRotation(
                  turns: isExpanded ? 0.5 : 0,
                  duration: const Duration(milliseconds: 200),
                  child: Icon(Icons.keyboard_arrow_down_rounded, color: tokens.muted, size: 20),
                ),
              ]),
            ),
          ),
          AnimatedSize(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeInOut,
            child: isExpanded
                ? Column(children: [
                    Divider(color: tokens.border, height: 1),
                    ...children,
                    const SizedBox(height: AppSpace.sm),
                  ])
                : const SizedBox.shrink(),
          ),
        ]),
      ),
    );
  }

  Widget _tile(IconData icon, String title, {String? subtitle, Widget? trailing, Color? leadingColor, Color? titleColor, VoidCallback? onTap}) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: 2),
      leading: Icon(icon, color: leadingColor ?? tokens.muted, size: 20),
      title: Text(title, style: theme.textTheme.bodyMedium?.copyWith(color: titleColor)),
      subtitle: subtitle != null ? Text(subtitle, style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)) : null,
      trailing: trailing,
      onTap: onTap,
    );
  }

  Widget _toggle(IconData icon, String title, {String? subtitle, required bool value, required ValueChanged<bool> onChanged}) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
      secondary: Icon(icon, color: tokens.muted, size: 20),
      title: Text(title, style: theme.textTheme.bodyMedium),
      subtitle: subtitle != null ? Text(subtitle, style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted)) : null,
      value: value,
      onChanged: onChanged,
      activeThumbColor: theme.colorScheme.primary,
    );
  }

  Widget get _arrow => Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Theme.of(context).extension<AppTokens>()!.muted);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final auth = context.watch<AuthProvider>();
    final user = auth.user ?? {};
    final email = user['email']?.toString() ?? '';
    final mobile = user['mobileNumber']?.toString() ?? '';
    final themeProvider = context.watch<ThemeProvider>();

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        padding: const EdgeInsets.symmetric(vertical: AppSpace.md),
        children: [
          _sectionCard(id: 'account', icon: Icons.person_outline_rounded, title: 'Account', children: [
            _tile(Icons.edit_outlined, 'Edit Profile', subtitle: user['name']?.toString(), trailing: _arrow, onTap: _showEditProfileSheet),
            _tile(
              Icons.camera_alt_outlined,
              'Change Photo',
              trailing: _uploadingPhoto
                  ? SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Theme.of(context).colorScheme.primary))
                  : _arrow,
              onTap: _uploadingPhoto ? null : _changePhoto,
            ),
            _tile(Icons.email_outlined, 'Change Email', subtitle: email.isEmpty ? null : email, trailing: _arrow, onTap: () => _showChangeContactSheet(isEmail: true)),
            _tile(Icons.phone_outlined, 'Change Mobile', subtitle: mobile.isEmpty ? 'Not added' : mobile, trailing: _arrow, onTap: () => _showChangeContactSheet(isEmail: false)),
            _tile(Icons.lock_reset_outlined, 'Change Password', subtitle: 'Via OTP to your email', trailing: _arrow, onTap: _showChangePasswordSheet),
          ]),
          _sectionCard(id: 'privacy', icon: Icons.lock_outline_rounded, title: 'Privacy', children: [
            if (!_privacyLoaded)
              Padding(padding: const EdgeInsets.all(AppSpace.lg), child: Center(child: CircularProgressIndicator(color: theme.colorScheme.primary, strokeWidth: 2)))
            else ...[
              _toggle(Icons.email_outlined, 'Show Email', subtitle: 'Let others see your email', value: _showEmail, onChanged: (v) {
                setState(() => _showEmail = v);
                _updatePrivacy({'showEmail': v});
              }),
              _toggle(Icons.phone_outlined, 'Show Phone', subtitle: 'Let others see your mobile number', value: _showPhone, onChanged: (v) {
                setState(() => _showPhone = v);
                _updatePrivacy({'showPhone': v});
              }),
              _toggle(Icons.payments_outlined, 'Show Earnings', subtitle: 'Display your earnings publicly', value: _showEarnings, onChanged: (v) {
                setState(() => _showEarnings = v);
                _updatePrivacy({'showEarnings': v});
              }),
              _tile(
                Icons.visibility_outlined,
                'Profile Visibility',
                subtitle: _profileVisibility == 'public'
                    ? 'Public'
                    : _profileVisibility == 'registered'
                        ? 'Registered Users Only'
                        : 'Private',
                trailing: _arrow,
                onTap: _showVisibilityDialog,
              ),
            ],
          ]),
          _sectionCard(id: 'notifications', icon: Icons.notifications_outlined, title: 'Notifications', children: [
            if (!_notifPrefsLoaded)
              Padding(padding: const EdgeInsets.all(AppSpace.lg), child: Center(child: CircularProgressIndicator(color: theme.colorScheme.primary, strokeWidth: 2)))
            else
              for (final cat in _kNotifCategories)
                _toggle(cat.icon, cat.label, value: _notifPush(cat.key), onChanged: (v) => _updateNotifPref(cat.key, v)),
          ]),
          _sectionCard(id: 'location', icon: Icons.location_on_outlined, title: 'Location', children: [
            Consumer<JobsProvider>(builder: (ctx, jobs, _) {
              return Column(children: [
                _tile(Icons.my_location_rounded, 'Current Location', subtitle: jobs.locationLabel.isNotEmpty ? jobs.locationLabel : 'Not set', trailing: _arrow, onTap: () => showLocationPicker(context)),
                _tile(Icons.radar_rounded, 'Nearby Worker Search Radius', subtitle: '${_searchRadius.round()} km'),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.lg),
                  child: SliderTheme(
                    data: SliderTheme.of(context).copyWith(activeTrackColor: theme.colorScheme.primary, thumbColor: theme.colorScheme.primary, inactiveTrackColor: tokens.border),
                    child: Slider(
                      value: _searchRadius,
                      min: 5,
                      max: 50,
                      divisions: 9,
                      label: '${_searchRadius.round()} km',
                      onChanged: (v) => setState(() => _searchRadius = v),
                      onChangeEnd: (v) => jobs.fetchNearbyWorkers(radius: v.round()),
                    ),
                  ),
                ),
              ]);
            }),
          ]),
          _sectionCard(id: 'security', icon: Icons.security_outlined, title: 'Security', children: [
            _tile(Icons.devices_outlined, 'Active Sessions', subtitle: 'Manage devices signed in to your account', trailing: _arrow, onTap: _showSessionsSheet),
            _tile(Icons.logout_outlined, 'Logout All Devices', subtitle: 'Sign out from all sessions', trailing: _arrow, onTap: _confirmLogoutAll),
          ]),
          _sectionCard(id: 'preferences', icon: Icons.tune_rounded, title: 'App Preferences', children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(AppSpace.lg, AppSpace.sm, AppSpace.lg, AppSpace.md),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Theme', style: theme.textTheme.bodyMedium),
                const SizedBox(height: AppSpace.sm),
                Row(children: [
                  Expanded(child: _ThemeModeChip(mode: ThemeMode.light, current: themeProvider.mode, icon: Icons.light_mode_rounded, label: 'Light')),
                  const SizedBox(width: AppSpace.sm),
                  Expanded(child: _ThemeModeChip(mode: ThemeMode.dark, current: themeProvider.mode, icon: Icons.dark_mode_rounded, label: 'Dark')),
                  const SizedBox(width: AppSpace.sm),
                  Expanded(child: _ThemeModeChip(mode: ThemeMode.system, current: themeProvider.mode, icon: Icons.brightness_auto_rounded, label: 'System')),
                ]),
              ]),
            ),
          ]),
          _sectionCard(id: 'about', icon: Icons.info_outline_rounded, title: 'About', children: [
            _tile(Icons.info_outline_rounded, 'App Version', subtitle: 'WorkQuora v1.0.0'),
            _tile(Icons.description_outlined, 'Terms & Conditions', trailing: _arrow, onTap: () => context.push('/terms')),
            _tile(Icons.support_agent_outlined, 'Contact Support', subtitle: 'support@workquora.com', trailing: Icon(Icons.open_in_new_rounded, size: 14, color: tokens.muted), onTap: () => _launchLink('mailto:support@workquora.com')),
          ]),
          Container(
            margin: const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: AppSpace.xs),
            decoration: BoxDecoration(color: tokens.danger.withValues(alpha: 0.05), borderRadius: BorderRadius.circular(AppRadius.card), border: Border.all(color: tokens.danger.withValues(alpha: 0.3))),
            clipBehavior: Clip.antiAlias,
            child: Material(
              color: Colors.transparent,
              child: Column(children: [
                ListTile(
                  leading: Icon(Icons.logout_rounded, color: tokens.warning),
                  title: Text('Logout', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.warning)),
                  trailing: _arrow,
                  onTap: _confirmLogout,
                ),
                Divider(color: tokens.danger.withValues(alpha: 0.2), height: 1),
                ListTile(
                  leading: Icon(Icons.delete_forever_rounded, color: tokens.danger),
                  title: Text('Delete Account', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.danger)),
                  subtitle: Text('Permanently delete your data', style: theme.textTheme.labelSmall?.copyWith(color: tokens.danger)),
                  trailing: _arrow,
                  onTap: _confirmDeleteAccount,
                ),
              ]),
            ),
          ),
          const SizedBox(height: AppSpace.xl),
        ],
      ),
    );
  }
}

class _ThemeModeChip extends StatelessWidget {
  final ThemeMode mode;
  final ThemeMode current;
  final IconData icon;
  final String label;
  const _ThemeModeChip({required this.mode, required this.current, required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final selected = mode == current;

    return GestureDetector(
      onTap: () => context.read<ThemeProvider>().setMode(mode),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpace.sm),
        decoration: BoxDecoration(
          color: selected ? theme.colorScheme.primary : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppRadius.button),
          border: Border.all(color: selected ? theme.colorScheme.primary : tokens.border),
        ),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 18, color: selected ? Colors.white : tokens.muted),
          const SizedBox(height: 2),
          Text(label, style: theme.textTheme.labelSmall?.copyWith(color: selected ? Colors.white : tokens.muted, fontWeight: FontWeight.bold)),
        ]),
      ),
    );
  }
}

// Shared by "Change Email" and "Change Mobile" — identical idle → enter →
// otp flow (matching Frontend/src/pages/shared/settings/AccountSection.jsx),
// differing only in validation, endpoint, and payload field name.
class _ChangeContactSheet extends StatefulWidget {
  final bool isEmail;
  const _ChangeContactSheet({required this.isEmail});
  @override
  State<_ChangeContactSheet> createState() => _ChangeContactSheetState();
}

class _ChangeContactSheetState extends State<_ChangeContactSheet> {
  String _step = 'enter'; // 'enter' | 'otp'
  bool _loading = false;
  String? _error;
  final _valueCtrl = TextEditingController();
  final _otpCtrl = TextEditingController();

  @override
  void dispose() {
    _valueCtrl.dispose();
    _otpCtrl.dispose();
    super.dispose();
  }

  Future<void> _requestOtp() async {
    final value = _valueCtrl.text.trim();
    final valid = widget.isEmail ? RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value) : RegExp(r'^[6-9]\d{9}$').hasMatch(value);
    if (!valid) {
      setState(() => _error = widget.isEmail ? 'Enter a valid email' : 'Enter a valid 10-digit mobile number');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await DioClient.instance.dio.post(
        widget.isEmail ? ApiConstants.requestEmailChangeOtp : ApiConstants.requestMobileChangeOtp,
        data: widget.isEmail ? {'newEmail': value} : {'newMobile': value},
      );
      if (!mounted) return;
      setState(() {
        _step = 'otp';
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ErrorHelper.extractError(e);
      });
    }
  }

  Future<void> _verifyOtp() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    final value = _valueCtrl.text.trim();
    try {
      await DioClient.instance.dio.post(
        widget.isEmail ? ApiConstants.verifyEmailChange : ApiConstants.verifyMobileChange,
        data: widget.isEmail ? {'otp': _otpCtrl.text, 'newEmail': value} : {'otp': _otpCtrl.text, 'newMobile': value},
      );
      if (!mounted) return;
      context.read<AuthProvider>().patchUser(
            widget.isEmail ? {'email': value, 'isEmailVerified': true} : {'mobileNumber': value, 'isMobileVerified': true},
          );
      final tokens = Theme.of(context).extension<AppTokens>()!;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${widget.isEmail ? 'Email' : 'Mobile number'} updated'), backgroundColor: tokens.success));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ErrorHelper.extractError(e);
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final label = widget.isEmail ? 'Email' : 'Mobile Number';

    final defaultPinTheme = PinTheme(
      width: 44,
      height: 48,
      textStyle: theme.textTheme.titleMedium,
      decoration: BoxDecoration(color: theme.scaffoldBackgroundColor, borderRadius: BorderRadius.circular(AppRadius.button), border: Border.all(color: tokens.border)),
    );
    final focusedPinTheme = defaultPinTheme.copyWith(decoration: defaultPinTheme.decoration!.copyWith(border: Border.all(color: theme.colorScheme.primary, width: 2)));

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Padding(
        padding: const EdgeInsets.all(AppSpace.xl),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: AppSpace.lg),
          Text(_step == 'enter' ? 'Change $label' : 'Verify New $label', style: theme.textTheme.headlineMedium),
          const SizedBox(height: AppSpace.md),
          if (_error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpace.md),
              margin: const EdgeInsets.only(bottom: AppSpace.md),
              decoration: BoxDecoration(color: tokens.danger.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(AppRadius.button), border: Border.all(color: tokens.danger.withValues(alpha: 0.3))),
              child: Text(_error!, style: theme.textTheme.bodySmall?.copyWith(color: tokens.danger)),
            ),
          if (_step == 'enter') ...[
            Text('Enter your new $label — we\'ll send a code to confirm it.', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
            const SizedBox(height: AppSpace.lg),
            TextField(
              controller: _valueCtrl,
              keyboardType: widget.isEmail ? TextInputType.emailAddress : TextInputType.phone,
              decoration: InputDecoration(hintText: widget.isEmail ? 'new@email.com' : '10-digit mobile number', prefixIcon: Icon(widget.isEmail ? Icons.email_outlined : Icons.phone_outlined)),
            ),
            const SizedBox(height: AppSpace.xl),
            PrimaryButton(label: 'Send OTP', loading: _loading, onPressed: _requestOtp),
          ] else ...[
            Text('Enter the 6-digit code sent to your new $label', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
            const SizedBox(height: AppSpace.md),
            Center(child: Pinput(length: 6, controller: _otpCtrl, defaultPinTheme: defaultPinTheme, focusedPinTheme: focusedPinTheme)),
            const SizedBox(height: AppSpace.xl),
            PrimaryButton(label: 'Confirm', loading: _loading, onPressed: _verifyOtp),
            const SizedBox(height: AppSpace.sm),
            Center(child: TextButton(onPressed: _loading ? null : _requestOtp, child: Text('Resend OTP', style: TextStyle(color: theme.colorScheme.primary)))),
          ],
        ]),
      ),
    );
  }
}

class _SessionsSheet extends StatefulWidget {
  const _SessionsSheet();
  @override
  State<_SessionsSheet> createState() => _SessionsSheetState();
}

class _SessionsSheetState extends State<_SessionsSheet> {
  List<dynamic> _sessions = [];
  bool _loading = true;
  String? _error;
  String? _revokingId;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.sessions);
      _sessions = res.data['data'] as List? ?? [];
    } catch (e) {
      _error = ErrorHelper.extractError(e);
    }
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _revoke(String sessionId) async {
    setState(() => _revokingId = sessionId);
    try {
      await DioClient.instance.dio.delete('${ApiConstants.sessions}/$sessionId');
      if (!mounted) return;
      setState(() {
        _sessions = _sessions.where((s) => s['sessionId'] != sessionId).toList();
        _revokingId = null;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() => _revokingId = null);
      final tokens = Theme.of(context).extension<AppTokens>()!;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(ErrorHelper.extractError(e)), backgroundColor: tokens.danger));
    }
  }

  String _timeAgo(String? iso) {
    final dt = DateTime.tryParse(iso ?? '');
    if (dt == null) return '';
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    return DraggableScrollableSheet(
      initialChildSize: 0.6,
      maxChildSize: 0.9,
      minChildSize: 0.4,
      expand: false,
      builder: (ctx, scrollController) => Padding(
        padding: const EdgeInsets.all(AppSpace.xl),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: AppSpace.lg),
          Text('Active Sessions', style: theme.textTheme.headlineMedium),
          const SizedBox(height: 4),
          Text('Devices currently signed in to your account', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
          const SizedBox(height: AppSpace.lg),
          Expanded(
            child: _loading
                ? Center(child: CircularProgressIndicator(color: theme.colorScheme.primary))
                : _error != null
                    ? Center(
                        child: Column(mainAxisSize: MainAxisSize.min, children: [
                          Text(_error!, style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
                          const SizedBox(height: AppSpace.sm),
                          TextButton(onPressed: _load, child: Text('Retry', style: TextStyle(color: theme.colorScheme.primary))),
                        ]),
                      )
                    : ListView.separated(
                        controller: scrollController,
                        itemCount: _sessions.length,
                        separatorBuilder: (_, __) => const SizedBox(height: AppSpace.sm),
                        itemBuilder: (_, i) {
                          final s = _sessions[i];
                          final isCurrent = s['isCurrent'] == true;
                          final sessionId = s['sessionId']?.toString() ?? '';
                          final device = s['deviceName']?.toString() ?? s['operatingSystem']?.toString() ?? 'Unknown device';
                          final location = [s['city'], s['country']].where((v) => v != null && v.toString().isNotEmpty).join(', ');
                          final revoking = _revokingId == sessionId;

                          return Container(
                            padding: const EdgeInsets.all(AppSpace.md),
                            decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(AppRadius.card), border: Border.all(color: tokens.border, width: 0.5)),
                            child: Row(children: [
                              Icon(Icons.devices_rounded, color: isCurrent ? tokens.success : tokens.muted, size: 22),
                              const SizedBox(width: AppSpace.md),
                              Expanded(
                                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                  Text(device, style: theme.textTheme.bodyMedium),
                                  const SizedBox(height: 2),
                                  Text(
                                    [if (s['browser'] != null) s['browser'].toString(), if (location.isNotEmpty) location, _timeAgo(s['lastUsedAt']?.toString())].where((e) => e.isNotEmpty).join(' · '),
                                    style: theme.textTheme.labelSmall?.copyWith(color: tokens.muted),
                                  ),
                                ]),
                              ),
                              if (isCurrent)
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: AppSpace.sm, vertical: 4),
                                  decoration: BoxDecoration(color: tokens.success.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppRadius.chip)),
                                  child: Text('This device', style: theme.textTheme.labelSmall?.copyWith(color: tokens.success, fontWeight: FontWeight.bold)),
                                )
                              else
                                TextButton(
                                  onPressed: revoking || sessionId.isEmpty ? null : () => _revoke(sessionId),
                                  child: revoking
                                      ? SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: tokens.danger))
                                      : Text('Revoke', style: TextStyle(color: tokens.danger, fontWeight: FontWeight.bold)),
                                ),
                            ]),
                          );
                        },
                      ),
          ),
        ]),
      ),
    );
  }
}

class _ChangePasswordSheet extends StatefulWidget {
  final String email;
  const _ChangePasswordSheet({required this.email});
  @override
  State<_ChangePasswordSheet> createState() => _ChangePasswordSheetState();
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
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await DioClient.instance.dio.post(ApiConstants.forgotPassword, data: {'email': widget.email});
      if (!mounted) return;
      setState(() {
        _step = 2;
        _loading = false;
      });
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ErrorHelper.extractError(e);
      });
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
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await DioClient.instance.dio.post(ApiConstants.resetPassword, data: {
        'email': widget.email,
        'otp': _otpCtrl.text,
        'newPassword': _newPasswordCtrl.text,
      });
      if (!mounted) return;
      final tokens = Theme.of(context).extension<AppTokens>()!;
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: const Text('Password changed successfully!'), backgroundColor: tokens.success));
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = ErrorHelper.extractError(e);
      });
    }
  }

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

    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Padding(
        padding: const EdgeInsets.all(AppSpace.xl),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: AppSpace.lg),
          Text(_step == 1 ? 'Change Password' : 'Enter OTP & New Password', style: theme.textTheme.headlineMedium),
          const SizedBox(height: AppSpace.md),
          if (_error != null)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpace.md),
              margin: const EdgeInsets.only(bottom: AppSpace.md),
              decoration: BoxDecoration(color: tokens.danger.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(AppRadius.button), border: Border.all(color: tokens.danger.withValues(alpha: 0.3))),
              child: Text(_error!, style: theme.textTheme.bodySmall?.copyWith(color: tokens.danger)),
            ),
          if (_step == 1) ...[
            Text('We will send a one-time code to ${widget.email}', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
            const SizedBox(height: AppSpace.xl),
            PrimaryButton(label: 'Send OTP', loading: _loading, onPressed: _sendOtp),
          ] else ...[
            Text('Enter the 6-digit code sent to your email', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            Pinput(length: 6, controller: _otpCtrl, defaultPinTheme: defaultPinTheme, focusedPinTheme: focusedPinTheme),
            const SizedBox(height: AppSpace.lg),
            Text('New Password', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            TextField(
              controller: _newPasswordCtrl,
              obscureText: _obscureNew,
              decoration: InputDecoration(
                hintText: 'At least 8 characters',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(icon: Icon(_obscureNew ? Icons.visibility_outlined : Icons.visibility_off_outlined), onPressed: () => setState(() => _obscureNew = !_obscureNew)),
              ),
            ),
            const SizedBox(height: AppSpace.md),
            Text('Confirm New Password', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            TextField(
              controller: _confirmPasswordCtrl,
              obscureText: _obscureConfirm,
              decoration: InputDecoration(
                hintText: 'Re-enter new password',
                prefixIcon: const Icon(Icons.lock_outline),
                suffixIcon: IconButton(icon: Icon(_obscureConfirm ? Icons.visibility_outlined : Icons.visibility_off_outlined), onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm)),
              ),
            ),
            const SizedBox(height: AppSpace.xl),
            PrimaryButton(label: 'Change Password', loading: _loading, onPressed: _resetPassword),
            const SizedBox(height: AppSpace.sm),
            Center(child: TextButton(onPressed: _loading ? null : _sendOtp, child: Text('Resend OTP', style: TextStyle(color: theme.colorScheme.primary)))),
          ],
        ]),
      ),
    );
  }
}
