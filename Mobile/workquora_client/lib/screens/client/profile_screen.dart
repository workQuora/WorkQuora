import 'package:cached_network_image/cached_network_image.dart';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/auth_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

void _shareProfile(BuildContext context, Map user) {
  final userId = user['_id'] ?? user['id'];
  final name = user['name'] ?? 'User';
  final shareText = '''
Check out $name's profile on WorkQuora! 🚀

Find skilled workers near you.
Profile: https://workquora.com/freelancer/$userId

Download WorkQuora: https://workquora.com
'''.trim();

  Share.share(shareText, subject: '$name on WorkQuora');
}

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});
  @override State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  // Guards against a rapid double-tap calling showModalBottomSheet twice
  // before the first sheet's route has settled — a known source of
  // "GlobalKey was used multiple times" crashes in Flutter's Navigator.
  bool _editProfileSheetOpen = false;
  bool _uploadingPhoto = false;

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
    } catch (_) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to upload photo'), backgroundColor: AppColors.error));
    } finally {
      if (mounted) setState(() => _uploadingPhoto = false);
    }
  }

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

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final user = auth.user ?? {};
    final name = user['name'] ?? 'User';
    final email = user['email'] ?? '';
    final isEmail = user['isEmailVerified'] == true;
    final rating = (user['averageRating'] ?? 0.0).toDouble();
    final totalReviews = user['totalReviews'] ?? 0;
    final photoUrl = (user['profilePic'] ?? user['avatar'] ?? '').toString();

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: CustomScrollView(slivers: [
        SliverAppBar(
          backgroundColor: AppColors.bg, expandedHeight: 200, pinned: true,
          actions: [
            IconButton(
              icon: const Icon(Icons.share_outlined, color: Colors.white),
              onPressed: () => _shareProfile(context, user),
            ),
            IconButton(
              icon: const Icon(Icons.edit_outlined, color: Colors.white),
              onPressed: _showEditProfileSheet,
            ),
            IconButton(
              icon: const Icon(Icons.settings_outlined, color: Colors.white),
              onPressed: () => context.push('/settings'),
            ),
          ],
          flexibleSpace: FlexibleSpaceBar(
            background: Container(
              decoration: BoxDecoration(gradient: LinearGradient(colors: [AppColors.primary, Color(0xFF7C3AED), Color(0xFF06B6D4)], begin: Alignment.topLeft, end: Alignment.bottomRight)),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                const SizedBox(height: 40),
                GestureDetector(
                  onTap: _uploadingPhoto ? null : _changePhoto,
                  child: Stack(children: [
                    Container(
                      width: 80, height: 80,
                      decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), shape: BoxShape.circle, border: Border.all(color: Colors.white.withOpacity(0.4), width: 2)),
                      child: ClipOval(
                        child: _uploadingPhoto
                            ? const Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : (photoUrl.isNotEmpty
                                ? CachedNetworkImage(imageUrl: photoUrl, fit: BoxFit.cover, width: 80, height: 80,
                                    errorWidget: (_, __, ___) => Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold))))
                                : Center(child: Text(name.isNotEmpty ? name[0].toUpperCase() : 'U', style: const TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold)))),
                      ),
                    ),
                    Positioned(
                      bottom: 0, right: 0,
                      child: Container(
                        width: 26, height: 26,
                        decoration: BoxDecoration(color: AppColors.primary, shape: BoxShape.circle),
                        child: const Icon(Icons.camera_alt, color: Colors.white, size: 14),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(height: 10),
                Text(name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
                const SizedBox(height: 4),
                const Text('Client', style: TextStyle(color: Colors.white70, fontSize: 12, letterSpacing: 1)),
                const SizedBox(height: 6),
                if (rating > 0)
                  Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    ...List.generate(5, (i) {
                      final icon = i < rating.floor()
                          ? Icons.star
                          : (i < rating.ceil() && rating % 1 > 0)
                              ? Icons.star_half
                              : Icons.star_border;
                      return Icon(icon, color: Colors.amber, size: 14);
                    }),
                    const SizedBox(width: 6),
                    Text(rating.toStringAsFixed(1), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                    Text(' ($totalReviews reviews)', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                  ])
                else
                  const Text('No ratings yet', style: TextStyle(color: Colors.white70, fontSize: 11)),
              ]),
            ),
          ),
        ),
        SliverToBoxAdapter(child: Padding(padding: const EdgeInsets.all(20), child: Column(children: [
          Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            _badge(isEmail ? '✉ Email Verified' : '✉ Email Unverified', isEmail ? AppColors.emerald : AppColors.textMuted),
          ]),
          const SizedBox(height: 28),
          _tile(Icons.email_outlined, 'Email', email),
          _tile(Icons.phone_outlined, 'Mobile', user['mobileNumber'] ?? 'Not added'),
          _tile(Icons.badge_outlined, 'Username', '@${user['username'] ?? ''}'),
          const SizedBox(height: 28),
          AppButton(label: 'Logout', onPressed: () async { await auth.logout(); if (context.mounted) context.go('/login'); }, color: AppColors.error),
          const SizedBox(height: 20),
        ]))),
      ]),
    );
  }

  Widget _badge(String label, Color color) => Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
    decoration: BoxDecoration(color: color.withOpacity(0.12), borderRadius: BorderRadius.circular(20), border: Border.all(color: color.withOpacity(0.3))),
    child: Text(label, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.bold)));

  Widget _tile(IconData icon, String label, String value, {bool verified = false}) => Container(margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
    child: Row(children: [
      Icon(icon, color: AppColors.textMuted, size: 18), const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: TextStyle(color: AppColors.textMuted, fontSize: 11)),
        Row(mainAxisSize: MainAxisSize.min, children: [
          Text(value, style: TextStyle(color: AppColors.text, fontSize: 14, fontWeight: FontWeight.w600)),
          if (verified) ...[
            const SizedBox(width: 4),
            Icon(Icons.verified, color: AppColors.emerald, size: 16),
          ],
        ]),
      ])),
    ]));
}

class EditProfileSheet extends StatefulWidget {
  const EditProfileSheet();
  @override State<EditProfileSheet> createState() => EditProfileSheetState();
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
  void dispose() { _nameCtrl.dispose(); _bioCtrl.dispose(); _skillsCtrl.dispose(); super.dispose(); }

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
    if (ok) {
      Navigator.of(context).pop();
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Profile updated'), backgroundColor: AppColors.success));
    } else {
      final err = context.read<AuthProvider>().error ?? 'Failed to update profile';
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(err), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
          Center(child: Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.border, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 20),
          Text('Edit Profile', style: TextStyle(color: AppColors.text, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 20),
          AppTextField(controller: _nameCtrl, hint: 'Full Name', icon: Icons.person_outline),
          const SizedBox(height: 12),
          AppTextField(controller: _bioCtrl, hint: 'Bio', icon: Icons.info_outline, maxLines: 3),
          const SizedBox(height: 12),
          AppTextField(controller: _skillsCtrl, hint: 'Skills (comma separated)', icon: Icons.star_outline),
          const SizedBox(height: 24),
          AppButton(label: 'Save Changes', loading: _saving, onPressed: _save),
          const SizedBox(height: 12),
        ]),
      ),
    );
  }
}
