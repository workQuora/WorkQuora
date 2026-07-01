import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:shimmer/shimmer.dart';

import '../../../../core/theme/app_colors.dart';
import '../../../../core/theme/app_spacing.dart';
import '../../../../core/theme/app_typography.dart';
import '../../../auth/application/auth_controller.dart';
import '../../../discover/data/discover_providers.dart';
import '../../../discover/data/models/talent_model.dart';
import '../../../post_job/data/post_job_providers.dart';
import '../../../wallet/application/wallet_controller.dart';
import '../../application/home_location_controller.dart';
import 'package:workquora_client/features/ads/data/ads_providers.dart';
import 'package:workquora_client/features/ads/domain/models/ad_model.dart';

final nearbyFreelancersProvider = FutureProvider.autoDispose<List<TalentModel>>((ref) async {
  final location = ref.watch(homeLocationControllerProvider);
  if (!location.hasLocation) return const [];
  final repo = ref.watch(discoverRepositoryProvider);
  final result = await repo.searchTalent(lat: location.lat!, lng: location.lng!, radius: 25);
  return result.match((failure) => throw failure, (talents) => talents);
});

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String selectedCategory = 'All';

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(currentUserProvider);
    final walletState = ref.watch(walletControllerProvider);
    final jobsState = ref.watch(myJobsProvider);
    final adsState = ref.watch(activeAdsProvider);
    final talentsState = ref.watch(nearbyFreelancersProvider);
    final locationState = ref.watch(homeLocationControllerProvider);

    final firstName = user?.name.split(' ').first ?? 'Recruiter';

    return Scaffold(
      backgroundColor: AppColors.background,
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.primary,
        elevation: 6,
        highlightElevation: 10,
        shape: RoundedRectangleBorder(borderRadius: AppRadius.xxlR),
        onPressed: () => context.go('/post'),
        icon: const Icon(Icons.add_rounded, color: AppColors.onPrimary, size: 24),
        label: Text(
          'Post a Job',
          style: AppTypography.textTheme(AppColors.onPrimary).labelMedium?.copyWith(
                fontWeight: FontWeight.w700,
                letterSpacing: 0.2,
              ),
        ),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(walletControllerProvider);
            ref.invalidate(myJobsProvider);
            ref.invalidate(activeAdsProvider);
            ref.invalidate(nearbyFreelancersProvider);
            ref.read(homeLocationControllerProvider.notifier).retry();
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Header Row
                Padding(
                  padding: const EdgeInsets.all(AppSpacing.containerMargin),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Hello, $firstName 👋',
                              style: AppTypography.light.headlineMedium?.copyWith(
                                fontWeight: FontWeight.w800,
                                color: AppColors.onSurface,
                              ),
                            ),
                            const SizedBox(height: 4),
                            GestureDetector(
                              onTap: locationState.loading
                                  ? null
                                  : () => ref.read(homeLocationControllerProvider.notifier).retry(),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceContainer,
                                  borderRadius: AppRadius.fullR,
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    if (locationState.loading)
                                      const SizedBox(
                                        width: 12,
                                        height: 12,
                                        child: CircularProgressIndicator(strokeWidth: 1.5, color: AppColors.primary),
                                      )
                                    else
                                      Icon(
                                        locationState.hasLocation ? Icons.location_on_rounded : Icons.location_off_rounded,
                                        size: 14,
                                        color: locationState.hasLocation ? AppColors.primary : AppColors.error,
                                      ),
                                    const SizedBox(width: 4),
                                    Text(
                                      locationState.loading ? 'Detecting…' : locationState.city,
                                      style: AppTypography.light.labelSmall?.copyWith(
                                        fontWeight: FontWeight.w700,
                                        color: locationState.hasLocation
                                            ? AppColors.onSurfaceVariant
                                            : AppColors.error,
                                      ),
                                    ),
                                    if (!locationState.loading)
                                      Icon(
                                        locationState.hasLocation ? Icons.arrow_drop_down_rounded : Icons.refresh_rounded,
                                        size: 16,
                                        color: locationState.hasLocation ? AppColors.onSurfaceVariant : AppColors.error,
                                      ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Wallet Balance
                      GestureDetector(
                        onTap: () => context.go('/wallet'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          margin: const EdgeInsets.only(right: 12),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppColors.primary, AppColors.primaryContainer],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: AppRadius.xlR,
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withOpacity(0.2),
                                blurRadius: 8,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.account_balance_wallet_rounded, size: 16, color: AppColors.onPrimary),
                              const SizedBox(width: 6),
                              Text(
                                walletState.when(
                                  data: (w) => '₹${w?.formattedBalance ?? 0}',
                                  loading: () => '...',
                                  error: (_, __) => '₹0',
                                ),
                                style: AppTypography.textTheme(AppColors.onPrimary).labelMedium?.copyWith(
                                      fontWeight: FontWeight.w800,
                                    ),
                               ),
                             ],
                           ),
                         ),
                       ),
                       // Notifications & Profile Pic
                       Stack(
                         children: [
                           IconButton(
                             icon: const Icon(Icons.notifications_none_rounded, size: 28, color: AppColors.onSurface),
                             onPressed: () => context.push('/notifications'),
                           ),
                           Positioned(
                             right: 10,
                             top: 10,
                             child: Container(
                               width: 8,
                               height: 8,
                               decoration: const BoxDecoration(
                                 color: AppColors.error,
                                 shape: BoxShape.circle,
                               ),
                             ),
                           ),
                         ],
                       ),
                       const SizedBox(width: 4),
                       ClipRRect(
                         borderRadius: AppRadius.mdR,
                         child: CachedNetworkImage(
                           imageUrl: user?.avatar ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=User',
                           width: 38,
                           height: 38,
                           fit: BoxFit.cover,
                           placeholder: (_, __) => Container(color: AppColors.surfaceContainer, width: 38, height: 38),
                           errorWidget: (_, __, ___) => const Icon(Icons.account_circle, size: 38),
                         ),
                       ),
                     ],
                   ),
                 ),
 
                 // 2. Search Bar
                 Padding(
                   padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                   child: GestureDetector(
                     onTap: () => context.go('/discover'),
                     child: Container(
                       padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                       decoration: BoxDecoration(
                         color: AppColors.surfaceContainerLow,
                         borderRadius: AppRadius.fullR,
                         border: Border.all(color: AppColors.outlineVariant.withOpacity(0.4)),
                       ),
                       child: Row(
                         children: [
                           const Icon(Icons.search_rounded, color: AppColors.outline, size: 20),
                           const SizedBox(width: 12),
                           Expanded(
                             child: Text(
                               'Search workers, skills, roles...',
                               style: AppTypography.light.bodyMedium?.copyWith(color: AppColors.outline),
                             ),
                           ),
                           const Icon(Icons.mic_none_rounded, color: AppColors.outline, size: 20),
                         ],
                       ),
                     ),
                   ),
                 ),
                 const SizedBox(height: AppSpacing.stackMd),
 
                 // 3. Category Chips
                 SizedBox(
                   height: 38,
                   child: ListView(
                     scrollDirection: Axis.horizontal,
                     padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                     children: ['All', 'Designers', 'Dev', 'Marketing'].map((cat) {
                       final isActive = selectedCategory == cat;
                       return Padding(
                         padding: const EdgeInsets.only(right: 8),
                         child: ChoiceChip(
                           label: Text(
                             cat,
                             style: TextStyle(
                               color: isActive ? AppColors.onPrimary : AppColors.onSurfaceVariant,
                               fontWeight: isActive ? FontWeight.w800 : FontWeight.w500,
                             ),
                           ),
                           selected: isActive,
                           selectedColor: AppColors.primary,
                           backgroundColor: AppColors.surfaceContainerLow,
                           shape: RoundedRectangleBorder(
                             borderRadius: AppRadius.fullR,
                             side: BorderSide(
                               color: isActive ? AppColors.primary : AppColors.outlineVariant.withOpacity(0.4),
                             ),
                           ),
                           onSelected: (selected) {
                             if (selected) {
                               setState(() => selectedCategory = cat);
                             }
                           },
                         ),
                       );
                     }).toList(),
                   ),
                 ),
                 const SizedBox(height: AppSpacing.stackLg),
 
                 // 4. Stats Row
                 Padding(
                   padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                   child: jobsState.when(
                     data: (jobs) {
                       final total = jobs.length;
                       final active = jobs.where((j) => j.status == 'open' || j.status == 'in_progress').length;
                       final done = jobs.where((j) => j.status == 'completed').length;
 
                       return Row(
                         children: [
                           _buildStatCard('Total Gigs', total.toString(), Icons.business_center_rounded, AppColors.primary),
                           const SizedBox(width: 12),
                           _buildStatCard('Active', active.toString(), Icons.access_time_rounded, AppColors.secondary),
                           const SizedBox(width: 12),
                           _buildStatCard('Done', done.toString(), Icons.check_circle_outline_rounded, AppColors.onSurface),
                         ],
                       );
                     },
                     loading: () => _buildShimmerStats(),
                     error: (_, __) => Row(
                       children: [
                         _buildStatCard('Total Gigs', '0', Icons.business_center_rounded, AppColors.primary),
                         const SizedBox(width: 12),
                         _buildStatCard('Active', '0', Icons.access_time_rounded, AppColors.secondary),
                         const SizedBox(width: 12),
                         _buildStatCard('Done', '0', Icons.check_circle_outline_rounded, AppColors.onSurface),
                       ],
                     ),
                   ),
                 ),
                 const SizedBox(height: AppSpacing.stackLg),
 
                 // 5. Ad Banner Carousel
                 adsState.when(
                   data: (ads) {
                     if (ads.isEmpty) return const SizedBox.shrink();
                     return Column(
                       children: [
                         SizedBox(
                           height: 140,
                           child: PageView.builder(
                             itemCount: ads.length,
                             itemBuilder: (context, index) {
                               final ad = ads[index];
                               return AdCard(ad: ad);
                             },
                           ),
                         ),
                         const SizedBox(height: AppSpacing.stackLg),
                       ],
                     );
                   },
                   loading: () => const SizedBox.shrink(),
                   error: (_, __) => const SizedBox.shrink(),
                 ),
 
                 // 6. Recommended Talent Section Header
                 Padding(
                   padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                   child: Row(
                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
                     children: [
                       Text(
                         'Recommended Talent',
                         style: AppTypography.light.titleLarge?.copyWith(
                           fontWeight: FontWeight.w800,
                           color: AppColors.onSurface,
                         ),
                       ),
                       GestureDetector(
                         onTap: () => context.go('/discover'),
                         child: Text(
                           'View All',
                           style: AppTypography.light.labelMedium?.copyWith(
                             color: AppColors.primary,
                             fontWeight: FontWeight.w700,
                           ),
                         ),
                       ),
                     ],
                   ),
                 ),
                 const SizedBox(height: AppSpacing.stackMd),
 
                 // Recommended Talent List
                 SizedBox(
                   height: 235,
                   child: locationState.loading
                       ? _buildShimmerTalents()
                       : !locationState.hasLocation
                           ? Center(
                               child: Column(
                                 mainAxisSize: MainAxisSize.min,
                                 children: [
                                   const Icon(Icons.location_off_rounded, size: 28, color: AppColors.outline),
                                   const SizedBox(height: 8),
                                   Text(
                                     locationState.error ?? 'Enable location to see nearby talent.',
                                     textAlign: TextAlign.center,
                                     style: AppTypography.light.bodySmall?.copyWith(color: AppColors.outline),
                                   ),
                                   const SizedBox(height: 8),
                                   TextButton(
                                     onPressed: () => ref.read(homeLocationControllerProvider.notifier).retry(),
                                     child: const Text('Tap to set location'),
                                   ),
                                 ],
                               ),
                             )
                           : talentsState.when(
                               data: (talents) {
                                 if (talents.isEmpty) {
                                   return Center(
                                     child: Text(
                                       'No freelancers nearby.',
                                       style: AppTypography.light.bodyMedium?.copyWith(color: AppColors.outline),
                                     ),
                                   );
                                 }
                                 return ListView.builder(
                                   scrollDirection: Axis.horizontal,
                                   padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
                                   itemCount: talents.length,
                                   itemBuilder: (context, index) {
                                     final talent = talents[index];
                                     return _buildTalentCard(context, talent);
                                   },
                                 );
                               },
                               loading: () => _buildShimmerTalents(),
                               error: (err, __) => Center(
                                 child: Text(
                                   'Failed to load recommended talent.',
                                   style: AppTypography.light.bodyMedium?.copyWith(color: AppColors.error),
                                 ),
                               ),
                             ),
                 ),
                 const SizedBox(height: 80), // bottom spacing for FAB
               ],
             ),
           ),
         ),
       ),
     );
   }
 
   Widget _buildStatCard(String label, String value, IconData icon, Color color) {
     return Expanded(
       child: Container(
         padding: const EdgeInsets.all(12),
         decoration: BoxDecoration(
           color: Colors.white,
           borderRadius: AppRadius.xlR,
           border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
           boxShadow: [
             BoxShadow(
               color: Colors.black.withOpacity(0.02),
               blurRadius: 6,
               offset: const Offset(0, 3),
             ),
           ],
         ),
         child: Column(
           crossAxisAlignment: CrossAxisAlignment.start,
           children: [
             Container(
               padding: const EdgeInsets.all(6),
               decoration: BoxDecoration(
                 color: color.withOpacity(0.08),
                 shape: BoxShape.circle,
               ),
               child: Icon(icon, size: 16, color: color),
             ),
             const SizedBox(height: 12),
             Text(
               value,
               style: AppTypography.light.headlineSmall?.copyWith(
                 fontWeight: FontWeight.w800,
                 color: AppColors.onSurface,
               ),
             ),
             const SizedBox(height: 2),
             Text(
               label,
               style: AppTypography.light.labelSmall?.copyWith(
                 color: AppColors.outline,
                 fontWeight: FontWeight.w600,
               ),
             ),
           ],
         ),
       ),
     );
   }
 
   Widget _buildShimmerStats() {
     return Shimmer.fromColors(
       baseColor: AppColors.surfaceContainer,
       highlightColor: AppColors.surfaceContainerLow,
       child: Row(
         children: [
           Expanded(child: Container(height: 80, decoration: BoxDecoration(color: Colors.white, borderRadius: AppRadius.xlR))),
           const SizedBox(width: 12),
           Expanded(child: Container(height: 80, decoration: BoxDecoration(color: Colors.white, borderRadius: AppRadius.xlR))),
           const SizedBox(width: 12),
           Expanded(child: Container(height: 80, decoration: BoxDecoration(color: Colors.white, borderRadius: AppRadius.xlR))),
         ],
       ),
     );
   }
 
   Widget _buildTalentCard(BuildContext context, TalentModel talent) {
     return Container(
       width: 170,
       margin: const EdgeInsets.only(right: 12, bottom: 8),
       padding: const EdgeInsets.all(12),
       decoration: BoxDecoration(
         color: Colors.white,
         borderRadius: AppRadius.xlR,
         border: Border.all(color: AppColors.outlineVariant.withOpacity(0.2)),
         boxShadow: [
           BoxShadow(
             color: Colors.black.withOpacity(0.02),
             blurRadius: 6,
             offset: const Offset(0, 3),
           ),
         ],
       ),
       child: Column(
         crossAxisAlignment: CrossAxisAlignment.start,
         children: [
           Row(
             mainAxisAlignment: MainAxisAlignment.spaceBetween,
             children: [
               ClipRRect(
                 borderRadius: AppRadius.smR,
                 child: CachedNetworkImage(
                   imageUrl: talent.avatar ?? 'https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.name}',
                   width: 36,
                   height: 36,
                   fit: BoxFit.cover,
                   placeholder: (_, __) => Container(color: AppColors.surfaceContainer, width: 36, height: 36),
                   errorWidget: (_, __, ___) => const Icon(Icons.account_circle, size: 36),
                 ),
               ),
               Container(
                 padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                 decoration: BoxDecoration(
                   color: AppColors.starRating.withOpacity(0.12),
                   borderRadius: AppRadius.mdR,
                 ),
                 child: Row(
                   children: [
                     const Icon(Icons.star_rounded, size: 12, color: AppColors.starRating),
                     const SizedBox(width: 2),
                     Text(
                       talent.averageRating.toStringAsFixed(1),
                       style: AppTypography.light.labelSmall?.copyWith(
                         fontWeight: FontWeight.w800,
                         color: AppColors.onSurface,
                       ),
                     ),
                   ],
                 ),
               ),
             ],
           ),
           const SizedBox(height: 12),
           Text(
             talent.name,
             maxLines: 1,
             overflow: TextOverflow.ellipsis,
             style: AppTypography.light.bodyMedium?.copyWith(
               fontWeight: FontWeight.w800,
               color: AppColors.onSurface,
             ),
           ),
           Text(
             talent.title.isNotEmpty ? talent.title : 'Freelancer',
             maxLines: 1,
             overflow: TextOverflow.ellipsis,
             style: AppTypography.light.labelSmall?.copyWith(
               color: AppColors.outline,
               fontWeight: FontWeight.w500,
             ),
           ),
           const SizedBox(height: 8),
           if (talent.skills.isNotEmpty)
             Container(
               padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
               decoration: BoxDecoration(
                 color: AppColors.surfaceContainerLow,
                 borderRadius: AppRadius.mdR,
               ),
               child: Text(
                 talent.skills.first,
                 maxLines: 1,
                 overflow: TextOverflow.ellipsis,
                 style: AppTypography.light.labelSmall?.copyWith(
                   fontWeight: FontWeight.w700,
                   color: AppColors.primary,
                 ),
               ),
             ),
           const SizedBox(height: 4),
           Row(
             children: [
               const Icon(Icons.location_on_rounded, size: 10, color: AppColors.outline),
               const SizedBox(width: 2),
               Text(
                 '${talent.distance.toStringAsFixed(1)} km',
                 style: AppTypography.light.labelSmall?.copyWith(
                   color: AppColors.outline,
                   fontWeight: FontWeight.w600,
                 ),
               ),
             ],
           ),
           const Spacer(),
           SizedBox(
             width: double.infinity,
             height: 32,
             child: ElevatedButton(
               onPressed: () => context.go('/discover/${talent.id}'),
               style: ElevatedButton.styleFrom(
                 backgroundColor: AppColors.primary,
                 foregroundColor: AppColors.onPrimary,
                 elevation: 0,
                 shape: RoundedRectangleBorder(borderRadius: AppRadius.mdR),
                 padding: EdgeInsets.zero,
               ),
               child: Text(
                 'Hire Now',
                 style: AppTypography.textTheme(AppColors.onPrimary).labelSmall?.copyWith(
                       fontWeight: FontWeight.w800,
                     ),
               ),
             ),
           ),
         ],
       ),
     );
   }
 
   Widget _buildShimmerTalents() {
     return Shimmer.fromColors(
       baseColor: AppColors.surfaceContainer,
       highlightColor: AppColors.surfaceContainerLow,
       child: ListView.builder(
         scrollDirection: Axis.horizontal,
         padding: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
         itemCount: 3,
         itemBuilder: (_, __) => Container(
           width: 170,
           margin: const EdgeInsets.only(right: 12, bottom: 8),
           decoration: BoxDecoration(color: Colors.white, borderRadius: AppRadius.xlR),
         ),
       ),
     );
   }
 }
 
 class AdCard extends ConsumerStatefulWidget {
   const AdCard({super.key, required this.ad});
   final AdModel ad;
 
   @override
   ConsumerState<AdCard> createState() => _AdCardState();
 }
 
 class _AdCardState extends ConsumerState<AdCard> {
   @override
   void initState() {
     super.initState();
     ref.read(adsRepositoryProvider).trackAdImpression(widget.ad.id);
   }
 
   @override
   Widget build(BuildContext context) {
     return Container(
       margin: const EdgeInsets.symmetric(horizontal: AppSpacing.containerMargin),
       padding: const EdgeInsets.all(AppSpacing.cardPadding),
       decoration: BoxDecoration(
         gradient: const LinearGradient(
           colors: [AppColors.primary, AppColors.primaryContainer],
           begin: Alignment.topLeft,
           end: Alignment.bottomRight,
         ),
         borderRadius: BorderRadius.circular(20),
         boxShadow: [
           BoxShadow(
             color: AppColors.primary.withOpacity(0.15),
             blurRadius: 10,
             offset: const Offset(0, 5),
           ),
         ],
       ),
       child: Row(
         children: [
           Expanded(
             child: Column(
               crossAxisAlignment: CrossAxisAlignment.start,
               mainAxisAlignment: MainAxisAlignment.center,
               children: [
                 Container(
                   padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                   decoration: BoxDecoration(
                     color: Colors.white.withOpacity(0.15),
                     borderRadius: AppRadius.mdR,
                   ),
                   child: Text(
                     'AD · ${widget.ad.brandName}',
                     style: AppTypography.textTheme(AppColors.onPrimary).labelSmall?.copyWith(
                           fontWeight: FontWeight.w700,
                         ),
                   ),
                 ),
                 const SizedBox(height: 8),
                 Text(
                   widget.ad.title,
                   maxLines: 2,
                   overflow: TextOverflow.ellipsis,
                   style: AppTypography.textTheme(AppColors.onPrimary).bodyLarge?.copyWith(
                         fontWeight: FontWeight.w800,
                         height: 1.2,
                       ),
                 ),
                 const SizedBox(height: 12),
                 GestureDetector(
                   onTap: () async {
                     final uri = Uri.parse(widget.ad.targetLink);
                     if (await canLaunchUrl(uri)) {
                       await launchUrl(uri, mode: LaunchMode.externalApplication);
                     }
                   },
                   child: Container(
                     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                     decoration: BoxDecoration(
                       color: AppColors.promoOrange,
                       borderRadius: AppRadius.fullR,
                     ),
                     child: Text(
                       'Explore Offers',
                       style: AppTypography.textTheme(AppColors.onPrimary).labelSmall?.copyWith(
                             fontWeight: FontWeight.w800,
                           ),
                     ),
                   ),
                 ),
               ],
             ),
           ),
           const SizedBox(width: 12),
           if (widget.ad.mediaUrl.isNotEmpty)
             ClipRRect(
               borderRadius: AppRadius.mdR,
               child: CachedNetworkImage(
                 imageUrl: widget.ad.mediaUrl,
                 width: 90,
                 height: 90,
                 fit: BoxFit.cover,
                 placeholder: (_, __) => Container(color: Colors.white.withOpacity(0.1), width: 90, height: 90),
                 errorWidget: (_, __, ___) => const SizedBox.shrink(),
               ),
             ),
         ],
       ),
     );
   }
 }
