import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pharaspay/core/config/translations.dart';
import 'package:pharaspay/core/theme/theme.dart';

double contrast(Color a, Color b) {
  final first = a.computeLuminance();
  final second = b.computeLuminance();
  return (max(first, second) + .05) / (min(first, second) + .05);
}

void main() {
  test('text color roles meet 4.5:1 in both themes', () {
    for (final brightness in Brightness.values) {
      final scheme = AppTheme.make(brightness).colorScheme;
      expect(scheme.primary, AppTheme.blue);
      expect(scheme.secondary, AppTheme.green);
      expect(contrast(scheme.primary, scheme.onPrimary),
          greaterThanOrEqualTo(4.5));
      expect(contrast(scheme.secondary, scheme.onSecondary),
          greaterThanOrEqualTo(4.5));
      expect(contrast(scheme.surface, scheme.onSurface),
          greaterThanOrEqualTo(4.5));
    }
  });
  test('English Hindi and regional Tamil labels, with safe fallback', () {
    expect(translate('Pay EMI', 'en'), 'Pay EMI');
    expect(translate('Pay EMI', 'hi'), 'EMI का भुगतान करें');
    expect(translate('Pay EMI', 'ta'), 'தவணையை செலுத்தவும்');
    expect(translate('Lender-issued text', 'hi'), 'Lender-issued text');
    for (final entry in translations.entries) {
      expect(entry.value.length, 2);
      expect(entry.value.every((v) => v.isNotEmpty), true);
    }
  });
}
