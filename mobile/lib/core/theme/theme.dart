import 'package:flutter/material.dart';

class AppTheme {
  static const blue = Color(0xFF0A5CFF);
  static const green = Color(0xFF00C48C);
  static ThemeData make(Brightness brightness) {
    final scheme = ColorScheme.fromSeed(seedColor: blue, brightness: brightness)
        .copyWith(
            primary: blue,
            onPrimary: Colors.white,
            secondary: green,
            onSecondary: const Color(0xFF003325));
    return ThemeData(
        useMaterial3: true,
        colorScheme: scheme,
        scaffoldBackgroundColor: brightness == Brightness.light
            ? const Color(0xFFF5F7FC)
            : const Color(0xFF10131C),
        inputDecorationTheme: const InputDecorationTheme(
            border: OutlineInputBorder(), filled: true),
        filledButtonTheme: FilledButtonThemeData(
            style: FilledButton.styleFrom(minimumSize: const Size(48, 52))),
        textTheme: const TextTheme(
            headlineMedium:
                TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
            titleLarge: TextStyle(fontSize: 22, fontWeight: FontWeight.w600),
            bodyLarge: TextStyle(fontSize: 16, height: 1.5)));
  }
}
