import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:pharaspay/core/network/repository.dart';
import 'package:pharaspay/core/network/client.dart';
import 'package:pharaspay/shared/models/models.dart';

Future<void> kyc(MockRepository api) async {
  await api.call('pan', {'pan': 'ABCDE1234F'});
  await api.call('aadhaar', {'otp': '123456'});
  await api.upload(Uint8List.fromList([1, 2, 3]));
  await api.call('liveness');
}

void main() {
  late MockRepository api;
  setUp(() => api = MockRepository());
  test('bad OTP rejected and tokens immutable JSON roundtrip', () async {
    await expectLater(
        api.call('login', {'otp': '111111'}), throwsA(isA<ApiFailure>()));
    final tokens = Tokens.fromJson(
        await api.call('login', {'otp': '123456'}) as Map<String, dynamic>);
    expect(Tokens.fromJson(tokens.toJson()), tokens);
  });
  test('KYC and valid loan terms required', () async {
    await expectLater(api.call('apply', {'amount': 100000, 'months': 12}),
        throwsA(isA<ApiFailure>()));
    await expectLater(
        api.call('aadhaar', {'otp': '123456'}), throwsA(isA<ApiFailure>()));
    await expectLater(api.call('liveness'), throwsA(isA<ApiFailure>()));
    await kyc(api);
    await expectLater(
        api.call('apply', {'amount': 9999, 'months': 12}), throwsArgumentError);
  });
  test(
      'complete loan journey conserves principal and prevents duplicate installment payment',
      () async {
    await kyc(api);
    final offer = Offer.fromJson(
        await api.call('apply', {'amount': 100000, 'months': 12})
            as Map<String, dynamic>);
    offer.validate();
    expect(offer.rate, inInclusiveRange(8, 12));
    expect(offer.fee + offer.gst, closeTo(1770, .001));
    expect(offer.reasons, isNotEmpty);
    await expectLater(
        api.call('esign', {'otp': '123456'}), throwsA(isA<ApiFailure>()));
    await api.call('accept');
    await expectLater(
        api.call('esign', {'otp': '000000'}), throwsA(isA<ApiFailure>()));
    await api.call('esign', {'otp': '123456'});
    expect(api.schedule.length, 12);
    expect(api.schedule.fold<double>(0, (s, e) => s + e.principal),
        closeTo(100000, .001));
    await api.call('pay', {'id': '1', 'method': 'UPI'});
    await expectLater(api.call('pay', {'id': '1', 'method': 'UPI'}),
        throwsA(isA<ApiFailure>()));
    expect(api.payments.length, 1);
    final quote = await api.call('prepaymentQuote') as Map<String, dynamic>;
    expect(quote['amount'] as double, lessThan(100000));
    await api.call('prepay');
    expect(
        (await api.call('dashboard') as Map<String, dynamic>)['active'], false);
    expect((await api.call('history') as List<dynamic>).length, 2);
  });
  test(
      'offer validation rejects missing SHAP reasons and invalid lender pricing',
      () {
    const offer = Offer(
        id: '1',
        amount: 100000,
        months: 12,
        rate: 10,
        feePercent: 1.5,
        apr: 13,
        reasons: ['INCOME'],
        agreement: 'terms',
        lender: 'lender',
        coolingOffDays: 3);
    expect(() => offer.copyWith(rate: 13).validate(), throwsArgumentError);
    expect(() => offer.copyWith(reasons: []).validate(), throwsStateError);
    expect(() => offer.copyWith(apr: double.nan).validate(), throwsStateError);
    expect(Offer.fromJson(offer.toJson()), offer);
  });
  test('bank masking, profile and audit contain no submitted PII', () async {
    await api.call('bank', {'account': '123456789012', 'ifsc': 'ABCD0123456'});
    expect(api.profile.bankMasked, '•••• 9012');
    await api.call('saveProfile', {
      'name': 'Customer',
      'email': 'customer@example.invalid',
      'notifications': false
    });
    expect(
        Profile.fromJson(await api.call('profile') as Map<String, dynamic>)
            .notifications,
        false);
    expect(api.audit.toString(), isNot(contains('123456789012')));
    expect(api.audit.toString(), isNot(contains('customer@example.invalid')));
    await expectLater(api.call('bank', {'account': '12', 'ifsc': 'BAD'}),
        throwsA(isA<ApiFailure>()));
  });
  test('documents are gated and PDF cross references are present', () async {
    await expectLater(api.document('agreement'), throwsA(isA<ApiFailure>()));
    await kyc(api);
    await api.call('apply', {'amount': 100000, 'months': 12});
    final data = String.fromCharCodes(await api.document('offer'));
    expect(data, startsWith('%PDF-1.4'));
    expect(data, contains('xref'));
    expect(data, contains('NOT A LEGAL DOCUMENT'));
    await api.call('reject');
    expect(await api.call('offer'), isNull);
    await expectLater(api.call('unknown'), throwsA(isA<ApiFailure>()));
  });
}
