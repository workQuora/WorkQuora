import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../application/profile_controller.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _nameController;
  late final TextEditingController _usernameController;
  late final TextEditingController _contactPersonController;
  late final TextEditingController _emailController;
  late final TextEditingController _addressController;
  late final TextEditingController _websiteController;
  late final TextEditingController _bioController;

  String _selectedIndustry = 'Tech & Software';
  final List<String> _industries = [
    'Tech & Software',
    'Design & Creative',
    'Marketing & PR',
    'Writing & Translation',
    'Finance & Legal',
    'Data & Artificial Intelligence',
    'Other'
  ];

  bool _isSaving = false;
  String? _error;
  bool _initialized = false;

  @override
  void dispose() {
    if (_initialized) {
      _nameController.dispose();
      _usernameController.dispose();
      _contactPersonController.dispose();
      _emailController.dispose();
      _addressController.dispose();
      _websiteController.dispose();
      _bioController.dispose();
    }
    super.dispose();
  }

  Future<void> _pickAndUploadImage() async {
    final picker = ImagePicker();
    final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (image == null) return;

    setState(() {
      _isSaving = true;
      _error = null;
    });

    final failure = await ref.read(profileControllerProvider.notifier).uploadPhoto(File(image.path));
    if (!mounted) return;
    setState(() => _isSaving = false);

    if (failure != null) {
      setState(() => _error = failure.message);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(failure.message), backgroundColor: AppColors.error),
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile photo updated successfully!'), backgroundColor: AppColors.secondary),
      );
    }
  }

  Future<void> _save() async {
    setState(() {
      _isSaving = true;
      _error = null;
    });

    final failure = await ref.read(profileControllerProvider.notifier).updateProfile(
          name: _nameController.text.trim(),
          bio: _bioController.text.trim(),
          title: _selectedIndustry,
          username: _usernameController.text.trim(),
          address: _addressController.text.trim(),
          city: _contactPersonController.text.trim(), // Storing Contact Person/City in City field or other
        );

    if (!mounted) return;
    setState(() => _isSaving = false);

    if (failure != null) {
      setState(() => _error = failure.message);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile details saved successfully!'), backgroundColor: AppColors.secondary),
      );
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final profile = ref.watch(profileControllerProvider).valueOrNull;
    final textTheme = AppTypography.light;

    if (!_initialized && profile != null) {
      _nameController = TextEditingController(text: profile.name);
      _usernameController = TextEditingController(text: profile.username ?? '');
      _contactPersonController = TextEditingController(text: profile.title);
      _emailController = TextEditingController(text: profile.email);
      _addressController = TextEditingController(text: ''); // address is nested
      _websiteController = TextEditingController(text: '');
      _bioController = TextEditingController(text: profile.bio);
      
      if (_industries.contains(profile.title)) {
        _selectedIndustry = profile.title;
      }
      
      _initialized = true;
    }

    if (!_initialized) {
      return const Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    final clientShortId = profile != null && profile.id.length > 6
        ? profile.id.substring(profile.id.length - 6).toUpperCase()
        : 'XXXXXX';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Edit Profile',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.onSurface,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: TextButton(
              onPressed: _isSaving ? null : _save,
              child: _isSaving
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary))
                  : Text(
                      'Save',
                      style: textTheme.labelMedium?.copyWith(
                        color: AppColors.primary,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // 1. Profile Picture upload section with FAB
              Container(
                color: Colors.white,
                width: double.infinity,
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Column(
                  children: [
                    Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 104,
                          height: 104,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: AppColors.primary.withOpacity(0.1), width: 4),
                          ),
                          child: ClipOval(
                            child: CachedNetworkImage(
                              imageUrl: profile?.avatar ?? 'https://api.dicebear.com/7.x/initials/svg?seed=${profile?.name}',
                              width: 96,
                              height: 96,
                              fit: BoxFit.cover,
                              placeholder: (_, __) => Container(color: AppColors.surfaceContainer, width: 96, height: 96),
                              errorWidget: (_, __, ___) => const Icon(Icons.business_rounded, size: 48, color: AppColors.outline),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 0,
                          right: 0,
                          child: GestureDetector(
                            onTap: _pickAndUploadImage,
                            child: Container(
                              padding: const EdgeInsets.all(8),
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(
                                Icons.camera_alt_rounded,
                                size: 16,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      profile?.name ?? '',
                      style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Client ID: WQ-CLIENT-$clientShortId',
                      style: textTheme.labelSmall?.copyWith(color: AppColors.outline, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 12),

              // 2. Form Fields
              Padding(
                padding: const EdgeInsets.all(AppSpacing.containerMargin),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (_error != null) ...[
                      Container(
                        padding: const EdgeInsets.all(12),
                        width: double.infinity,
                        decoration: BoxDecoration(
                          color: AppColors.errorContainer.withOpacity(0.3),
                          borderRadius: AppRadius.lgR,
                          border: Border.all(color: AppColors.error.withOpacity(0.3)),
                        ),
                        child: Text(
                          _error!,
                          style: textTheme.bodyMedium?.copyWith(color: AppColors.error, fontWeight: FontWeight.w600),
                        ),
                      ),
                      const SizedBox(height: 16),
                    ],

                    _buildFieldLabel('Company Name'),
                    _buildTextField(
                      controller: _nameController,
                      hint: 'Acme Corp',
                      icon: Icons.business_rounded,
                    ),
                    const SizedBox(height: 16),

                    _buildFieldLabel('Username'),
                    _buildTextField(
                      controller: _usernameController,
                      hint: 'acme_corp',
                      icon: Icons.alternate_email_rounded,
                    ),
                    const SizedBox(height: 16),

                    _buildFieldLabel('Industry / Category'),
                    _buildDropdownField(),
                    const SizedBox(height: 16),

                    _buildFieldLabel('Contact Person'),
                    _buildTextField(
                      controller: _contactPersonController,
                      hint: 'Jane Doe',
                      icon: Icons.person_outline_rounded,
                    ),
                    const SizedBox(height: 16),

                    _buildFieldLabel('Contact Email'),
                    _buildTextField(
                      controller: _emailController,
                      hint: 'contact@acme.com',
                      icon: Icons.mail_outline_rounded,
                      keyboardType: TextInputType.emailAddress,
                      enabled: false, // Email is immutable as it is the login identifier
                    ),
                    const SizedBox(height: 16),

                    _buildFieldLabel('Business Address'),
                    _buildTextField(
                      controller: _addressController,
                      hint: '123 Business Park, Delhi',
                      icon: Icons.location_on_outlined,
                    ),
                    const SizedBox(height: 16),

                    _buildFieldLabel('Website'),
                    _buildTextField(
                      controller: _websiteController,
                      hint: 'https://acme.com',
                      icon: Icons.language_rounded,
                      keyboardType: TextInputType.url,
                    ),
                    const SizedBox(height: 16),

                    _buildFieldLabel('Bio / Company Description'),
                    _buildTextField(
                      controller: _bioController,
                      hint: 'Tell freelancers about your company missions and goals...',
                      icon: Icons.description_outlined,
                      maxLines: 4,
                    ),
                    const SizedBox(height: AppSpacing.stackLg),

                    // Actions Row
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                              side: BorderSide(color: AppColors.outlineVariant.withOpacity(0.6)),
                            ),
                            onPressed: () => Navigator.of(context).pop(),
                            child: Text(
                              'Cancel',
                              style: textTheme.labelMedium?.copyWith(
                                color: AppColors.onSurfaceVariant,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppColors.primary,
                              foregroundColor: AppColors.onPrimary,
                              padding: const EdgeInsets.symmetric(vertical: 14),
                              shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                              elevation: 0,
                            ),
                            onPressed: _isSaving ? null : _save,
                            child: Text(
                              'Save Changes',
                              style: textTheme.labelMedium?.copyWith(
                                color: AppColors.onPrimary,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 32),

                    // Footer
                    Center(
                      child: Text(
                        'Last updated: Just now',
                        style: textTheme.labelSmall?.copyWith(color: AppColors.outline, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildFieldLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0, left: 4.0),
      child: Text(
        label,
        style: AppTypography.light.labelSmall?.copyWith(
          color: AppColors.onSurfaceVariant,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    int maxLines = 1,
    TextInputType keyboardType = TextInputType.text,
    bool enabled = true,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: enabled ? Colors.white : AppColors.surfaceContainerLow,
        borderRadius: AppRadius.lgR,
        border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
      ),
      child: TextField(
        controller: controller,
        maxLines: maxLines,
        keyboardType: keyboardType,
        enabled: enabled,
        style: AppTypography.light.bodyMedium?.copyWith(
          color: enabled ? AppColors.onSurface : AppColors.outline,
        ),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: AppTypography.light.bodyMedium?.copyWith(color: AppColors.outline),
          prefixIcon: Icon(icon, color: enabled ? AppColors.primary : AppColors.outline, size: 20),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  Widget _buildDropdownField() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: AppRadius.lgR,
        border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
      ),
      child: Row(
        children: [
          const Icon(Icons.work_outline_rounded, color: AppColors.primary, size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedIndustry,
                style: AppTypography.light.bodyMedium?.copyWith(color: AppColors.onSurface),
                items: _industries.map((ind) {
                  return DropdownMenuItem<String>(
                    value: ind,
                    child: Text(ind),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() {
                      _selectedIndustry = val;
                    });
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}