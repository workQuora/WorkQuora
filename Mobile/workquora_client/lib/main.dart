import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'app.dart';
import 'core/providers/auth_provider.dart';
import 'core/providers/jobs_provider.dart';
import 'core/providers/wallet_provider.dart';
import 'core/providers/job_detail_provider.dart';
import 'core/providers/theme_provider.dart';
import 'core/network/dio_client.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]);
  SystemChrome.setSystemUIOverlayStyle(const SystemUiOverlayStyle(
    statusBarColor: Colors.transparent,
    statusBarIconBrightness: Brightness.light,
  ));
  DioClient.instance.init();
  final prefs = await SharedPreferences.getInstance();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider(prefs)),
        ChangeNotifierProvider(create: (_) => JobsProvider()),
        ChangeNotifierProvider(create: (_) => WalletProvider()),
        ChangeNotifierProvider(create: (_) => JobDetailProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider(prefs)),
      ],
      child: const WorkQuoraClientApp(),
    ),
  );
}
