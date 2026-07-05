import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/constants/app_colors.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/utils/location_picker.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

// XFile.path is a blob URL on web, not a real filesystem path, so dart:io's
// File/MultipartFile.fromFile can't be used here (compile error on web,
// UnsupportedError at runtime otherwise). Reading bytes once up front and
// using Image.memory / MultipartFile.fromBytes keeps preview + upload
// working identically on web and mobile.
class _PickedImage {
  final XFile file;
  final Uint8List bytes;
  _PickedImage(this.file, this.bytes);
}

class PostJobScreen extends StatefulWidget {
  const PostJobScreen({super.key});
  @override State<PostJobScreen> createState() => _PostJobScreenState();
}

class _PostJobScreenState extends State<PostJobScreen> {
  final _titleCtrl = TextEditingController();
  final _descCtrl  = TextEditingController();
  final _budgetCtrl= TextEditingController();
  String _category = 'Plumbing';
  String _budgetType = 'fixed';
  bool _loading = false;
  final _categories = ['Plumbing', 'Electrical', 'Painting', 'Carpentry', 'Cleaning', 'Gardening', 'IT Help', 'Other'];

  double? _jobLat;
  double? _jobLng;
  String _jobLocationLabel = '';

  final List<_PickedImage> _selectedImages = [];

  @override void dispose() { _titleCtrl.dispose(); _descCtrl.dispose(); _budgetCtrl.dispose(); super.dispose(); }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    await showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(16))),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: const Icon(Icons.camera_alt, color: AppColors.primary),
            title: const Text('Take Photo', style: TextStyle(color: AppColors.text)),
            onTap: () async {
              Navigator.pop(context);
              final image = await picker.pickImage(source: ImageSource.camera, imageQuality: 70, maxWidth: 1024);
              if (image != null) {
                final bytes = await image.readAsBytes();
                if (mounted) setState(() => _selectedImages.add(_PickedImage(image, bytes)));
              }
            },
          ),
          ListTile(
            leading: const Icon(Icons.photo_library, color: AppColors.primary),
            title: const Text('Choose from Gallery', style: TextStyle(color: AppColors.text)),
            onTap: () async {
              Navigator.pop(context);
              final image = await picker.pickImage(source: ImageSource.gallery, imageQuality: 70, maxWidth: 1024);
              if (image != null) {
                final bytes = await image.readAsBytes();
                if (mounted) setState(() => _selectedImages.add(_PickedImage(image, bytes)));
              }
            },
          ),
          const SizedBox(height: 8),
        ]),
      ),
    );
  }

  // Uploads each picked image to /jobs/upload-photo (Cloudinary-backed on the
  // backend) and returns the resulting URLs, in the order they were picked.
  Future<List<String>> _uploadImages() async {
    final urls = <String>[];
    for (final picked in _selectedImages) {
      final formData = FormData.fromMap({
        'photo': MultipartFile.fromBytes(picked.bytes, filename: picked.file.name),
      });
      final res = await DioClient.instance.dio.post(ApiConstants.uploadJobPhoto, data: formData);
      final url = res.data['url'] as String?;
      if (url != null) urls.add(url);
    }
    return urls;
  }

  Future<void> _submit() async {
    if (_titleCtrl.text.isEmpty || _budgetCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields'), backgroundColor: AppColors.error)); return;
    }
    setState(() => _loading = true);

    List<String> pictureUrls = [];
    if (_selectedImages.isNotEmpty) {
      try {
        pictureUrls = await _uploadImages();
      } catch (e) {
        if (!mounted) return;
        setState(() => _loading = false);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to upload photos. Try again.'), backgroundColor: AppColors.error));
        return;
      }
    }

    final newJobId = await context.read<JobsProvider>().postJob({
      'title': _titleCtrl.text, 'description': _descCtrl.text,
      'category': _category, 'budgetType': _budgetType,
      if (_budgetType == 'fixed') 'budget': double.tryParse(_budgetCtrl.text) ?? 0,
      if (_budgetType == 'hourly') 'minBudget': double.tryParse(_budgetCtrl.text) ?? 0,
      if (pictureUrls.isNotEmpty) 'pictures': pictureUrls,
      'location': (_jobLat != null && _jobLng != null)
          ? {
              'type': 'Point',
              'coordinates': [_jobLng, _jobLat],
              'address': _jobLocationLabel,
            }
          : {
              'type': 'Point',
              'coordinates': [77.2090, 28.6139],
              'address': 'India',
            },
    });
    if (!mounted) return;
    setState(() => _loading = false);
    if (newJobId != null) {
      _titleCtrl.clear(); _descCtrl.clear(); _budgetCtrl.clear();
      setState(() { _jobLat = null; _jobLng = null; _jobLocationLabel = ''; _selectedImages.clear(); });
      await showDialog(
        context: context,
        useRootNavigator: true, // explicit — dialog lives on the root navigator
        builder: (dialogContext) => AlertDialog(
          backgroundColor: AppColors.surface,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(children: [
            Icon(Icons.check_circle, color: AppColors.success, size: 28),
            SizedBox(width: 10),
            Text('Job Posted!', style: TextStyle(color: AppColors.text, fontSize: 18)),
          ]),
          content: const Text(
            'Your job has been posted successfully.\nFreelancers will start sending proposals soon.',
            style: TextStyle(color: AppColors.textMuted, fontSize: 13),
          ),
          actions: [TextButton(onPressed: () => Navigator.of(dialogContext).pop(), child: const Text('View Job', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold)))],
        ),
      );
      if (!mounted) return;
      context.push('/job/$newJobId');
    } else {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to post job'), backgroundColor: AppColors.error));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(title: const Text('Post a Job'), backgroundColor: AppColors.bg, elevation: 0),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.primary.withOpacity(0.2))),
            child: const Row(children: [Icon(Icons.bolt, color: AppColors.primary, size: 20), SizedBox(width: 10), Expanded(child: Text('Get bids from verified nearby workers within minutes!', style: TextStyle(color: AppColors.primary, fontSize: 13, fontWeight: FontWeight.w600)))])),
          const SizedBox(height: 24),
          const Text('Job Title *', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          AppTextField(controller: _titleCtrl, hint: 'e.g. Fix leaking pipe in bathroom', icon: Icons.work_outline),
          const SizedBox(height: 16),
          const Text('Category', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Container(padding: const EdgeInsets.symmetric(horizontal: 14), decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(14), border: Border.all(color: AppColors.border)),
            child: DropdownButton<String>(value: _category, isExpanded: true, dropdownColor: AppColors.surface, underline: const SizedBox(),
              style: const TextStyle(color: AppColors.text, fontSize: 14),
              onChanged: (v) => setState(() => _category = v!),
              items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList())),
          const SizedBox(height: 16),
          const Text('Description', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          AppTextField(controller: _descCtrl, hint: 'Describe the job in detail...', icon: Icons.description_outlined, maxLines: 4),
          const SizedBox(height: 16),
          const Text('Job Location', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          GestureDetector(
            onTap: () => showLocationPicker(context, onSelected: (lat, lng, label) {
              setState(() { _jobLat = lat; _jobLng = lng; _jobLocationLabel = label; });
            }),
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: _jobLocationLabel.isNotEmpty ? AppColors.primary : AppColors.border),
              ),
              child: Row(children: [
                Icon(Icons.location_on_outlined, color: _jobLocationLabel.isNotEmpty ? AppColors.primary : AppColors.textMuted, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    _jobLocationLabel.isNotEmpty ? _jobLocationLabel : 'Tap to set job location',
                    style: TextStyle(color: _jobLocationLabel.isNotEmpty ? AppColors.text : AppColors.textMuted, fontSize: 14),
                  ),
                ),
                if (_jobLocationLabel.isNotEmpty)
                  GestureDetector(
                    onTap: () => setState(() { _jobLat = null; _jobLng = null; _jobLocationLabel = ''; }),
                    child: const Icon(Icons.close, color: AppColors.textMuted, size: 16),
                  )
                else
                  const Icon(Icons.arrow_forward_ios, color: AppColors.textMuted, size: 14),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          const Text('Photos (Optional)', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 4),
          const Text('Add up to 3 photos of the job', style: TextStyle(color: AppColors.textMuted, fontSize: 12)),
          const SizedBox(height: 8),
          SizedBox(
            height: 80,
            child: ListView(scrollDirection: Axis.horizontal, children: [
              if (_selectedImages.length < 3)
                GestureDetector(
                  onTap: _pickImage,
                  child: Container(
                    width: 80, height: 80,
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.border)),
                    child: const Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(Icons.add_photo_alternate_outlined, color: AppColors.primary, size: 28),
                      SizedBox(height: 4),
                      Text('Add', style: TextStyle(color: AppColors.primary, fontSize: 11)),
                    ]),
                  ),
                ),
              ..._selectedImages.asMap().entries.map((entry) {
                final idx = entry.key;
                final image = entry.value;
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Stack(children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.memory(image.bytes, width: 80, height: 80, fit: BoxFit.cover),
                    ),
                    Positioned(
                      top: 4, right: 4,
                      child: GestureDetector(
                        onTap: () => setState(() => _selectedImages.removeAt(idx)),
                        child: Container(
                          width: 20, height: 20,
                          decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                          child: const Icon(Icons.close, color: Colors.white, size: 12),
                        ),
                      ),
                    ),
                  ]),
                );
              }),
            ]),
          ),
          const SizedBox(height: 16),
          const Text('Budget Type', style: TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(child: GestureDetector(onTap: () => setState(() => _budgetType = 'fixed'),
              child: Container(padding: const EdgeInsets.symmetric(vertical: 12), decoration: BoxDecoration(color: _budgetType == 'fixed' ? AppColors.primary : AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: _budgetType == 'fixed' ? AppColors.primary : AppColors.border)),
                child: Center(child: Text('Fixed Price', style: TextStyle(color: _budgetType == 'fixed' ? Colors.white : AppColors.textMuted, fontWeight: FontWeight.bold, fontSize: 13))))),
            ),
            const SizedBox(width: 12),
            Expanded(child: GestureDetector(onTap: () => setState(() => _budgetType = 'hourly'),
              child: Container(padding: const EdgeInsets.symmetric(vertical: 12), decoration: BoxDecoration(color: _budgetType == 'hourly' ? AppColors.primary : AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: _budgetType == 'hourly' ? AppColors.primary : AppColors.border)),
                child: Center(child: Text('Hourly Rate', style: TextStyle(color: _budgetType == 'hourly' ? Colors.white : AppColors.textMuted, fontWeight: FontWeight.bold, fontSize: 13))))),
            ),
          ]),
          const SizedBox(height: 16),
          Text('${_budgetType == 'fixed' ? 'Budget' : 'Hourly Rate'} (₹) *', style: const TextStyle(color: AppColors.textMuted, fontSize: 13, fontWeight: FontWeight.w600)),
          const SizedBox(height: 8),
          AppTextField(controller: _budgetCtrl, hint: 'e.g. 500', icon: Icons.currency_rupee, keyboardType: TextInputType.number),
          const SizedBox(height: 32),
          AppButton(label: 'Post Job', onPressed: _submit, loading: _loading),
          const SizedBox(height: 20),
        ]),
      ),
    );
  }
}
