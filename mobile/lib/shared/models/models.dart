import 'package:freezed_annotation/freezed_annotation.dart';
import '../../core/utils/finance.dart';
part 'models.freezed.dart';
part 'models.g.dart';

@freezed
class Tokens with _$Tokens {
  const factory Tokens({required String access, required String refresh}) =
      _Tokens;
  factory Tokens.fromJson(Map<String, dynamic> json) => _$TokensFromJson(json);
}

@freezed
class Offer with _$Offer {
  const Offer._();
  const factory Offer(
      {required String id,
      required double amount,
      required int months,
      required double rate,
      required double feePercent,
      required double apr,
      required List<String> reasons,
      required String agreement,
      required String lender,
      required int coolingOffDays}) = _Offer;
  factory Offer.fromJson(Map<String, dynamic> json) => _$OfferFromJson(json);
  double get emi => LoanRules.emi(amount, months, rate);
  double get fee => amount * feePercent / 100;
  double get gst => fee * .18;
  double get total => emi * months + fee + gst;
  void validate() {
    LoanRules.validate(amount, months, rate, feePercent);
    if (!apr.isFinite ||
        apr <= 0 ||
        reasons.isEmpty ||
        agreement.isEmpty ||
        lender.isEmpty ||
        coolingOffDays < 1) {
      throw StateError('Incomplete lender KFS or explanation');
    }
  }
}

@freezed
class Installment with _$Installment {
  const factory Installment(
      {required String id,
      required DateTime due,
      required double amount,
      required double principal,
      required double interest,
      @Default(false) bool paid}) = _Installment;
  factory Installment.fromJson(Map<String, dynamic> json) =>
      _$InstallmentFromJson(json);
}

@freezed
class Payment with _$Payment {
  const factory Payment(
      {required String id,
      required double amount,
      required DateTime date,
      required String status,
      required String method}) = _Payment;
  factory Payment.fromJson(Map<String, dynamic> json) =>
      _$PaymentFromJson(json);
}

@freezed
class Profile with _$Profile {
  const factory Profile(
      {@Default('') String name,
      @Default('') String email,
      @Default('') String bankMasked,
      @Default(true) bool notifications,
      @Default(false) bool kycComplete,
      @Default([]) List<String> documents}) = _Profile;
  factory Profile.fromJson(Map<String, dynamic> json) =>
      _$ProfileFromJson(json);
}
