import 'package:flutter_test/flutter_test.dart';
import 'package:pharaspay/core/utils/finance.dart';

void main() {
  test('loan boundaries are inclusive', () {
    LoanRules.validate(10000, 6, 8, 1);
    LoanRules.validate(1000000, 60, 12, 2);
  });
  test('all invalid terms fail closed', () {
    for (final amount in [9999.0, 1000001.0, double.nan, double.infinity]) {
      expect(
          () => LoanRules.validate(amount, 12, 10, 1.5), throwsArgumentError);
    }
    for (final months in [0, 5, 61]) {
      expect(() => LoanRules.validate(10000, months, 10, 1.5),
          throwsArgumentError);
    }
    for (final rate in [7.99, 12.01, double.nan]) {
      expect(
          () => LoanRules.validate(10000, 12, rate, 1.5), throwsArgumentError);
    }
    for (final fee in [.99, 2.01, double.nan]) {
      expect(() => LoanRules.validate(10000, 12, 10, fee), throwsArgumentError);
    }
  });
  test('EMI uses reducing balance formula', () {
    expect(LoanRules.emi(100000, 12, 10), closeTo(8791.5887, .01));
    expect(
        LoanRules.emi(100000, 24, 10), lessThan(LoanRules.emi(100000, 12, 10)));
    expect(LoanRules.emi(100000, 12, 12),
        greaterThan(LoanRules.emi(100000, 12, 8)));
  });
  test('APR accounts for withheld fee and GST', () {
    expect(LoanRules.apr(100000, 12, 10, 1.5), greaterThan(10));
    expect(LoanRules.apr(100000, 12, 10, 2),
        greaterThan(LoanRules.apr(100000, 12, 10, 1)));
  });
  test('Indian formatting and validation', () {
    expect(rupees(100000), contains('1,00,000'));
    expect(mobileValidator('9876543210'), isNull);
    expect(mobileValidator('1234567890'), isNotNull);
    expect(panValidator('ABCDE1234F'), isNull);
    expect(panValidator('abcde1234f'), isNotNull);
    expect(otpValidator('123456'), isNull);
    expect(otpValidator('12345'), isNotNull);
  });
}
