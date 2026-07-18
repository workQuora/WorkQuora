import 'dart:async';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/api_constants.dart';
import '../../core/network/dio_client.dart';
import '../../core/providers/job_detail_provider.dart';
import '../../core/services/socket_service.dart';
import '../../core/utils/mobile_location.dart' if (dart.library.html) '../../core/utils/web_location.dart';
import '../../theme/app_theme.dart';
import '../../widgets/status_chip.dart';

/// Full-screen live tracker for an in-progress job, opened from Home's
/// active-job card. Shows the client's own location + the assigned
/// worker's location on a Google Map.
///
/// Live worker movement rides the EXISTING socket protocol
/// (Backend/src/Sockets/socketHandler.js): join room `jobId` via
/// 'join_job_room', then listen for 'receive_location' broadcasts (the
/// server relays whatever the assigned freelancer emits as 'send_location').
/// This screen never emits 'send_location' itself — only the worker app
/// does that. Until workquora_worker is updated to actually stream its
/// position, no 'receive_location' events will arrive, so the worker
/// marker falls back to the "last known" position from their profile
/// (the same location field their nearby-jobs radius search keeps
/// updated) — clearly labeled, never silently faked as live.
class JobTrackingScreen extends StatefulWidget {
  final String jobId;
  const JobTrackingScreen({super.key, required this.jobId});

  @override
  State<JobTrackingScreen> createState() => _JobTrackingScreenState();
}

class _JobTrackingScreenState extends State<JobTrackingScreen> with SingleTickerProviderStateMixin {
  GoogleMapController? _mapController;
  bool _hasFitBounds = false;

  bool _loadingJob = true;
  bool _noWorkerAssigned = false;
  bool _loadingWorker = false;
  Map<String, dynamic>? _worker;

  LatLng? _clientLatLng;
  bool _clientLocationDenied = false;

  LatLng? _workerLatLng;
  LatLng? _workerFromLatLng;
  LatLng? _workerToLatLng;
  bool _isLiveTracking = false;
  bool _workerMoving = false;
  DateTime? _workerLastUpdate;

  // Uber-style ETA countdown — ticks down once a second between location
  // updates, and snaps back to a freshly computed value (distance / assumed
  // 25km/h average city speed — there's no Directions API integration for a
  // real routed ETA) whenever a new position arrives, rather than counting
  // down to zero and sitting there stale.
  int? _etaSeconds;
  Timer? _etaTicker;

  late final AnimationController _tweenController;

  @override
  void initState() {
    super.initState();
    _tweenController = AnimationController(vsync: this, duration: const Duration(milliseconds: 900))
      ..addListener(_onTweenTick);
    _etaTicker = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_etaSeconds != null && _etaSeconds! > 0) setState(() => _etaSeconds = _etaSeconds! - 1);
    });
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  @override
  void dispose() {
    // No-op if _joinAndListen was never registered (job had no assigned
    // worker yet) — List.remove() is safe to call either way.
    SocketService().removeOnConnectListener(_joinAndListen);
    SocketService().offReceiveLocation();
    _tweenController.dispose();
    _etaTicker?.cancel();
    _mapController?.dispose();
    context.read<JobDetailProvider>().reset();
    super.dispose();
  }

  void _recomputeEta() {
    final distance = _liveDistanceMeters;
    if (distance == null) return;
    _etaSeconds = ((distance / 1000) / 25 * 3600).round();
  }

  // Called once the assigned worker is known AND on every socket reconnect
  // — a reconnect after the socket was suspended/killed in the background
  // can be a brand-new underlying connection server-side, which doesn't
  // remember this room membership. offReceiveLocation() before on() keeps
  // this idempotent.
  void _joinAndListen() {
    SocketService().joinJobRoom(widget.jobId);
    SocketService().offReceiveLocation();
    SocketService().onReceiveLocation(_onLocationUpdate);
  }

  Future<void> _init() async {
    final jobProvider = context.read<JobDetailProvider>();
    await jobProvider.fetchJob(widget.jobId);
    if (!mounted) return;

    Map<String, dynamic>? freelancerInfo;
    for (final p in jobProvider.proposals) {
      if (p['status'] == 'accepted') {
        freelancerInfo = p['freelancerInfo'] as Map<String, dynamic>?;
        break;
      }
    }
    final workerId = (freelancerInfo?['id'] ?? freelancerInfo?['_id'])?.toString();
    final hasWorker = workerId != null && workerId.isNotEmpty;

    setState(() {
      _loadingJob = false;
      _noWorkerAssigned = !hasWorker;
      _loadingWorker = hasWorker;
    });

    if (hasWorker) {
      _fetchWorkerProfile(workerId);
      _joinAndListen();
      SocketService().addOnConnectListener(_joinAndListen);
    }

    _fetchClientLocation();
  }

  Future<void> _fetchWorkerProfile(String workerId) async {
    try {
      final res = await DioClient.instance.dio.get('${ApiConstants.workerProfile}/$workerId');
      final data = Map<String, dynamic>.from(res.data['data'] ?? res.data);
      if (!mounted) return;
      final coords = data['location']?['coordinates'];
      setState(() {
        _worker = data;
        _loadingWorker = false;
        // Real last-known position (the worker's profile location, kept
        // updated by their own nearby-jobs search) — shown only until a
        // genuine live update arrives. [0,0] is the unset default; never
        // drop a marker on Null Island.
        if (coords is List && coords.length == 2 && !(coords[0] == 0 && coords[1] == 0)) {
          final ll = LatLng((coords[1] as num).toDouble(), (coords[0] as num).toDouble());
          _workerLatLng = ll;
          _workerToLatLng = ll;
        }
        _recomputeEta();
      });
      _maybeFitBounds();
    } catch (_) {
      if (!mounted) return;
      setState(() => _loadingWorker = false);
    }
  }

  Future<void> _fetchClientLocation() async {
    final pos = await getPlatformLocation();
    if (!mounted) return;
    if (pos == null) {
      setState(() => _clientLocationDenied = true);
      return;
    }
    setState(() { _clientLatLng = LatLng(pos['lat']!, pos['lng']!); _recomputeEta(); });
    _maybeFitBounds();
  }

  void _onLocationUpdate(Map<String, dynamic> data) {
    final lat = (data['latitude'] as num?)?.toDouble();
    final lng = (data['longitude'] as num?)?.toDouble();
    if (lat == null || lng == null || !mounted) return;
    final next = LatLng(lat, lng);
    final from = _workerLatLng ?? next;
    setState(() {
      _isLiveTracking = true;
      _workerMoving = _haversineMeters(from, next) > 5;
      _workerFromLatLng = from;
      _workerToLatLng = next;
      _workerLastUpdate = DateTime.now();
      _recomputeEta();
    });
    _tweenController
      ..reset()
      ..forward();
    _maybeFitBounds();
  }

  void _onTweenTick() {
    final from = _workerFromLatLng;
    final to = _workerToLatLng;
    if (from == null || to == null) return;
    setState(() => _workerLatLng = _lerpLatLng(from, to, _tweenController.value));
  }

  void _maybeFitBounds() {
    if (_hasFitBounds || _mapController == null || _clientLatLng == null || _workerLatLng == null) return;
    _hasFitBounds = true;
    final client = _clientLatLng!;
    final worker = _workerLatLng!;
    final bounds = LatLngBounds(
      southwest: LatLng(min(client.latitude, worker.latitude), min(client.longitude, worker.longitude)),
      northeast: LatLng(max(client.latitude, worker.latitude), max(client.longitude, worker.longitude)),
    );
    _mapController!.animateCamera(CameraUpdate.newLatLngBounds(bounds, 80));
  }

  double _haversineMeters(LatLng a, LatLng b) {
    const r = 6371000.0;
    final dLat = _deg2rad(b.latitude - a.latitude);
    final dLng = _deg2rad(b.longitude - a.longitude);
    final la1 = _deg2rad(a.latitude);
    final la2 = _deg2rad(b.latitude);
    final h = sin(dLat / 2) * sin(dLat / 2) + cos(la1) * cos(la2) * sin(dLng / 2) * sin(dLng / 2);
    return r * 2 * atan2(sqrt(h), sqrt(1 - h));
  }

  double _deg2rad(double deg) => deg * (pi / 180);

  LatLng _lerpLatLng(LatLng a, LatLng b, double t) =>
      LatLng(a.latitude + (b.latitude - a.latitude) * t, a.longitude + (b.longitude - a.longitude) * t);

  double? get _liveDistanceMeters =>
      (_clientLatLng != null && _workerLatLng != null) ? _haversineMeters(_clientLatLng!, _workerLatLng!) : null;

  String? get _lastUpdateLabel {
    final t = _workerLastUpdate;
    if (t == null) return null;
    final secs = DateTime.now().difference(t).inSeconds;
    if (secs < 5) return 'just now';
    if (secs < 60) return '${secs}s ago';
    return '${(secs / 60).floor()}m ago';
  }

  Future<void> _callWorker(String mobile) async {
    final uri = Uri(scheme: 'tel', path: mobile);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    } else if (mounted) {
      _showSnack('Could not open dialer');
    }
  }

  void _messageWorker(String workerId, String workerName, String workerPic) {
    context.push('/chat', extra: {
      'jobId': widget.jobId,
      'otherUserId': workerId,
      'otherUserName': workerName,
      'otherUserAvatar': workerPic.isEmpty ? null : workerPic,
    });
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    final job = context.watch<JobDetailProvider>().job;
    final jobTitle = job?['title']?.toString() ?? 'Job';

    return Scaffold(
      appBar: AppBar(title: Text(jobTitle, maxLines: 1, overflow: TextOverflow.ellipsis)),
      body: _buildBody(context, job),
    );
  }

  Widget _buildBody(BuildContext context, Map<String, dynamic>? job) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    if (_loadingJob) return const Center(child: CircularProgressIndicator());

    if (_noWorkerAssigned) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.xl),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(Icons.person_search_rounded, size: 48, color: tokens.muted),
            const SizedBox(height: AppSpace.md),
            Text('No worker assigned to this job yet.', style: theme.textTheme.bodyMedium, textAlign: TextAlign.center),
          ]),
        ),
      );
    }

    return Stack(
      children: [
        Positioned.fill(child: _buildMap(context)),
        Positioned(left: 0, right: 0, bottom: 0, child: _buildBottomPanel(context, job)),
      ],
    );
  }

  Widget _buildMap(BuildContext context) {
    if (_clientLatLng == null && _clientLocationDenied == false) {
      return const Center(child: CircularProgressIndicator());
    }
    final initialTarget = _clientLatLng ?? _workerLatLng ?? const LatLng(20.5937, 78.9629);
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GoogleMap(
      initialCameraPosition: CameraPosition(target: initialTarget, zoom: 14),
      markers: _buildMarkers(),
      polylines: _buildPolylines(context),
      style: isDark ? _darkMapStyle : null,
      myLocationEnabled: _clientLatLng != null,
      myLocationButtonEnabled: _clientLatLng != null,
      zoomControlsEnabled: false,
      onMapCreated: (controller) {
        _mapController = controller;
        _maybeFitBounds();
      },
    );
  }

  Set<Marker> _buildMarkers() {
    final markers = <Marker>{};
    if (_clientLatLng != null) {
      markers.add(Marker(
        markerId: const MarkerId('client'),
        position: _clientLatLng!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
        infoWindow: const InfoWindow(title: 'You'),
      ));
    }
    if (_workerLatLng != null) {
      markers.add(Marker(
        markerId: const MarkerId('worker'),
        position: _workerLatLng!,
        icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueViolet),
        infoWindow: InfoWindow(
          title: _worker?['name']?.toString() ?? 'Worker',
          snippet: _isLiveTracking ? 'Live' : 'Last seen',
        ),
      ));
    }
    return markers;
  }

  // Straight-line connector, not a routed path — there's no Directions API
  // integration here, and a fake road-following polyline would misrepresent
  // the worker's actual route. Still useful as an at-a-glance direction/
  // distance indicator, same spirit as the distance-based ETA below.
  Set<Polyline> _buildPolylines(BuildContext context) {
    if (_clientLatLng == null || _workerLatLng == null) return {};
    return {
      Polyline(
        polylineId: const PolylineId('worker_to_client'),
        points: [_workerLatLng!, _clientLatLng!],
        color: Theme.of(context).colorScheme.primary,
        width: 4,
        patterns: [PatternItem.dash(20), PatternItem.gap(10)],
      ),
    };
  }

  Widget _buildBottomPanel(BuildContext context, Map<String, dynamic>? job) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    final workerName = _worker?['name']?.toString() ?? 'Worker';
    final workerPic = (_worker?['profilePic'] ?? _worker?['avatar'])?.toString() ?? '';
    final rating = (_worker?['averageRating'] as num?)?.toDouble() ?? 0;
    final mobile = _worker?['mobileNumber']?.toString() ?? '';
    final workerId = (_worker?['id'] ?? _worker?['_id'])?.toString() ?? '';
    final jobTitle = job?['title']?.toString() ?? 'Job';
    final budget = job?['budget'] ?? job?['budgetRange']?['min'] ?? 0;

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(AppRadius.card)),
        border: Border.all(color: tokens.border, width: 0.5),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 16, offset: const Offset(0, -4))],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_isLiveTracking) _buildEtaCountdown(context),
              if (_isLiveTracking) const SizedBox(height: AppSpace.sm),
              _buildLiveStatusPill(context),
              const SizedBox(height: AppSpace.md),
              Row(children: [
                Icon(Icons.work_outline_rounded, size: 16, color: tokens.muted),
                const SizedBox(width: AppSpace.xs),
                Expanded(child: Text(jobTitle, style: theme.textTheme.bodyMedium, maxLines: 1, overflow: TextOverflow.ellipsis)),
                const SizedBox(width: AppSpace.sm),
                Text('₹$budget', style: theme.textTheme.bodyMedium?.copyWith(color: theme.colorScheme.primary, fontWeight: FontWeight.bold)),
              ]),
              const SizedBox(height: AppSpace.md),
              Divider(color: tokens.border, height: 1),
              const SizedBox(height: AppSpace.md),
              InkWell(
                borderRadius: BorderRadius.circular(AppRadius.button),
                onTap: () => _showWorkerDetailSheet(context, job),
                child: Row(children: [
                  CircleAvatar(
                    radius: 24,
                    backgroundColor: tokens.brandSoft,
                    backgroundImage: workerPic.isNotEmpty ? ResizeImage(NetworkImage(workerPic), width: 144, height: 144) : null,
                    child: workerPic.isEmpty
                        ? Text(workerName.isNotEmpty ? workerName[0].toUpperCase() : 'W',
                            style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold))
                        : null,
                  ),
                  const SizedBox(width: AppSpace.md),
                  Expanded(
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(_loadingWorker ? 'Loading…' : workerName, style: theme.textTheme.titleMedium),
                      const SizedBox(height: 2),
                      Row(children: [
                        Icon(Icons.star_rounded, size: 14, color: tokens.warning),
                        const SizedBox(width: 2),
                        Text(rating > 0 ? rating.toStringAsFixed(1) : 'New', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
                      ]),
                    ]),
                  ),
                  Icon(Icons.chevron_right_rounded, color: tokens.muted),
                ]),
              ),
              const SizedBox(height: AppSpace.lg),
              Row(children: [
                Expanded(
                  child: _ActionButton(icon: Icons.call_rounded, label: 'Call', onTap: mobile.isEmpty ? null : () => _callWorker(mobile)),
                ),
                const SizedBox(width: AppSpace.md),
                Expanded(
                  child: _ActionButton(
                    icon: Icons.chat_bubble_rounded,
                    label: 'Message',
                    onTap: workerId.isEmpty ? null : () => _messageWorker(workerId, workerName, workerPic),
                  ),
                ),
              ]),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildEtaCountdown(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final secs = _etaSeconds;
    if (secs == null) return const SizedBox.shrink();
    final minutes = (secs / 60).ceil();
    return Row(children: [
      Icon(Icons.timer_outlined, size: 22, color: theme.colorScheme.primary),
      const SizedBox(width: AppSpace.sm),
      Text(
        minutes <= 0 ? 'Arriving now' : '$minutes min',
        style: theme.textTheme.headlineMedium?.copyWith(color: theme.colorScheme.primary),
      ),
      if (minutes > 0) ...[
        const SizedBox(width: 4),
        Text('away', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
      ],
    ]);
  }

  Widget _buildLiveStatusPill(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;

    if (_workerLatLng == null) {
      return _statusPill(theme, tokens, icon: Icons.location_searching_rounded, label: 'Locating worker…', color: tokens.muted);
    }

    final distance = _liveDistanceMeters;
    final distanceText = distance == null ? null : (distance < 1000 ? '${distance.round()} m' : '${(distance / 1000).toStringAsFixed(1)} km');

    if (!_isLiveTracking) {
      return _statusPill(
        theme, tokens,
        icon: Icons.history_rounded,
        label: distanceText == null ? 'Last known location' : 'Last known location · $distanceText away',
        color: tokens.warning,
      );
    }

    final updateLabel = _lastUpdateLabel;
    final parts = <String>[
      updateLabel != null ? 'Live · updated $updateLabel' : 'Live',
      if (distanceText != null) '$distanceText away',
      _workerMoving ? 'moving' : 'stationary',
    ];
    return _statusPill(
      theme, tokens,
      icon: _workerMoving ? Icons.directions_run_rounded : Icons.pause_circle_outline_rounded,
      label: parts.join(' · '),
      color: tokens.success,
    );
  }

  Widget _statusPill(ThemeData theme, AppTokens tokens, {required IconData icon, required String label, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: AppSpace.md, vertical: AppSpace.sm),
      decoration: BoxDecoration(color: color.withValues(alpha: 0.12), borderRadius: BorderRadius.circular(AppRadius.chip)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 14, color: color),
        const SizedBox(width: AppSpace.xs),
        Flexible(child: Text(label, style: theme.textTheme.labelSmall?.copyWith(color: color, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis)),
      ]),
    );
  }

  void _showWorkerDetailSheet(BuildContext context, Map<String, dynamic>? job) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final workerName = _worker?['name']?.toString() ?? 'Worker';
    final workerPic = (_worker?['profilePic'] ?? _worker?['avatar'])?.toString() ?? '';
    final title = _worker?['title']?.toString() ?? 'Freelancer';
    final rating = (_worker?['averageRating'] as num?)?.toDouble() ?? 0;
    final kyc = _worker?['isKycVerified'] == true;
    final budget = job?['budget'] ?? job?['budgetRange']?['min'] ?? 0;
    final category = job?['category']?.toString() ?? '';
    final description = job?['description']?.toString() ?? '';

    showModalBottomSheet(
      context: context,
      backgroundColor: theme.colorScheme.surface,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.card))),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(AppSpace.xl),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Center(
                child: Container(width: 40, height: 4, decoration: BoxDecoration(color: tokens.border, borderRadius: BorderRadius.circular(2))),
              ),
              const SizedBox(height: AppSpace.lg),
              Row(children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: tokens.brandSoft,
                  backgroundImage: workerPic.isNotEmpty ? ResizeImage(NetworkImage(workerPic), width: 168, height: 168) : null,
                  child: workerPic.isEmpty
                      ? Text(workerName.isNotEmpty ? workerName[0].toUpperCase() : 'W',
                          style: TextStyle(color: theme.colorScheme.primary, fontWeight: FontWeight.bold, fontSize: 20))
                      : null,
                ),
                const SizedBox(width: AppSpace.md),
                Expanded(
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Row(children: [
                      Flexible(child: Text(workerName, style: theme.textTheme.titleMedium, overflow: TextOverflow.ellipsis)),
                      if (kyc) ...[const SizedBox(width: AppSpace.xs), Icon(Icons.verified_rounded, size: 16, color: tokens.success)],
                    ]),
                    Text(title, style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted)),
                    const SizedBox(height: 2),
                    Row(children: [
                      Icon(Icons.star_rounded, size: 14, color: tokens.warning),
                      const SizedBox(width: 2),
                      Text(rating > 0 ? '${rating.toStringAsFixed(1)} rating' : 'No ratings yet', style: theme.textTheme.bodySmall),
                    ]),
                  ]),
                ),
              ]),
              const SizedBox(height: AppSpace.xl),
              Divider(color: tokens.border, height: 1),
              const SizedBox(height: AppSpace.lg),
              Text('Job details', style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted, fontWeight: FontWeight.w600)),
              const SizedBox(height: AppSpace.sm),
              Text(job?['title']?.toString() ?? 'Job', style: theme.textTheme.titleMedium),
              const SizedBox(height: AppSpace.sm),
              Row(children: [
                if (category.isNotEmpty) ...[
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpace.sm, vertical: 4),
                    decoration: BoxDecoration(color: tokens.chipBg, borderRadius: BorderRadius.circular(AppRadius.chip)),
                    child: Text(category, style: theme.textTheme.labelSmall?.copyWith(color: tokens.chipText)),
                  ),
                  const SizedBox(width: AppSpace.sm),
                ],
                StatusChip.forJobStatus(context, job?['status']?.toString() ?? ''),
              ]),
              const SizedBox(height: AppSpace.sm),
              Text('₹$budget', style: theme.textTheme.titleMedium?.copyWith(color: theme.colorScheme.primary)),
              if (description.isNotEmpty) ...[
                const SizedBox(height: AppSpace.sm),
                Text(description, style: theme.textTheme.bodySmall?.copyWith(color: tokens.muted), maxLines: 4, overflow: TextOverflow.ellipsis),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _ActionButton({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final tokens = theme.extension<AppTokens>()!;
    final enabled = onTap != null;

    return Material(
      color: enabled ? tokens.brandSoft : tokens.chipBg,
      borderRadius: BorderRadius.circular(AppRadius.button),
      child: InkWell(
        borderRadius: BorderRadius.circular(AppRadius.button),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: AppSpace.sm),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Icon(icon, size: 20, color: enabled ? theme.colorScheme.primary : tokens.muted),
            const SizedBox(height: 2),
            Text(label, style: theme.textTheme.labelSmall?.copyWith(color: enabled ? theme.colorScheme.primary : tokens.muted)),
          ]),
        ),
      ),
    );
  }
}

// Standard "night mode" Google Maps style (from Google's own Maps Platform
// styling wizard samples) — applied only when the app theme is dark.
const String _darkMapStyle = '''
[
  {"elementType": "geometry", "stylers": [{"color": "#212121"}]},
  {"elementType": "labels.icon", "stylers": [{"visibility": "off"}]},
  {"elementType": "labels.text.fill", "stylers": [{"color": "#757575"}]},
  {"elementType": "labels.text.stroke", "stylers": [{"color": "#212121"}]},
  {"featureType": "administrative", "elementType": "geometry", "stylers": [{"color": "#757575"}]},
  {"featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{"color": "#9e9e9e"}]},
  {"featureType": "administrative.land_parcel", "stylers": [{"visibility": "off"}]},
  {"featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{"color": "#bdbdbd"}]},
  {"featureType": "poi", "elementType": "labels.text.fill", "stylers": [{"color": "#757575"}]},
  {"featureType": "poi.park", "elementType": "geometry", "stylers": [{"color": "#181818"}]},
  {"featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{"color": "#616161"}]},
  {"featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{"color": "#1b1b1b"}]},
  {"featureType": "road", "elementType": "geometry.fill", "stylers": [{"color": "#2c2c2c"}]},
  {"featureType": "road", "elementType": "labels.text.fill", "stylers": [{"color": "#8a8a8a"}]},
  {"featureType": "road.arterial", "elementType": "geometry", "stylers": [{"color": "#373737"}]},
  {"featureType": "road.highway", "elementType": "geometry", "stylers": [{"color": "#3c3c3c"}]},
  {"featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{"color": "#4e4e4e"}]},
  {"featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{"color": "#616161"}]},
  {"featureType": "transit", "elementType": "labels.text.fill", "stylers": [{"color": "#757575"}]},
  {"featureType": "water", "elementType": "geometry", "stylers": [{"color": "#000000"}]},
  {"featureType": "water", "elementType": "labels.text.fill", "stylers": [{"color": "#3d3d3d"}]}
]
''';
