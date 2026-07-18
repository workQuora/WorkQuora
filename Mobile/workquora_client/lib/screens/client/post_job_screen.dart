import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/utils/location_picker.dart';
import '../../core/utils/mobile_location.dart' if (dart.library.html) '../../core/utils/web_location.dart';
import '../../core/utils/reverse_geocode.dart';
import '../../theme/app_theme.dart';
import '../../widgets/primary_button.dart';
import '../../widgets/verification_gate.dart';

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
  // Pre-selected from the Home category grid, if the client arrived here by
  // tapping a category rather than a plain "Post a Job" CTA.
  final String? initialCategory;
  const PostJobScreen({super.key, this.initialCategory});
  @override
  State<PostJobScreen> createState() => _PostJobScreenState();
}

class _PostJobScreenState extends State<PostJobScreen> {
  // Kept in sync with home_screen.dart's category grid.
  final _categories = ['Electrician', 'Plumber', 'AC Repair', 'Painter', 'Maid', 'Cook', 'Mechanic'];
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  late String _category;
  String _budgetType = 'fixed';
  bool _loading = false;

  // Auto-fetched on open — the fallback used at submit time if the client
  // clears/never sets a location manually. Never null-and-unset at submit.
  double? _autoLat;
  double? _autoLng;
  String _autoLabel = '';
  bool _locatingAuto = true;
  bool _locationPermissionDenied = false;

  // What's actually shown/edited in the form — starts equal to the
  // auto-fetched location once that resolves, but can diverge via manual pick.
  double? _jobLat;
  double? _jobLng;
  String _jobLocationLabel = '';

  final List<_PickedImage> _selectedImages = [];

  @override
  void initState() {
    super.initState();
    _category = _categories.contains(widget.initialCategory) ? widget.initialCategory! : _categories.first;
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchAutoLocation());
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _descCtrl.dispose();
    _budgetCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchAutoLocation() async {
    final pos = await getPlatformLocation();
    if (!mounted) return;
    if (pos == null) {
      // Permission denied / GPS off — degrade gracefully, don't crash. The
      // location field shows a "set manually" prompt instead.
      setState(() { _locationPermissionDenied = true; _locatingAuto = false; });
      return;
    }
    final label = await reverseGeocode(pos['lat']!, pos['lng']!) ?? 'Current location';
    if (!mounted) return;
    setState(() {
      _autoLat = pos['lat'];
      _autoLng = pos['lng'];
      _autoLabel = label;
      // Pre-fill the visible field with the auto-fetched location by
      // default — the client can still overwrite it with a manual pick.
      _jobLat ??= _autoLat;
      _jobLng ??= _autoLng;
      if (_jobLocationLabel.isEmpty) _jobLocationLabel = label;
      _locatingAuto = false;
    });
  }

  Future<void> _pickImage() async {
    final theme = Theme.of(context);
    final picker = ImagePicker();
    await showModalBottomSheet(
      context: context,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
      builder: (_) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          ListTile(
            leading: Icon(Icons.camera_alt, color: theme.colorScheme.primary),
            title: const Text('Take Photo'),
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
            leading: Icon(Icons.photo_library, color: theme.colorScheme.primary),
            title: const Text('Choose from Gallery'),
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

  // Uploads each picked image through the SAME Cloudinary-backed endpoint
  // already used elsewhere in the app (/jobs/upload-photo) — no new upload
  // route invented.
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

  void _showError(String message) {
    final tokens = Theme.of(context).extension<AppTokens>()!;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message), backgroundColor: tokens.danger));
  }

  Future<void> _submit() async {
    if (_titleCtrl.text.trim().isEmpty || _descCtrl.text.trim().isEmpty || _budgetCtrl.text.trim().isEmpty) {
      _showError('Please fill all required fields');
      return;
    }

    // Fall back to the auto-fetched location if the client cleared/never set
    // one manually — never submit with an empty location.
    final lat = _jobLat ?? _autoLat;
    final lng = _jobLng ?? _autoLng;
    final label = _jobLocationLabel.isNotEmpty ? _jobLocationLabel : _autoLabel;
    if (lat == null || lng == null) {
      _showError('Please set a job location — tap the location field to set it manually.');
      return;
    }

    setState(() => _loading = true);

    List<String> pictureUrls = [];
    if (_selectedImages.isNotEmpty) {
      try {
        pictureUrls = await _uploadImages();
      } catch (e) {
        if (!mounted) return;
        setState(() => _loading = false);
        _showError('Failed to upload photos. Try again.');
        return;
      }
    }

    if (!mounted) return;
    final jobsProvider = context.read<JobsProvider>();
    final newJobId = await jobsProvider.postJob({
      'title': _titleCtrl.text.trim(),
      'description': _descCtrl.text.trim(),
      'category': _category,
      'budgetType': _budgetType,
      if (_budgetType == 'fixed') 'budget': double.tryParse(_budgetCtrl.text) ?? 0,
      if (_budgetType == 'hourly') 'minBudget': double.tryParse(_budgetCtrl.text) ?? 0,
      if (pictureUrls.isNotEmpty) 'pictures': pictureUrls,
      'location': {
        'type': 'Point',
        'coordinates': [lng, lat],
        'address': label,
      },
    });
    if (!mounted) return;
    setState(() => _loading = false);
    if (newJobId != null) {
      _titleCtrl.clear();
      _descCtrl.clear();
      _budgetCtrl.clear();
      setState(() {
        _jobLat = _autoLat;
        _jobLng = _autoLng;
        _jobLocationLabel = _autoLabel;
        _selectedImages.clear();
      });
      if (!mounted) return;
      final theme = Theme.of(context);
      final tokens = theme.extension<AppTokens>()!;
      await showDialog(
        context: context,
        useRootNavigator: true, // explicit — dialog lives on the root navigator
        builder: (dialogContext) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.card)),
          title: Row(children: [
            Icon(Icons.check_circle, color: tokens.success, size: 28),
            const SizedBox(width: AppSpace.sm),
            const Expanded(child: Text('Job posted!')),
          ]),
          content: const Text('Your job has been posted successfully.\nFreelancers will start sending proposals soon.'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(dialogContext).pop(),
              child: Text('View Job', style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      );
      if (!mounted) return;
      context.push('/job/$newJobId');
    } else {
      _showError(jobsProvider.error ?? 'Failed to post job. Please check your details and try again.');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Post a Job')),
      body: VerificationGate(child: _buildForm(context)),
    );
  }

  Widget _buildForm(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpace.xl),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpace.lg),
            decoration: BoxDecoration(
              color: tokens.brandSoft,
              borderRadius: BorderRadius.circular(AppRadius.card),
              border: Border.all(color: theme.colorScheme.primary.withValues(alpha: 0.2)),
            ),
            child: Row(children: [
              Icon(Icons.bolt, color: theme.colorScheme.primary, size: 20),
              const SizedBox(width: AppSpace.sm),
              Expanded(
                child: Text(
                  'Get bids from verified nearby workers within minutes!',
                  style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.w600),
                ),
              ),
            ]),
          ),
          const SizedBox(height: AppSpace.xl),
          Text('Job Title *', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpace.sm),
          TextField(controller: _titleCtrl, decoration: const InputDecoration(hintText: 'e.g. Fix leaking pipe in bathroom', prefixIcon: Icon(Icons.work_outline))),
          const SizedBox(height: AppSpace.lg),
          Text('Category', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpace.sm),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: AppSpace.md),
            decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(AppRadius.button), border: Border.all(color: tokens.border, width: 0.5)),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _category,
                isExpanded: true,
                borderRadius: BorderRadius.circular(AppRadius.card),
                onChanged: (v) => setState(() => _category = v!),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, style: theme.textTheme.bodyMedium))).toList(),
              ),
            ),
          ),
          const SizedBox(height: AppSpace.lg),
          Text('Description *', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpace.sm),
          TextField(
            controller: _descCtrl,
            maxLines: 4,
            decoration: const InputDecoration(hintText: 'Describe the job in detail…', prefixIcon: Icon(Icons.description_outlined)),
          ),
          const SizedBox(height: AppSpace.lg),
          Text('Job Location *', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpace.sm),
          _buildLocationField(context),
          const SizedBox(height: AppSpace.lg),
          Text('Photos (optional)', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text('Add up to 3 photos of the job', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
          const SizedBox(height: AppSpace.sm),
          _buildPhotoPicker(context),
          const SizedBox(height: AppSpace.lg),
          Text('Budget Type', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
          const SizedBox(height: AppSpace.sm),
          Row(children: [
            Expanded(child: _buildBudgetTypeChip(context, 'fixed', 'Fixed Price')),
            const SizedBox(width: AppSpace.md),
            Expanded(child: _buildBudgetTypeChip(context, 'hourly', 'Hourly Rate')),
          ]),
          const SizedBox(height: AppSpace.lg),
          Text(
            '${_budgetType == 'fixed' ? 'Budget' : 'Hourly Rate'} (₹) *',
            style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600),
          ),
          const SizedBox(height: AppSpace.sm),
          TextField(
            controller: _budgetCtrl,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(hintText: 'e.g. 500', prefixIcon: Icon(Icons.currency_rupee)),
          ),
          const SizedBox(height: AppSpace.xl),
          PrimaryButton(label: 'Post Job', onPressed: _submit, loading: _loading),
          const SizedBox(height: AppSpace.lg),
        ],
      ),
    );
  }

  Widget _buildLocationField(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final hasLocation = _jobLat != null && _jobLng != null;

    if (_locatingAuto) {
      return Container(
        padding: const EdgeInsets.all(AppSpace.md),
        decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(AppRadius.button), border: Border.all(color: tokens.border, width: 0.5)),
        child: Row(children: [
          SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: theme.colorScheme.primary)),
          const SizedBox(width: AppSpace.md),
          Text('Getting your location…', style: theme.textTheme.bodyMedium?.copyWith(color: tokens.muted)),
        ]),
      );
    }

    return GestureDetector(
      onTap: () => showLocationPicker(context, onSelected: (lat, lng, label) {
        setState(() { _jobLat = lat; _jobLng = lng; _jobLocationLabel = label; });
      }),
      child: Container(
        padding: const EdgeInsets.all(AppSpace.md),
        decoration: BoxDecoration(
          color: theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppRadius.button),
          border: Border.all(color: hasLocation ? theme.colorScheme.primary : tokens.border),
        ),
        child: Row(children: [
          Icon(
            hasLocation ? Icons.location_on_rounded : Icons.location_off_outlined,
            color: hasLocation ? theme.colorScheme.primary : tokens.muted,
            size: 20,
          ),
          const SizedBox(width: AppSpace.sm),
          Expanded(
            child: Text(
              hasLocation
                  ? _jobLocationLabel
                  : _locationPermissionDenied
                      ? 'Location unavailable — tap to set manually'
                      : 'Tap to set job location',
              style: theme.textTheme.bodyMedium?.copyWith(color: hasLocation ? null : tokens.muted),
            ),
          ),
          if (hasLocation)
            GestureDetector(
              onTap: () => setState(() { _jobLat = null; _jobLng = null; _jobLocationLabel = ''; }),
              child: Icon(Icons.close, color: tokens.muted, size: 16),
            )
          else
            Icon(Icons.arrow_forward_ios, color: tokens.muted, size: 14),
        ]),
      ),
    );
  }

  Widget _buildPhotoPicker(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    return SizedBox(
      height: 80,
      child: ListView(scrollDirection: Axis.horizontal, children: [
        if (_selectedImages.length < 3)
          GestureDetector(
            onTap: _pickImage,
            child: Container(
              width: 80, height: 80,
              margin: const EdgeInsets.only(right: AppSpace.sm),
              decoration: BoxDecoration(color: theme.colorScheme.surface, borderRadius: BorderRadius.circular(AppRadius.button), border: Border.all(color: tokens.border, width: 0.5)),
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(Icons.add_photo_alternate_outlined, color: theme.colorScheme.primary, size: 28),
                const SizedBox(height: 4),
                Text('Add', style: theme.textTheme.bodySmall?.copyWith(color: theme.colorScheme.primary)),
              ]),
            ),
          ),
        ..._selectedImages.asMap().entries.map((entry) {
          final idx = entry.key;
          final image = entry.value;
          return Padding(
            padding: const EdgeInsets.only(right: AppSpace.sm),
            child: Stack(children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadius.button),
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
    );
  }

  Widget _buildBudgetTypeChip(BuildContext context, String type, String label) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final selected = _budgetType == type;

    return GestureDetector(
      onTap: () => setState(() => _budgetType = type),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: AppSpace.md),
        decoration: BoxDecoration(
          color: selected ? theme.colorScheme.primary : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppRadius.button),
          border: Border.all(color: selected ? theme.colorScheme.primary : tokens.border),
        ),
        child: Center(
          child: Text(label, style: theme.textTheme.bodyMedium?.copyWith(color: selected ? Colors.white : tokens.muted, fontWeight: FontWeight.bold)),
        ),
      ),
    );
  }
}
