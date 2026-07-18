import 'package:flutter/material.dart';

/// WorkQuora design system — ONE file controls the look.
///
/// Per-app brand:  client = indigo (set below),  worker = green (swap 2 lines).
///
/// Colors reach widgets two ways, BOTH context-based — never a global flag:
///   • Material roles   → Theme.of(context).colorScheme.primary / .surface / ...
///   • Custom tokens    → Theme.of(context).extension<AppTokens>()!  (chipBg, muted, brandSoft, ...)
/// Never hardcode a Color and never read a mutable global. This is what makes
/// light/dark correct on every rebuild without a setDark() side effect.

class AppColors {
  // ── BRAND — the only per-app change ────────────────────────────
  // Client app (indigo):
  static const Color brand = Color(0xFF2E1CA8);
  static const Color brandDark = Color(0xFF8B82F2);
  // Worker app (green) — swap to these two in the worker repo:
  //   static const Color brand     = Color(0xFF137A47);
  //   static const Color brandDark = Color(0xFF4FBF87);

  // ── Neutrals / surfaces — shared by both apps ──────────────────
  static const Color bgLight = Color(0xFFF6F6FA);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color textLight = Color(0xFF1A1A22);
  static const Color mutedLight = Color(0xFF6B7280);
  static const Color borderLight = Color(0xFFEAEAF0);

  static const Color bgDark = Color(0xFF0F1017);
  static const Color surfaceDark = Color(0xFF191A22);
  static const Color textDark = Color(0xFFECEDF2);
  static const Color mutedDark = Color(0xFF9AA0AC);
  static const Color borderDark = Color(0xFF262733);

  // Semantic — shared
  static const Color success = Color(0xFF16A34A);
  static const Color danger = Color(0xFFE24B4A);
  static const Color warning = Color(0xFFE0A106);
}

class AppType {
  // Sizes only — the font itself (bundled Plus Jakarta Sans, see pubspec.yaml
  // fonts:) is applied via AppTheme.fontFamily below.
  static const String fontFamily = 'PlusJakartaSans';
  static const double display = 26;
  static const double h1 = 22;
  static const double h2 = 18;
  static const double title = 16;
  static const double body = 14;
  static const double label = 13;
  static const double caption = 11;
}

class AppSpace {
  static const double xs = 4, sm = 8, md = 12, lg = 16, xl = 24;
}

class AppRadius {
  static const double chip = 20, button = 14, card = 16;
}

/// Custom brand tokens not covered by [ColorScheme]. Read from context:
///   final t = Theme.of(context).extension<AppTokens>()!;
///   color: t.chipBg
class AppTokens extends ThemeExtension<AppTokens> {
  final Color muted;
  final Color border;
  final Color brandSoft; // tint for avatars, icon-fallback tiles
  final Color chipBg;
  final Color chipText;
  final Color success;
  final Color danger;
  final Color warning;

  const AppTokens({
    required this.muted,
    required this.border,
    required this.brandSoft,
    required this.chipBg,
    required this.chipText,
    required this.success,
    required this.danger,
    required this.warning,
  });

  // Tints derive from the brand via a low-alpha blend → auto-adapts to
  // indigo or green, and stays low-chroma so it never strains the eye.
  factory AppTokens.light(Color brand) => AppTokens(
        muted: AppColors.mutedLight,
        border: AppColors.borderLight,
        brandSoft:
            Color.alphaBlend(brand.withAlpha(26), AppColors.surfaceLight),
        chipBg: Color.alphaBlend(brand.withAlpha(20), AppColors.surfaceLight),
        chipText: brand,
        success: AppColors.success,
        danger: AppColors.danger,
        warning: AppColors.warning,
      );

  factory AppTokens.dark(Color brand) => AppTokens(
        muted: AppColors.mutedDark,
        border: AppColors.borderDark,
        brandSoft:
            Color.alphaBlend(brand.withAlpha(46), AppColors.surfaceDark),
        chipBg: Color.alphaBlend(brand.withAlpha(41), AppColors.surfaceDark),
        chipText: brand,
        success: AppColors.success,
        danger: AppColors.danger,
        warning: AppColors.warning,
      );

  @override
  AppTokens copyWith({
    Color? muted,
    Color? border,
    Color? brandSoft,
    Color? chipBg,
    Color? chipText,
    Color? success,
    Color? danger,
    Color? warning,
  }) =>
      AppTokens(
        muted: muted ?? this.muted,
        border: border ?? this.border,
        brandSoft: brandSoft ?? this.brandSoft,
        chipBg: chipBg ?? this.chipBg,
        chipText: chipText ?? this.chipText,
        success: success ?? this.success,
        danger: danger ?? this.danger,
        warning: warning ?? this.warning,
      );

  @override
  AppTokens lerp(ThemeExtension<AppTokens>? other, double t) {
    if (other is! AppTokens) return this;
    return AppTokens(
      muted: Color.lerp(muted, other.muted, t)!,
      border: Color.lerp(border, other.border, t)!,
      brandSoft: Color.lerp(brandSoft, other.brandSoft, t)!,
      chipBg: Color.lerp(chipBg, other.chipBg, t)!,
      chipText: Color.lerp(chipText, other.chipText, t)!,
      success: Color.lerp(success, other.success, t)!,
      danger: Color.lerp(danger, other.danger, t)!,
      warning: Color.lerp(warning, other.warning, t)!,
    );
  }
}

class AppTheme {
  static ThemeData get light => _build(Brightness.light);
  static ThemeData get dark => _build(Brightness.dark);

  static ThemeData _build(Brightness b) {
    final isLight = b == Brightness.light;
    final brand = isLight ? AppColors.brand : AppColors.brandDark;
    final bg = isLight ? AppColors.bgLight : AppColors.bgDark;
    final surface = isLight ? AppColors.surfaceLight : AppColors.surfaceDark;
    final text = isLight ? AppColors.textLight : AppColors.textDark;
    final border = isLight ? AppColors.borderLight : AppColors.borderDark;
    final tokens = isLight ? AppTokens.light(brand) : AppTokens.dark(brand);

    final scheme =
        ColorScheme.fromSeed(seedColor: AppColors.brand, brightness: b)
            .copyWith(
      primary: brand,
      surface: surface,
      onSurface: text,
      error: AppColors.danger,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: b,
      colorScheme: scheme,
      scaffoldBackgroundColor: bg,
      dividerColor: border,
      fontFamily: AppType.fontFamily,
      extensions: [tokens],
      textTheme: _textTheme(text, tokens.muted),
      appBarTheme: AppBarTheme(
        backgroundColor: bg,
        elevation: 0,
        centerTitle: true,
        foregroundColor: brand,
        titleTextStyle: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.h2, fontWeight: FontWeight.w700, color: brand),
      ),
      cardTheme: CardThemeData(
        color: surface,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.card),
          side: BorderSide(color: border),
        ),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: brand,
          foregroundColor: Colors.white,
          elevation: 0,
          minimumSize: const Size.fromHeight(52),
          shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.button)),
          textStyle: const TextStyle(
              fontFamily: AppType.fontFamily,
              fontSize: AppType.title, fontWeight: FontWeight.w600),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: surface,
        hintStyle: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.body, color: tokens.muted),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: AppSpace.lg, vertical: 14),
        border: _inputBorder(border),
        enabledBorder: _inputBorder(border),
        focusedBorder: _inputBorder(brand, 1.5),
      ),
    );
  }

  static TextTheme _textTheme(Color text, Color muted) => TextTheme(
        displaySmall: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.display,
            fontWeight: FontWeight.w700,
            color: text,
            height: 1.3),
        headlineMedium: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.h1,
            fontWeight: FontWeight.w700,
            color: text,
            height: 1.3),
        titleLarge: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.h2,
            fontWeight: FontWeight.w600,
            color: text,
            height: 1.3),
        titleMedium: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.title,
            fontWeight: FontWeight.w600,
            color: text,
            height: 1.3),
        bodyMedium: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.body, color: text, height: 1.4),
        bodySmall: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.label, color: muted, height: 1.4),
        labelSmall: TextStyle(
            fontFamily: AppType.fontFamily,
            fontSize: AppType.caption, color: muted, height: 1.3),
      );

  static OutlineInputBorder _inputBorder(Color c, [double w = 1]) =>
      OutlineInputBorder(
        borderRadius: BorderRadius.circular(AppRadius.button),
        borderSide: BorderSide(color: c, width: w),
      );
}
