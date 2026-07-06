import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class AppColors {
  static bool _isDark = true;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _isDark = prefs.getBool('isDarkMode') ?? true;
  }

  static bool get isDark => _isDark;

  static void setDarkMode(bool value) {
    _isDark = value;
  }

  // PRIMARY — Emerald Green (Worker identity)
  static Color get primary => const Color(0xFF10B981);
  static Color get primaryDark => const Color(0xFF059669);
  static Color get primaryLight => const Color(0xFF34D399);

  // ACCENT — kept indigo for contrast
  static Color get accent => const Color(0xFF6366F1);

  // BACKGROUNDS
  static Color get background => _isDark
      ? const Color(0xFF080F08) // very dark green-black
      : const Color(0xFFF0FDF4); // light green tint

  static Color get surface => _isDark
      ? const Color(0xFF0F1A0F) // dark green surface
      : const Color(0xFFFFFFFF);

  static Color get surface2 => _isDark
      ? const Color(0xFF162416)
      : const Color(0xFFF0FDF4);

  // TEXT
  static Color get textPrimary => _isDark
      ? const Color(0xFFF0FDF4)
      : const Color(0xFF052E16);

  static Color get textSecondary => _isDark
      ? const Color(0xFF6B7280)
      : const Color(0xFF374151);

  // BORDERS
  static Color get border => _isDark
      ? const Color(0xFF1A2E1A) // dark green border
      : const Color(0xFFD1FAE5); // light green border

  // STATUS COLORS (same across both apps)
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);

  // WORKER SPECIFIC
  static Color get earningsGreen => const Color(0xFF10B981);
  static Color get taskBlue => const Color(0xFF3B82F6);
}
