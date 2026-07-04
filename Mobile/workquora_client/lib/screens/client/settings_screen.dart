import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});
  @override State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _privacyLoading = true;
  bool _showEmail = false;
  bool _showPhone = false;
  bool _showEarnings = false;

  bool _emailNotifs = true;
  bool _pushNotifs = true;

  @override
  void initState() {
    super.initState();
    _loadPrivacy();
    _loadLocalPrefs();
  }

  Future<void> _loadPrivacy() async {
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.privacySettings);
      final data = res.data['data'] ?? {};
      setState(() {
        _showEmail = data['showEmail'] == true;
        _showPhone = data['showPhone'] == true;
        _showEarnings = data['showEarnings'] == true;
        _privacyLoading = false;
      });
    } catch (_) {
      if (mounted) setState(() => _privacyLoading = false);
    }
  }

  Future<void> _loadLocalPrefs() async {
    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    setState(() {
      _emailNotifs = prefs.getBool('pref_email_notifs') ?? true;
      _pushNotifs = prefs.getBool('pref_push_notifs') ?? true;
    });
  }

  Future<void> _updatePrivacy(String field, bool value) async {
    setState(() {
      if (field == 'showEmail') _showEmail = value;
      if (field == 'showPhone') _showPhone = value;
      if (field == 'showEarnings') _showEarnings = value;
    });
    try {
      await DioClient.instance.dio.put(ApiConstants.privacySettings, data: {field: value});
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to save — try again'), backgroundColor: AppColors.error));
    }
  }

  Future<void> _setLocalPref(String key, bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(key, value);
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
            title: const Text('Delete Account', style: TextStyle(color: AppColors.error)),
            content: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('This action cannot be undone. Type DELETE to confirm.', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
              const SizedBox(height: 14),
              TextField(
                controller: controller,
                onChanged: (_) => setDialogState(() {}),
                style: const TextStyle(color: AppColors.text),
                decoration: InputDecoration(
                  hintText: 'DELETE',
                  hintStyle: const TextStyle(color: AppColors.textMuted),
                  filled: true,
                  fillColor: AppColors.bg,
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.border)),
                ),
              ),
            ]),
            actions: [
              TextButton(onPressed: () => Navigator.of(dialogContext).pop(false), child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted))),
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
      await DioClient.instance.dio.delete('/auth/account');
      if (!mounted) return;
      await context.read<AuthProvider>().logout();
      if (!mounted) return;
      context.go('/login');
    } catch (e) {
      if (!mounted) return;
      final msg = (e as dynamic).response?.data?['message'] ?? 'Failed to delete account';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg), backgroundColor: AppColors.error));
    }
  }

  Widget _sectionHeader(String label) => Padding(
    padding: const EdgeInsets.fromLTRB(16, 20, 16, 8),
    child: Text(label, style: const TextStyle(color: AppColors.textMuted, fontSize: 12, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
  );

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Settings'), backgroundColor: AppColors.bg, elevation: 0),
      body: ListView(
        children: [
          _sectionHeader('ACCOUNT'),
          ListTile(
            leading: const Icon(Icons.person_outline, color: AppColors.textMuted),
            title: const Text('Edit Profile', style: TextStyle(color: AppColors.text)),
            trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
            onTap: () => context.pop(),
          ),
          ListTile(
            leading: const Icon(Icons.lock_outline, color: AppColors.textMuted),
            title: const Text('Change Password', style: TextStyle(color: AppColors.text)),
            trailing: const Icon(Icons.chevron_right, color: AppColors.textMuted),
            onTap: () => showDialog(
              context: context,
              builder: (_) => AlertDialog(
                backgroundColor: AppColors.surface,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                title: const Text('Change Password', style: TextStyle(color: AppColors.text)),
                content: const Text(
                  "Use 'Forgot Password' on the login screen to reset your password.",
                  style: TextStyle(color: AppColors.textMuted),
                ),
                actions: [TextButton(onPressed: () => Navigator.of(context).pop(), child: const Text('OK', style: TextStyle(color: AppColors.primary)))],
              ),
            ),
          ),

          _sectionHeader('PRIVACY'),
          if (_privacyLoading)
            const Padding(padding: EdgeInsets.all(16), child: Center(child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 2)))
          else ...[
            SwitchListTile(
              activeThumbColor: AppColors.primary,
              title: const Text('Show Email', style: TextStyle(color: AppColors.text)),
              subtitle: const Text('Let others see your email on your profile', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
              value: _showEmail,
              onChanged: (v) => _updatePrivacy('showEmail', v),
            ),
            SwitchListTile(
              activeThumbColor: AppColors.primary,
              title: const Text('Show Phone', style: TextStyle(color: AppColors.text)),
              subtitle: const Text('Let others see your mobile number', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
              value: _showPhone,
              onChanged: (v) => _updatePrivacy('showPhone', v),
            ),
            SwitchListTile(
              activeThumbColor: AppColors.primary,
              title: const Text('Show Earnings', style: TextStyle(color: AppColors.text)),
              subtitle: const Text('Display your total earnings publicly', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
              value: _showEarnings,
              onChanged: (v) => _updatePrivacy('showEarnings', v),
            ),
          ],

          _sectionHeader('NOTIFICATIONS'),
          SwitchListTile(
            activeThumbColor: AppColors.primary,
            title: const Text('Email Notifications', style: TextStyle(color: AppColors.text)),
            subtitle: const Text('Preferences saved on this device', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            value: _emailNotifs,
            onChanged: (v) { setState(() => _emailNotifs = v); _setLocalPref('pref_email_notifs', v); },
          ),
          SwitchListTile(
            activeThumbColor: AppColors.primary,
            title: const Text('Push Notifications', style: TextStyle(color: AppColors.text)),
            subtitle: const Text('Preferences saved on this device', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            value: _pushNotifs,
            onChanged: (v) { setState(() => _pushNotifs = v); _setLocalPref('pref_push_notifs', v); },
          ),

          _sectionHeader('APPEARANCE'),
          const ListTile(
            leading: Icon(Icons.dark_mode_outlined, color: AppColors.textMuted),
            title: Text('Theme', style: TextStyle(color: AppColors.text)),
            subtitle: Text('Dark — light theme coming soon', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          ),

          _sectionHeader('DANGER ZONE'),
          ListTile(
            leading: const Icon(Icons.delete_outline, color: AppColors.error),
            title: const Text('Delete Account', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.bold)),
            subtitle: const Text('This action cannot be undone', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
            onTap: _confirmDeleteAccount,
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }
}
