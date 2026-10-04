import 'dart:math';
import 'package:intl/intl.dart';

class LoanRules {
  static void validate(double amount, int months, double rate, double fee) {
    if (!amount.isFinite ||
        amount < 10000 ||
        amount > 1000000 ||
        months < 6 ||
        months > 60 ||
        !rate.isFinite ||
        rate < 8 ||
        rate > 12 ||
        !fee.isFinite ||
        fee < 1 ||
        fee > 2) {
      throw ArgumentError('Loan terms violate PharasPay limits');
    }
  }

  static double emi(double amount, int months, double rate) {
    validate(amount, months, rate, 1);
    final r = rate / 1200;
    final growth = pow(1 + r, months).toDouble();
    return amount * r * growth / (growth - 1);
  }

  /// Illustrative APR for monthly equal payments and fee withheld at funding.
  /// The regulated lender's KFS remains the authoritative APR.
  static double apr(double amount, int months, double rate, double fee) {
    validate(amount, months, rate, fee);
    final net = amount - amount * fee / 100 * 1.18;
    final payment = emi(amount, months, rate);
    var low = 0.0;
    var high = 1.0;
    for (var i = 0; i < 100; i++) {
      final r = (low + high) / 2;
      final pv = payment * (1 - pow(1 + r, -months)) / r;
      if (pv > net) {
        low = r;
      } else {
        high = r;
      }
    }
    return (low + high) / 2 * 1200;
  }
}

String rupees(num value) =>
    NumberFormat.currency(locale: 'en_IN', symbol: '₹', decimalDigits: 2)
        .format(value);
String? mobileValidator(String? v) => RegExp(r'^[6-9]\d{9}$').hasMatch(v ?? '')
    ? null
    : 'Enter a valid 10-digit Indian mobile number';
String? panValidator(String? v) =>
    RegExp(r'^[A-Z]{5}[0-9]{4}[A-Z]$').hasMatch(v ?? '')
        ? null
        : 'PAN format: ABCDE1234F';
String? otpValidator(String? v) =>
    RegExp(r'^\d{6}$').hasMatch(v ?? '') ? null : 'Enter the six-digit OTP';
