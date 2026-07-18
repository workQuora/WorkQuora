import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/auth_provider.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';

const _kGenders = ['MALE', 'FEMALE', 'OTHER'];

/// Matches the web app's Edit Profile fields (client app has no Bio/Skills —
/// those are freelancer-only). PUT /profile/update's accepted body
/// (Backend/src/controllers/profileController.js) is a flat top-level
/// {name, username, dateOfBirth, gender, city, address, ...} even though
/// city/address are stored nested under user.location server-side.
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});
  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  late final TextEditingController _nameCtrl;
  late final TextEditingController _usernameCtrl;
  late final TextEditingController _cityCtrl;
  late final TextEditingController _addressCtrl;
  late final String _originalUsername;
  DateTime? _dob;
  String? _gender;
  bool _saving = false;

  Timer? _usernameDebounce;
  // null = unchanged from original / not yet checked; true = available;
  // false = taken or invalid format.
  bool? _usernameAvailable;
  bool _checkingUsername = false;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user ?? {};
    _nameCtrl = TextEditingController(text: user['name']?.toString() ?? '');
    _originalUsername = (user['username'] ?? '').toString();
    _usernameCtrl = TextEditingController(text: _originalUsername);
    final location = user['location'] as Map?;
    _cityCtrl = TextEditingController(text: location?['city']?.toString() ?? '');
    _addressCtrl = TextEditingController(text: location?['address']?.toString() ?? '');
    _dob = DateTime.tryParse(user['dateOfBirth']?.toString() ?? '');
    final rawGender = user['gender']?.toString().toUpperCase();
    _gender = _kGenders.contains(rawGender) ? rawGender : null;
  }

  @override
  void dispose() {
    _usernameDebounce?.cancel();
    _nameCtrl.dispose();
    _usernameCtrl.dispose();
    _cityCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  void _onUsernameChanged(String value) {
    _usernameDebounce?.cancel();
    final trimmed = value.trim();
    if (trimmed.isEmpty || trimmed == _originalUsername) {
      setState(() {
        _usernameAvailable = null;
        _checkingUsername = false;
      });
      return;
    }
    setState(() => _checkingUsername = true);
    _usernameDebounce = Timer(const Duration(milliseconds: 500), () => _checkUsername(trimmed));
  }

  Future<void> _checkUsername(String username) async {
    try {
      final res = await DioClient.instance.dio.get(ApiConstants.checkUsername, queryParameters: {'username': username});
      // Discard a stale response if the field has moved on since this
      // request was fired (fast typer outrunning the debounce window).
      if (!mounted || _usernameCtrl.text.trim() != username) return;
      setState(() {
        _usernameAvailable = res.data['available'] == true;
        _checkingUsername = false;
      });
    } catch (_) {
      if (!mounted || _usernameCtrl.text.trim() != username) return;
      setState(() {
        _usernameAvailable = null;
        _checkingUsername = false;
      });
    }
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _dob ?? DateTime(now.year - 18, now.month, now.day),
      firstDate: DateTime(now.year - 100),
      lastDate: DateTime(now.year - 18, now.month, now.day),
      helpText: 'Select date of birth',
    );
    if (picked != null) setState(() => _dob = picked);
  }

  Future<void> _save() async {
    if (_usernameAvailable == false || _checkingUsername) return;
    setState(() => _saving = true);
    final data = <String, dynamic>{
      'name': _nameCtrl.text.trim(),
      'username': _usernameCtrl.text.trim(),
      'city': _cityCtrl.text.trim(),
      'address': _addressCtrl.text.trim(),
    };
    if (_dob != null) data['dateOfBirth'] = _dob!.toIso8601String();
    if (_gender != null) data['gender'] = _gender;
    final ok = await context.read<AuthProvider>().updateProfile(data);
    if (!mounted) return;
    setState(() => _saving = false);
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    if (ok) {
      context.pop();
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
    final usernameChanged = _usernameCtrl.text.trim().isNotEmpty && _usernameCtrl.text.trim() != _originalUsername;
    final canSave = !_saving && !_checkingUsername && _usernameAvailable != false;

    return Scaffold(
      appBar: AppBar(title: const Text('Edit Profile')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpace.xl),
          children: [
            Text('Full Name', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            TextField(controller: _nameCtrl, decoration: const InputDecoration(hintText: 'Full Name', prefixIcon: Icon(Icons.person_outline))),
            const SizedBox(height: AppSpace.lg),

            Text('Username', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            TextField(
              controller: _usernameCtrl,
              autocorrect: false,
              onChanged: _onUsernameChanged,
              decoration: InputDecoration(
                hintText: 'Username',
                prefixIcon: const Icon(Icons.alternate_email_rounded),
                suffixIcon: _checkingUsername
                    ? const Padding(padding: EdgeInsets.all(14), child: SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)))
                    : (usernameChanged && _usernameAvailable != null
                        ? Icon(_usernameAvailable! ? Icons.check_circle_rounded : Icons.cancel_rounded, color: _usernameAvailable! ? tokens.success : tokens.danger)
                        : null),
              ),
            ),
            if (usernameChanged && _usernameAvailable == false) ...[
              const SizedBox(height: 4),
              Text('Username is already taken', style: theme.textTheme.labelSmall?.copyWith(color: tokens.danger)),
            ],
            const SizedBox(height: AppSpace.lg),

            Text('Date of Birth', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            InkWell(
              onTap: _pickDob,
              borderRadius: BorderRadius.circular(AppRadius.button),
              child: InputDecorator(
                decoration: const InputDecoration(prefixIcon: Icon(Icons.cake_outlined)),
                child: Text(
                  _dob != null ? '${_dob!.day}/${_dob!.month}/${_dob!.year}' : 'Select date',
                  style: _dob != null ? theme.textTheme.bodyMedium : theme.textTheme.bodyMedium?.copyWith(color: tokens.muted),
                ),
              ),
            ),
            const SizedBox(height: AppSpace.lg),

            Text('Gender', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            Row(children: [
              Expanded(child: _GenderChip(label: 'Male', selected: _gender == 'MALE', onTap: () => setState(() => _gender = 'MALE'))),
              const SizedBox(width: AppSpace.sm),
              Expanded(child: _GenderChip(label: 'Female', selected: _gender == 'FEMALE', onTap: () => setState(() => _gender = 'FEMALE'))),
              const SizedBox(width: AppSpace.sm),
              Expanded(child: _GenderChip(label: 'Other', selected: _gender == 'OTHER', onTap: () => setState(() => _gender = 'OTHER'))),
            ]),
            const SizedBox(height: AppSpace.lg),

            Text('City', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            TextField(controller: _cityCtrl, decoration: const InputDecoration(hintText: 'City', prefixIcon: Icon(Icons.location_city_outlined))),
            const SizedBox(height: AppSpace.lg),

            Text('Address (optional)', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpace.sm),
            TextField(controller: _addressCtrl, maxLines: 2, decoration: const InputDecoration(hintText: 'Address', prefixIcon: Icon(Icons.home_outlined))),
            const SizedBox(height: AppSpace.xl),

            PrimaryButton(label: 'Save Changes', loading: _saving, onPressed: canSave ? _save : null),
          ],
        ),
      ),
    );
  }
}

class _GenderChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _GenderChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpace.sm),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected ? theme.colorScheme.primary : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppRadius.button),
          border: Border.all(color: selected ? theme.colorScheme.primary : tokens.border),
        ),
        child: Text(
          label,
          style: theme.textTheme.bodyMedium?.copyWith(color: selected ? Colors.white : theme.colorScheme.onSurface, fontWeight: selected ? FontWeight.bold : FontWeight.normal),
        ),
      ),
    );
  }
}
