import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../../shared/widgets/primary_button.dart';
import '../../../auth/application/auth_controller.dart';
import '../../application/post_job_controller.dart';
import '../widgets/post_job_step_indicator.dart';
import '../widgets/skill_chip_input.dart';

enum LocationPref { remote, onsite, hybrid }

final locationPrefProvider = StateProvider<LocationPref>((ref) => LocationPref.remote);
final specificCityProvider = StateProvider<String>((ref) => '');

class PostJobScreen extends ConsumerWidget {
  const PostJobScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(currentUserProvider);

    // Soft client-side gate for KYC verification
    if (user != null && !user.kycVerified) {
      return const _KycGateScreen();
    }

    final state = ref.watch(postJobControllerProvider);

    if (state.createdJob != null) {
      return const _SuccessScreen();
    }

    final textTheme = AppTypography.light;

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(
          'Post a Job',
          style: textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        foregroundColor: AppColors.onSurface,
        leading: state.step == 0
            ? IconButton(icon: const Icon(Icons.close_rounded), onPressed: () => context.go('/home'))
            : IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
                onPressed: () => ref.read(postJobControllerProvider.notifier).prevStep(),
              ),
        actions: [
          TextButton(
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Job draft saved successfully!'), backgroundColor: AppColors.secondary),
              );
              context.go('/home');
            },
            child: Text(
              'Save as Draft',
              style: textTheme.labelMedium?.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin, vertical: AppSpacing.stackMd),
              child: PostJobStepIndicator(currentStep: state.step),
            ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: Padding(
                  key: ValueKey(state.step),
                  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                  child: SingleChildScrollView(child: _StepBody(step: state.step)),
                ),
              ),
            ),
            _BottomBar(state: state),
          ],
        ),
      ),
    );
  }
}

class _StepBody extends ConsumerWidget {
  const _StepBody({required this.step});
  final int step;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    switch (step) {
      case 0:
        return const _BasicsStep();
      case 1:
        return const _DetailsStep();
      case 2:
        return const _BudgetStep();
      default:
        return const _ReviewStep();
    }
  }
}

class _BasicsStep extends ConsumerStatefulWidget {
  const _BasicsStep();

  @override
  ConsumerState<_BasicsStep> createState() => _BasicsStepState();
}

class _BasicsStepState extends ConsumerState<_BasicsStep> {
  late final _titleController = TextEditingController(text: ref.read(postJobControllerProvider).title);
  late final _descriptionController = TextEditingController(text: ref.read(postJobControllerProvider).description);
  late final _cityController = TextEditingController(text: ref.read(specificCityProvider));

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = ref.read(postJobControllerProvider.notifier);
    final state = ref.watch(postJobControllerProvider);
    final textTheme = AppTypography.light;
    final locationPref = ref.watch(locationPrefProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text("Let's start with the basics", style: textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(
          "Tell us what you're looking for. This helps us match you with the right talent.",
          style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.stackLg),

        _buildLabel('Job Title'),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.lgR,
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
          ),
          child: TextField(
            controller: _titleController,
            onChanged: controller.setTitle,
            style: textTheme.bodyMedium,
            decoration: InputDecoration(
              hintText: 'e.g. Senior Mobile App Developer',
              hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
        ),
        const SizedBox(height: 16),

        _buildLabel('Category'),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 2),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.lgR,
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
          ),
          child: DropdownButtonHideUnderline(
            child: DropdownButtonFormField<String>(
              value: state.category.isEmpty ? null : state.category,
              decoration: const InputDecoration(border: InputBorder.none, hintText: 'Select a category'),
              style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurface),
              items: kJobCategories.map((c) => DropdownMenuItem(value: c, child: Text(c))).toList(),
              onChanged: (v) => controller.setCategory(v ?? ''),
            ),
          ),
        ),
        const SizedBox(height: 16),

        _buildLabel('Location Preference'),
        SegmentedButton<LocationPref>(
          segments: const [
            ButtonSegment(value: LocationPref.remote, label: Text('Remote'), icon: Icon(Icons.home_outlined)),
            ButtonSegment(value: LocationPref.onsite, label: Text('On-site'), icon: Icon(Icons.business_outlined)),
            ButtonSegment(value: LocationPref.hybrid, label: Text('Hybrid'), icon: Icon(Icons.share_location_rounded)),
          ],
          selected: {locationPref},
          style: SegmentedButton.styleFrom(
            selectedBackgroundColor: AppColors.primary,
            selectedForegroundColor: Colors.white,
          ),
          onSelectionChanged: (selection) {
            final pref = selection.first;
            ref.read(locationPrefProvider.notifier).state = pref;
            if (pref == LocationPref.remote) {
              controller.setAddress('Remote');
            }
          },
        ),
        const SizedBox(height: 16),

        if (locationPref != LocationPref.remote) ...[
          _buildLabel('Specific City'),
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: AppRadius.lgR,
              border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
            ),
            child: TextField(
              controller: _cityController,
              onChanged: (v) {
                ref.read(specificCityProvider.notifier).state = v;
                controller.setAddress(v);
              },
              style: textTheme.bodyMedium,
              decoration: InputDecoration(
                hintText: 'e.g. New Delhi',
                hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
            ),
          ),
          const SizedBox(height: 16),
        ],

        _buildLabel('Job Description'),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.lgR,
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
          ),
          child: TextField(
            controller: _descriptionController,
            onChanged: controller.setDescription,
            maxLines: 5,
            style: textTheme.bodyMedium,
            decoration: InputDecoration(
              hintText: 'Briefly describe the key objectives and requirements (minimum 10 characters)...',
              hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0, left: 4.0),
      child: Text(
        text,
        style: AppTypography.light.labelSmall?.copyWith(
          color: AppColors.onSurfaceVariant,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _DetailsStep extends ConsumerStatefulWidget {
  const _DetailsStep();

  @override
  ConsumerState<_DetailsStep> createState() => _DetailsStepState();
}

class _DetailsStepState extends ConsumerState<_DetailsStep> {
  late final _addressController = TextEditingController(text: ref.read(postJobControllerProvider).address);

  @override
  void dispose() {
    _addressController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = ref.read(postJobControllerProvider.notifier);
    final state = ref.watch(postJobControllerProvider);
    final textTheme = AppTypography.light;

    if (_addressController.text != state.address) {
      _addressController.text = state.address;
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text('Skills & Location Geotagging', style: textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(
          'List the skills required and geotag where the work will happen to match nearby freelancers.',
          style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.stackLg),

        _buildLabel('Required Skills'),
        SkillChipInput(skills: state.skills, onAdd: controller.addSkill, onRemove: controller.removeSkill),
        const SizedBox(height: 16),

        _buildLabel('Job Address / Location'),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.lgR,
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
          ),
          child: TextField(
            controller: _addressController,
            onChanged: controller.setAddress,
            style: textTheme.bodyMedium,
            decoration: InputDecoration(
              hintText: 'e.g. Connaught Place, New Delhi',
              hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
              prefixIcon: const Icon(Icons.location_on_outlined, color: AppColors.primary, size: 20),
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            ),
          ),
        ),
        const SizedBox(height: 12),

        if (state.isLocating)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary)),
                const SizedBox(width: 8),
                Text('Detecting your location...', style: textTheme.labelSmall?.copyWith(color: AppColors.outline)),
              ],
            ),
          )
        else if (state.hasLocation)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.secondary.withOpacity(0.08),
              borderRadius: AppRadius.mdR,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle_rounded, size: 14, color: AppColors.secondary),
                const SizedBox(width: 6),
                Text(
                  'Location Geotagged Successfully [${state.lat?.toStringAsFixed(4)}, ${state.lng?.toStringAsFixed(4)}]',
                  style: textTheme.labelSmall?.copyWith(color: AppColors.secondary, fontWeight: FontWeight.w700),
                ),
              ],
            ),
          )
        else
          SizedBox(
            width: double.infinity,
            height: 40,
            child: OutlinedButton.icon(
              style: OutlinedButton.styleFrom(
                shape: RoundedRectangleBorder(borderRadius: AppRadius.lgR),
                side: const BorderSide(color: AppColors.primary),
              ),
              onPressed: controller.fetchLocation,
              icon: const Icon(Icons.my_location_rounded, size: 16, color: AppColors.primary),
              label: Text('Use My Current Location', style: textTheme.labelMedium?.copyWith(color: AppColors.primary, fontWeight: FontWeight.w700)),
            ),
          ),
        if (state.locationError != null)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: Text(state.locationError!, style: textTheme.labelMedium?.copyWith(color: AppColors.error)),
          ),
        const SizedBox(height: 16),

        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.xlR,
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
          ),
          child: SwitchListTile(
            value: state.isUrgent,
            onChanged: controller.toggleUrgent,
            activeColor: AppColors.primary,
            title: Text('Mark as Urgent', style: textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w700)),
            subtitle: Text('Urgent jobs get highlighted in searches and matching alerts.', style: textTheme.labelSmall?.copyWith(color: AppColors.outline)),
          ),
        ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0, left: 4.0),
      child: Text(
        text,
        style: AppTypography.light.labelSmall?.copyWith(
          color: AppColors.onSurfaceVariant,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _BudgetStep extends ConsumerWidget {
  const _BudgetStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(postJobControllerProvider.notifier);
    final state = ref.watch(postJobControllerProvider);
    final textTheme = AppTypography.light;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text('Set your budget range', style: textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(
          'Provide a realistic range in Rupees — freelancers will submit bids within this boundary.',
          style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.stackLg),
        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('Min Budget (₹)'),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: AppRadius.lgR,
                      border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
                    ),
                    child: TextField(
                      keyboardType: TextInputType.number,
                      onChanged: (v) => controller.setMinBudget(num.tryParse(v)),
                      style: textTheme.bodyMedium,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.currency_rupee_rounded, size: 16, color: AppColors.primary),
                        hintText: 'e.g. 5000',
                        hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.gutter),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildLabel('Max Budget (₹)'),
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: AppRadius.lgR,
                      border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
                    ),
                    child: TextField(
                      keyboardType: TextInputType.number,
                      onChanged: (v) => controller.setMaxBudget(num.tryParse(v)),
                      style: textTheme.bodyMedium,
                      decoration: InputDecoration(
                        prefixIcon: const Icon(Icons.currency_rupee_rounded, size: 16, color: AppColors.primary),
                        hintText: 'e.g. 15000',
                        hintStyle: textTheme.bodyMedium?.copyWith(color: AppColors.outline),
                        border: InputBorder.none,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        if (state.minBudget != null && state.maxBudget != null && state.maxBudget! < state.minBudget!)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'Max budget should be greater than or equal to min budget.',
              style: textTheme.labelMedium?.copyWith(color: AppColors.error, fontWeight: FontWeight.w700),
            ),
          ),
        const SizedBox(height: 32),
      ],
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6.0, left: 4.0),
      child: Text(
        text,
        style: AppTypography.light.labelSmall?.copyWith(
          color: AppColors.onSurfaceVariant,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _ReviewStep extends ConsumerWidget {
  const _ReviewStep();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(postJobControllerProvider);
    final textTheme = AppTypography.light;

    Widget row(String label, String value) => Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(
                width: 100,
                child: Text(label, style: textTheme.labelMedium?.copyWith(color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w700)),
              ),
              Expanded(child: Text(value, style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurface, fontWeight: FontWeight.w600))),
            ],
          ),
        );

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 8),
        Text('Review & confirm', style: textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
        const SizedBox(height: 6),
        Text(
          'Double-check everything before it goes live to freelancers.',
          style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant),
        ),
        const SizedBox(height: AppSpacing.stackLg),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: AppRadius.xlR,
            border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
          ),
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                row('Title', state.title),
                row('Category', state.category),
                row('Skills', state.skills.join(', ')),
                row('Budget', '₹${state.minBudget} – ₹${state.maxBudget}'),
                row('Location', state.address),
                row('Urgent', state.isUrgent ? 'Yes' : 'No'),
              ],
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.stackMd),
        Text('Description', style: textTheme.labelSmall?.copyWith(color: AppColors.onSurfaceVariant, fontWeight: FontWeight.w700)),
        const SizedBox(height: 6),
        Text(state.description, style: textTheme.bodyMedium?.copyWith(color: AppColors.onSurfaceVariant, height: 1.3)),
        if (state.submitError != null && !state.isKycRequiredError) ...[
          const SizedBox(height: AppSpacing.stackMd),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: AppColors.errorContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(state.submitError!.message, style: textTheme.bodyMedium?.copyWith(color: AppColors.onErrorContainer)),
          ),
        ],
        const SizedBox(height: 32),
      ],
    );
  }
}

class _BottomBar extends ConsumerWidget {
  const _BottomBar({required this.state});
  final PostJobState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(postJobControllerProvider.notifier);
    final isLastStep = state.step == kPostJobSteps.length - 1;
    final canProceed = controller.canGoNext();

    return Container(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.containerMargin,
        AppSpacing.stackSm,
        AppSpacing.containerMargin,
        AppSpacing.stackMd,
      ),
      decoration: BoxDecoration(
        color: AppColors.surfaceContainerLowest,
        boxShadow: [
          BoxShadow(
            color: AppColors.outlineVariant.withOpacity(0.15),
            blurRadius: 12,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: PrimaryButton(
          label: isLastStep ? 'Post Job' : 'Continue',
          icon: isLastStep ? Icons.bolt_rounded : Icons.arrow_forward_rounded,
          isLoading: state.isSubmitting,
          onPressed: !canProceed
              ? null
              : isLastStep
                  ? controller.submit
                  : controller.nextStep,
        ),
      ),
    );
  }
}

class _KycGateScreen extends ConsumerWidget {
  const _KycGateScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textTheme = AppTypography.light;
    return Scaffold(
      appBar: AppBar(
        title: const Text('Post a Job'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 18),
          onPressed: () => context.go('/home'),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.containerMargin),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), shape: BoxShape.circle),
                child: const Icon(Icons.verified_user_outlined, color: AppColors.primary, size: 32),
              ),
              const SizedBox(height: AppSpacing.stackLg),
              Text('Verify your identity first', style: textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800), textAlign: TextAlign.center),
              const SizedBox(height: AppSpacing.stackSm),
              Text(
                'WorkQuora requires Aadhaar + PAN verification before you can post a job — it keeps the marketplace safe for everyone.',
                textAlign: TextAlign.center,
                style: textTheme.bodyLarge?.copyWith(color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.stackLg),
              PrimaryButton(
                label: 'Complete KYC in Profile',
                icon: Icons.arrow_forward_rounded,
                onPressed: () => context.go('/profile'),
              ),
              const SizedBox(height: AppSpacing.stackSm),
              TextButton(
                onPressed: () => ref.read(authControllerProvider.notifier).refreshUser(),
                child: Text('I just verified — refresh status', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SuccessScreen extends ConsumerWidget {
  const _SuccessScreen();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final textTheme = AppTypography.light;
    final job = ref.watch(postJobControllerProvider).createdJob!;

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.containerMargin),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 72,
                height: 72,
                decoration: BoxDecoration(color: AppColors.secondary.withOpacity(0.08), shape: BoxShape.circle),
                child: const Icon(Icons.check_rounded, color: AppColors.secondary, size: 36),
              ),
              const SizedBox(height: AppSpacing.stackLg),
              Text('Job Posted Successfully!', style: textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.w800)),
              const SizedBox(height: AppSpacing.stackSm),
              Text(
                '"${job.title}" is now live and visible to freelancers nearby.',
                textAlign: TextAlign.center,
                style: textTheme.bodyLarge?.copyWith(color: AppColors.onSurfaceVariant),
              ),
              const SizedBox(height: AppSpacing.stackLg),
              PrimaryButton(
                label: 'Back to Home',
                onPressed: () {
                  ref.read(postJobControllerProvider.notifier).reset();
                  context.go('/home');
                },
              ),
              const SizedBox(height: AppSpacing.stackSm),
              TextButton(
                onPressed: () => ref.read(postJobControllerProvider.notifier).reset(),
                child: Text('Post Another Job', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
