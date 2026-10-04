import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:uuid/uuid.dart';
import '../../shared/models/models.dart';
import '../utils/finance.dart';
import 'client.dart';

abstract interface class Repository {
  Future<dynamic> call(String action,
      [Map<String, dynamic> payload = const {}]);
  Future<Uint8List> document(String kind);
  Future<void> upload(Uint8List bytes);
}

class LiveRepository implements Repository {
  final ApiClient client;
  LiveRepository(this.client);
  @override
  Future<dynamic> call(String action,
          [Map<String, dynamic> payload = const {}]) =>
      client.request('/mobile/actions/$action',
          method: 'POST',
          data: payload,
          public: ['otp', 'login', 'register'].contains(action),
          key: const Uuid().v4());
  @override
  Future<Uint8List> document(String kind) async {
    // Authenticated download through the pinned client; no arbitrary remote URLs.
    final response = await client.dio.get<List<int>>('/mobile/documents/$kind',
        options: Options(responseType: ResponseType.bytes));
    if (response.data == null ||
        response.headers.value('content-type')?.contains('application/pdf') !=
            true) {
      throw const ApiFailure('Document is unavailable');
    }
    return Uint8List.fromList(response.data!);
  }

  @override
  Future<void> upload(Uint8List bytes) async {
    await client.request('/mobile/kyc/selfie',
        method: 'POST',
        key: const Uuid().v4(),
        data: FormData.fromMap({
          'selfie': MultipartFile.fromBytes(bytes, filename: 'selfie.jpg')
        }));
  }
}

/// Memory-only fixtures. These simulate providers; they do not verify identity or settle money.
class MockRepository implements Repository {
  Profile profile =
      const Profile(name: 'Demo Customer', email: 'demo@example.invalid');
  Offer? offer;
  bool accepted = false;
  bool signed = false;
  bool panVerified = false;
  bool aadhaarVerified = false;
  bool selfieUploaded = false;
  final List<Installment> schedule = [];
  final List<Payment> payments = [];
  final List<Map<String, dynamic>> audit = [];
  @override
  Future<dynamic> call(String action,
      [Map<String, dynamic> payload = const {}]) async {
    await Future<void>.delayed(const Duration(milliseconds: 250));
    // Deliberately no payloads, identifiers or PII in the demo audit.
    audit.add(
        {'action': action, 'at': DateTime.now().toUtc().toIso8601String()});
    switch (action) {
      case 'otp':
      case 'aadhaarOtp':
      case 'esignOtp':
        return {'sent': true};
      case 'login':
      case 'register':
        if (payload['otp'] != '123456') {
          throw const ApiFailure('Incorrect demo OTP');
        }
        return const Tokens(access: 'mock-access', refresh: 'mock-refresh')
            .toJson();
      case 'pan':
        if (panValidator(payload['pan'] as String?) != null) {
          throw const ApiFailure('Invalid PAN');
        }
        panVerified = true;
        return {'verified': true};
      case 'aadhaar':
        if (!panVerified || payload['otp'] != '123456') {
          throw const ApiFailure('Complete PAN and enter demo OTP');
        }
        aadhaarVerified = true;
        return {'verified': true};
      case 'liveness':
        if (!aadhaarVerified || !selfieUploaded) {
          throw const ApiFailure('Capture a selfie after Aadhaar');
        }
        profile = profile.copyWith(
            kycComplete: true,
            documents: ['PAN verified', 'Aadhaar verified', 'Selfie verified']);
        return {'verified': true, 'simulation': true};
      case 'profile':
        return profile.toJson();
      case 'saveProfile':
        profile = profile.copyWith(
            name: payload['name'] as String,
            email: payload['email'] as String,
            notifications: payload['notifications'] as bool);
        return profile.toJson();
      case 'bank':
        final account = payload['account'] as String;
        if (!RegExp(r'^\d{9,18}$').hasMatch(account) ||
            !RegExp(r'^[A-Z]{4}0[A-Z0-9]{6}$')
                .hasMatch(payload['ifsc'] as String)) {
          throw const ApiFailure('Invalid account or IFSC');
        }
        profile = profile.copyWith(
            bankMasked: '•••• ${account.substring(account.length - 4)}');
        return profile.toJson();
      case 'apply':
        if (!profile.kycComplete) {
          throw const ApiFailure('Complete KYC before applying');
        }
        if (signed && schedule.any((e) => !e.paid)) {
          throw const ApiFailure('An active loan already exists');
        }
        final amount = (payload['amount'] as num).toDouble();
        final months = payload['months'] as int;
        LoanRules.validate(amount, months, 10, 1.5);
        offer = Offer(
            id: 'DEMO-OFFER',
            amount: amount,
            months: months,
            rate: 10,
            feePercent: 1.5,
            apr: LoanRules.apr(amount, months, 10, 1.5),
            lender: 'Demo lender (simulation)',
            coolingOffDays: 3,
            reasons: [
              'DEMO_SHAP_INCOME_STABILITY: consistent sample income',
              'DEMO_SHAP_PAYMENT_HISTORY: timely sample repayments'
            ],
            agreement:
                'DEMO AGREEMENT — NOT LEGALLY BINDING. Reducing balance loan at 10% p.a.; processing fee 1.5% plus 18% GST on fee. Monthly installments. Three day cooling-off period. No demo prepayment charge. Production agreement, KFS, lender details, grievance contact and all charges must be issued by the regulated lender.');
        signed = false;
        accepted = false;
        return offer!.toJson();
      case 'offer':
        return offer?.toJson();
      case 'accept':
        if (offer == null) {
          throw const ApiFailure('No offer available');
        }
        offer!.validate();
        accepted = true;
        return {'accepted': true};
      case 'reject':
        offer = null;
        accepted = false;
        return {'rejected': true};
      case 'esign':
        if (!accepted || payload['otp'] != '123456') {
          throw const ApiFailure('Accept the offer and enter demo OTP');
        }
        signed = true;
        schedule.clear();
        var balance = offer!.amount;
        final now = DateTime.now();
        for (var i = 1; i <= offer!.months; i++) {
          final interest = balance * offer!.rate / 1200;
          final principal =
              i == offer!.months ? balance : offer!.emi - interest;
          schedule.add(Installment(
              id: '$i',
              due: DateTime(now.year, now.month + i, 1),
              amount: principal + interest,
              principal: principal,
              interest: interest));
          balance -= principal;
        }
        return {'signed': true};
      case 'schedule':
        return schedule.map((e) => e.toJson()).toList();
      case 'history':
        return payments.map((e) => e.toJson()).toList();
      case 'dashboard':
        final pending = schedule.where((e) => !e.paid).toList();
        return {
          'active': signed && pending.isNotEmpty,
          'outstanding': pending.fold<double>(0, (s, e) => s + e.principal),
          'next': pending.isEmpty ? null : pending.first.toJson(),
          'creditScore': 750
        };
      case 'pay':
        final index =
            schedule.indexWhere((e) => e.id == payload['id'] && !e.paid);
        if (index < 0) {
          throw const ApiFailure('Installment already paid or unavailable');
        }
        final item = schedule[index];
        schedule[index] = item.copyWith(paid: true);
        payments.add(Payment(
            id: const Uuid().v4(),
            amount: item.amount,
            date: DateTime.now(),
            status: 'Simulated success',
            method: payload['method'] as String));
        return {'status': 'Simulated success'};
      case 'prepaymentQuote':
        return {
          'amount': schedule
              .where((e) => !e.paid)
              .fold<double>(0, (s, e) => s + e.principal),
          'fee': 0.0
        };
      case 'prepay':
        final amount = schedule
            .where((e) => !e.paid)
            .fold<double>(0, (s, e) => s + e.principal);
        if (amount <= 0) {
          throw const ApiFailure('No outstanding balance');
        }
        for (var i = 0; i < schedule.length; i++) {
          schedule[i] = schedule[i].copyWith(paid: true);
        }
        payments.add(Payment(
            id: const Uuid().v4(),
            amount: amount,
            date: DateTime.now(),
            status: 'Simulated success',
            method: 'Prepayment'));
        return {'status': 'Simulated success'};
      case 'autodebit':
        return {'status': 'Demo mandate enabled'};
      case 'consent':
      case 'logout':
      case 'support':
      case 'deleteRequest':
        return {'recorded': true};
      default:
        throw const ApiFailure('Unsupported operation');
    }
  }

  @override
  Future<void> upload(Uint8List bytes) async {
    if (bytes.isEmpty || bytes.length > 5 * 1024 * 1024) {
      throw const ApiFailure('Image must be under 5 MB');
    }
    selfieUploaded = true;
  }

  @override
  Future<Uint8List> document(String kind) async {
    if (kind == 'agreement' && !signed) {
      throw const ApiFailure('Sign agreement first');
    }
    if (kind == 'offer' && offer == null) {
      throw const ApiFailure('Apply first');
    }
    // Small valid single-page PDF, with a conspicuous simulation watermark.
    final stream =
        'BT /F1 14 Tf 40 760 Td (PharasPay DEMO $kind - NOT A LEGAL DOCUMENT) Tj ET';
    final objects = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
      '<< /Length ${stream.length} >>\nstream\n$stream\nendstream',
    ];
    var pdf = '%PDF-1.4\n';
    final offsets = <int>[0];
    for (var i = 0; i < objects.length; i++) {
      offsets.add(pdf.length);
      pdf += '${i + 1} 0 obj\n${objects[i]}\nendobj\n';
    }
    final xref = pdf.length;
    pdf += 'xref\n0 6\n0000000000 65535 f \n';
    for (final offset in offsets.skip(1)) {
      pdf += '${offset.toString().padLeft(10, '0')} 00000 n \n';
    }
    pdf += 'trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n$xref\n%%EOF';
    return Uint8List.fromList(pdf.codeUnits);
  }
}
