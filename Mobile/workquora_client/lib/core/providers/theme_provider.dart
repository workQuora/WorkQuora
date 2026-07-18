import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

ThemeMode? _themeModeFromString(String? value) => switch (value) {
      'light' => ThemeMode.light,
      'dark' => ThemeMode.dark,
      'system' => ThemeMode.system,
      _ => null,
    };

bool _resolvesDark(ThemeMode mode) => switch (mode) {
      ThemeMode.dark => true,
      ThemeMode.light => false,
      ThemeMode.system => WidgetsBinding.instance.platformDispatcher.platformBrightness == Brightness.dark,
    };

/// Persists and exposes the app's [ThemeMode] (light/dark/system).
///
/// [AppTheme].light/.dark (lib/theme/app_theme.dart) are pure functions of
/// [Brightness] — every screen reads colors via `Theme.of(context)` +
/// `Theme.of(context).extension<AppTokens>()`, never a mutable global, so
/// there is nothing to sync here beyond the mode itself.
class ThemeProvider extends ChangeNotifier {
  static const _prefsKey = 'themeMode';

  final SharedPreferences _prefs;
  ThemeMode _mode;

  ThemeProvider(this._prefs) : _mode = _themeModeFromString(_prefs.getString(_prefsKey)) ?? ThemeMode.dark;

  ThemeMode get mode => _mode;
  ThemeMode get themeMode => _mode;

  // Used by app.dart to pick the status bar icon brightness.
  bool get isDarkMode => _resolvesDark(_mode);

  Future<void> setMode(ThemeMode mode) async {
    if (_mode == mode) return;
    _mode = mode;
    await _prefs.setString(_prefsKey, mode.name);
    notifyListeners();
  }
}
