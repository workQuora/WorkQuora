import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:shimmer/shimmer.dart';
import 'package:geolocator/geolocator.dart';
import '../../core/constants/app_colors.dart';
import '../../core/providers/auth_provider.dart';
import '../../core/providers/jobs_provider.dart';
import '../../core/providers/dashboard_provider.dart';
import '../../core/providers/kyc_provider.dart';
import '../../core/utils/time_utils.dart';

class WorkerHomeScreen extends StatefulWidget {
  const WorkerHomeScreen({super.key});
  @override
  State<WorkerHomeScreen> createState() => _WorkerHomeScreenState();
}

class _WorkerHomeScreenState extends State<WorkerHomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _load());
  }

  Future<void> _load() async {
    // Fresh KYC status on every home visit — the KYC hub already refreshes
    // KycProvider after each step submits, but that only reaches this screen
    // if we re-fetch here too, since AuthProvider.user's cached
    // isKycVerified flag is only refreshed on cold start (see splash_screen).
    context.read<KycProvider>().fetchStatus();
    context.read<DashboardProvider>().fetchDashboard();
    final pos = await _resolvePosition();
    if (!mounted) return;
    context.read<JobsProvider>().fetchNearbyJobs(lat: pos.latitude, lng: pos.longitude);
  }

  // Best-effort location fetch; falls back to a default New Delhi point so
  // nearby jobs still render for users who deny the permission.
  Future<Position> _resolvePosition() async {
    const fallback = 28.6139;
    const fallbackLng = 77.2090;
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied || permission == LocationPermission.deniedForever) {
        return Position(
          latitude: fallback, longitude: fallbackLng, timestamp: DateTime.now(),
          accuracy: 0, altitude: 0, altitudeAccuracy: 0, heading: 0, headingAccuracy: 0, speed: 0, speedAccuracy: 0,
        );
      }
      return await Geolocator.getCurrentPosition();
    } catch (_) {
      return Position(
        latitude: fallback, longitude: fallbackLng, timestamp: DateTime.now(),
        accuracy: 0, altitude: 0, altitudeAccuracy: 0, heading: 0, headingAccuracy: 0, speed: 0, speedAccuracy: 0,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final jobs = context.watch<JobsProvider>();
    final dash = context.watch<DashboardProvider>();
    final kyc = context.watch<KycProvider>();
    final user = auth.user ?? {};
    final name = (user['name'] ?? 'Worker').toString().split(' ').first;
    final avail = user['isAvailable'] == true;
    final rating = (user['averageRating'] ?? 0.0).toDouble();

    // Phase A: worker home is gated entirely behind KYC — no jobs, no tabs,
    // nothing else until verified. Source of truth is KycProvider (fresh
    // fetch above), not the possibly-stale AuthProvider.user['isKycVerified'].
    if (kyc.status == null && kyc.isLoading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: Center(child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }
    if (!kyc.isFullyVerified) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: SafeArea(
          child: Center(
            child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  width: 72, height: 72,
                  decoration: BoxDecoration(color: AppColors.warning.withOpacity(0.12), shape: BoxShape.circle),
                  child: Icon(Icons.shield_outlined, color: AppColors.warning, size: 32),
                ),
                const SizedBox(height: 20),
                Text('Complete Your KYC', style: TextStyle(color: AppColors.textPrimary, fontSize: 20, fontWeight: FontWeight.w900)),
                const SizedBox(height: 10),
                Text(
                  'Verify your mobile, PAN, Aadhaar, bank and selfie to unlock jobs, earnings, and everything else.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: AppColors.textSecondary, fontSize: 13, height: 1.4),
                ),
                const SizedBox(height: 28),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () => context.push('/kyc'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    child: const Text('Complete KYC Verification', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                  ),
                ),
              ]),
            ),
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          backgroundColor: AppColors.surface,
          onRefresh: _load,
          child: CustomScrollView(slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(children: [
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text('Hi $name 👋', style: TextStyle(color: AppColors.textPrimary, fontSize: 22, fontWeight: FontWeight.w900)),
                      GestureDetector(
                        onTap: () => auth.updateAvailability(!avail),
                        child: Row(mainAxisSize: MainAxisSize.min, children: [
                          Container(width: 7, height: 7, decoration: BoxDecoration(color: avail ? AppColors.primary : AppColors.textSecondary, shape: BoxShape.circle)),
                          const SizedBox(width: 6),
                          Text(avail ? 'Online — receiving jobs' : 'Offline', style: TextStyle(color: avail ? AppColors.primary : AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
                        ]),
                      ),
                    ]),
                  ),
                  IconButton(
                    icon: Icon(Icons.notifications_outlined, color: AppColors.textPrimary),
                    onPressed: () => context.push('/notifications'),
                  ),
                  IconButton(
                    icon: Icon(Icons.account_balance_wallet_outlined, color: AppColors.textPrimary),
                    onPressed: () => context.go('/earnings'),
                  ),
                ]),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 2.1,
                  children: [
                    _statCard('Active Projects', '${dash.pendingTasks}', Icons.work_outline, AppColors.primary),
                    _statCard('Total Earned', formatCurrency(dash.allTimeIncome), Icons.currency_rupee, AppColors.primary),
                    _statCard('Completion Rate', '${dash.completionRate.toStringAsFixed(0)}%', Icons.check_circle_outline, AppColors.info),
                    _statCard('Avg Rating', rating > 0 ? rating.toStringAsFixed(1) : '—', Icons.star_outline, AppColors.warning),
                  ],
                ),
              ),
            ),
            // Today's Jobs — pushed here directly once the matching engine
            // (Phase B) is live. Honest placeholder until then.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: Text("Today's Jobs", style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            SliverToBoxAdapter(child: _placeholderCard(Icons.bolt_outlined, "Jobs will appear here when matched")),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Nearby Jobs', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
                ]),
              ),
            ),
            jobs.isLoadingNearby
                ? SliverList(
                    delegate: SliverChildBuilderDelegate(
                      (_, i) => Padding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
                        child: Shimmer.fromColors(
                          baseColor: AppColors.surface,
                          highlightColor: AppColors.surface2,
                          child: Container(height: 100, decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18))),
                        ),
                      ),
                      childCount: 3,
                    ),
                  )
                : jobs.nearbyJobs.isEmpty
                    ? SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 20),
                          child: Container(
                            padding: const EdgeInsets.all(24),
                            decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.border)),
                            child: Column(children: [
                              Icon(Icons.search_off, color: AppColors.textSecondary, size: 40),
                              const SizedBox(height: 10),
                              Text('No nearby jobs right now', style: TextStyle(color: AppColors.textSecondary)),
                            ]),
                          ),
                        ),
                      )
                    : SliverPadding(
                        padding: const EdgeInsets.fromLTRB(20, 0, 20, 8),
                        sliver: SliverList(
                          delegate: SliverChildBuilderDelegate(
                            (_, i) => _jobCard(context, jobs.nearbyJobs[i]),
                            childCount: jobs.nearbyJobs.take(5).length,
                          ),
                        ),
                      ),
            // Highly Demanded Jobs — no backend endpoint yet; honest placeholder.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: Text('Highly Demanded Jobs', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            SliverToBoxAdapter(child: _placeholderCard(Icons.trending_up, 'Coming soon')),
            // Today's Earnings — real data, already fetched via DashboardProvider.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: Text("Today's Earnings", style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                child: Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.08), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.primary.withOpacity(0.2))),
                  child: Row(children: [
                    Icon(Icons.today_outlined, color: AppColors.primary, size: 22),
                    const SizedBox(width: 12),
                    Text(formatCurrency(dash.todayIncome), style: TextStyle(color: AppColors.primary, fontSize: 22, fontWeight: FontWeight.w900)),
                    const SizedBox(width: 8),
                    Text('earned today', style: TextStyle(color: AppColors.textSecondary, fontSize: 12)),
                  ]),
                ),
              ),
            ),
            // Wallet — full functionality already lives at /earnings; this is
            // a lightweight entry point, not a duplicate wallet UI.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: Text('Wallet', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
                child: _quickAction(context, 'View Wallet & Earnings', Icons.account_balance_wallet_outlined, () => context.go('/earnings')),
              ),
            ),
            // History — no dedicated screen yet; honest placeholder.
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 12),
                child: Text('History', style: TextStyle(color: AppColors.textPrimary, fontSize: 16, fontWeight: FontWeight.bold)),
              ),
            ),
            SliverToBoxAdapter(child: _placeholderCard(Icons.history, 'Your completed jobs will show up here')),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 30),
                child: _quickAction(context, 'My Proposals', Icons.description_outlined, () => context.push('/proposals')),
              ),
            ),
          ]),
        ),
      ),
    );
  }

  Widget _placeholderCard(IconData icon, String message) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
          child: Column(children: [
            Icon(icon, color: AppColors.textSecondary, size: 28),
            const SizedBox(height: 8),
            Text(message, textAlign: TextAlign.center, style: TextStyle(color: AppColors.textSecondary, fontSize: 13)),
          ]),
        ),
      );

  Widget _statCard(String label, String val, IconData icon, Color color) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisAlignment: MainAxisAlignment.center, children: [
          Icon(icon, color: color, size: 18),
          const SizedBox(height: 6),
          Text(val, style: TextStyle(color: color, fontSize: 17, fontWeight: FontWeight.w900), overflow: TextOverflow.ellipsis),
          Text(label, style: TextStyle(color: AppColors.textSecondary, fontSize: 10)),
        ]),
      );

  Widget _quickAction(BuildContext context, String label, IconData icon, VoidCallback onTap) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 16),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(16), border: Border.all(color: AppColors.border)),
          child: Column(children: [
            Icon(icon, color: AppColors.primary, size: 22),
            const SizedBox(height: 8),
            Text(label, textAlign: TextAlign.center, style: TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
          ]),
        ),
      );

  Widget _jobCard(BuildContext context, Map<String, dynamic> job) {
    final title = job['title'] ?? 'Job';
    final budgetMin = job['budgetRange']?['min'] ?? job['budget'] ?? 0;
    final budgetMax = job['budgetRange']?['max'];
    final cat = job['category'] ?? '';
    final id = (job['_id'] ?? job['id'] ?? '').toString();
    final posted = timeAgo(job['createdAt']?.toString());

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(18), border: Border.all(color: AppColors.border)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(color: AppColors.primary.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
            child: Text('$cat', style: TextStyle(color: AppColors.primary, fontSize: 11, fontWeight: FontWeight.bold)),
          ),
          const Spacer(),
          if (posted.isNotEmpty) Text(posted, style: TextStyle(color: AppColors.textSecondary, fontSize: 11)),
        ]),
        const SizedBox(height: 8),
        Text(title, style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.bold, fontSize: 15)),
        const SizedBox(height: 4),
        Text(budgetMax != null ? '₹$budgetMin - ₹$budgetMax' : '₹$budgetMin', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.w900, fontSize: 15)),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: id.isEmpty ? null : () => context.push('/job/$id'),
            style: OutlinedButton.styleFrom(side: BorderSide(color: AppColors.primary), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)), padding: const EdgeInsets.symmetric(vertical: 10)),
            child: Text('View', style: TextStyle(color: AppColors.primary, fontWeight: FontWeight.bold, fontSize: 13)),
          ),
        ),
      ]),
    );
  }
}
