import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/jobs_provider.dart';
import '../../widgets/app_button.dart';
import '../../widgets/app_text_field.dart';

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

  @override void dispose() { _titleCtrl.dispose(); _descCtrl.dispose(); _budgetCtrl.dispose(); super.dispose(); }

  Future<void> _submit() async {
    if (_titleCtrl.text.isEmpty || _budgetCtrl.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields'), backgroundColor: AppColors.error)); return;
    }
    setState(() => _loading = true);
    final ok = await context.read<JobsProvider>().postJob({
      'title': _titleCtrl.text, 'description': _descCtrl.text,
      'category': _category, 'budgetType': _budgetType,
      if (_budgetType == 'fixed') 'budgetFixed': double.tryParse(_budgetCtrl.text) ?? 0,
      if (_budgetType == 'hourly') 'budgetMin': double.tryParse(_budgetCtrl.text) ?? 0,
    });
    if (!mounted) return;
    setState(() => _loading = false);
    if (ok) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job posted successfully! ✅'), backgroundColor: AppColors.success)); _titleCtrl.clear(); _descCtrl.clear(); _budgetCtrl.clear(); }
    else     { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to post job'), backgroundColor: AppColors.error)); }
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
