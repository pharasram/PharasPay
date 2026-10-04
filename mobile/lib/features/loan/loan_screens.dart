import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/finance.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/widgets.dart';

class ApplyScreen extends ConsumerStatefulWidget {
  const ApplyScreen({super.key});
  @override
  ConsumerState<ApplyScreen> createState() => _ApplyState();
}

class _ApplyState extends ConsumerState<ApplyScreen> {
  double amount = 100000;
  int months = 12;
  String purpose = 'Education';
  bool consent = false;
  AsyncValue<void> operation = const AsyncData(null);
  Future<void> submit() async {
    setState(() => operation = const AsyncLoading());
    final result = await AsyncValue.guard(() async {
      await ref.read(repositoryProvider).call('apply', {
        'amount': amount,
        'months': months,
        'purpose': purpose,
        'consentVersion': '2026-01'
      });
      ref.invalidate(offerProvider);
    });
    if (mounted) {
      setState(() => operation = result);
      if (!result.hasError) {
        context.push('/offer');
      }
    }
  }

  @override
  Widget build(BuildContext context) =>
      PageFrame(title: 'Apply for a loan', children: [
        AsyncPanel(
            value: ref.watch(profileProvider),
            retry: () => ref.invalidate(profileProvider),
            builder: (profile) => profile.kycComplete
                ? const LocalizedText('KYC complete')
                : ActionButton('Complete KYC first',
                    onPressed: () => context.go('/kyc'))),
        Metric('Loan amount', rupees(amount)),
        Slider(
            value: amount,
            min: 10000,
            max: 1000000,
            divisions: 99,
            label: rupees(amount),
            onChanged: (v) => setState(() => amount = v)),
        LocalizedText('Tenure: $months months'),
        Slider(
            value: months.toDouble(),
            min: 6,
            max: 60,
            divisions: 54,
            label: '$months months',
            onChanged: (v) => setState(() => months = v.round())),
        DropdownButtonFormField<String>(
            value: purpose,
            decoration: InputDecoration(labelText: t(context, 'Purpose')),
            items: [
              'Education',
              'Medical',
              'Home improvement',
              'Business',
              'Other'
            ]
                .map((e) => DropdownMenuItem(value: e, child: LocalizedText(e)))
                .toList(),
            onChanged: (v) => setState(() => purpose = v!)),
        const LocalizedText(
            'Interest rate: 8%–12% p.a.\nProcessing fee: 1%–2% + GST'),
        Metric('Estimated monthly EMI range',
            '${rupees(LoanRules.emi(amount, months, 8))} – ${rupees(LoanRules.emi(amount, months, 12))}'),
        const LocalizedText(
            'Estimate only. Your offer includes the final rate, APR and all charges.'),
        CheckboxListTile(
            value: consent,
            onChanged: (v) => setState(() => consent = v!),
            title: const LocalizedText(
                'I consent to the credit assessment and explanation of this decision.')),
        ActionButton('Submit application',
            onPressed: consent &&
                    !operation.isLoading &&
                    ref.watch(profileProvider).valueOrNull?.kycComplete == true
                ? submit
                : null),
        if (operation.isLoading) const Skeleton(),
        if (operation.hasError)
          const LocalizedText('Application failed. Please retry.'),
      ]);
}

class OfferScreen extends ConsumerStatefulWidget {
  const OfferScreen({super.key});
  @override
  ConsumerState<OfferScreen> createState() => _OfferState();
}

class _OfferState extends ConsumerState<OfferScreen> {
  AsyncValue<void> operation = const AsyncData(null);
  Future<void> decide(bool accept) async {
    setState(() => operation = const AsyncLoading());
    final result = await AsyncValue.guard(() async {
      await ref.read(repositoryProvider).call(accept ? 'accept' : 'reject');
    });
    if (mounted) {
      setState(() => operation = result);
      if (!result.hasError) {
        ref.invalidate(offerProvider);
        context.go(accept ? '/agreement' : '/apply');
      }
    }
  }

  @override
  Widget build(BuildContext context) =>
      PageFrame(title: 'Your loan offer', children: [
        AsyncPanel(
            value: ref.watch(offerProvider),
            retry: () => ref.invalidate(offerProvider),
            builder: (offer) => offer == null
                ? ActionButton('Apply for a loan',
                    onPressed: () => context.go('/apply'))
                : Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                        Metric('Personalized interest rate',
                            '${offer.rate.toStringAsFixed(2)}% p.a.'),
                        Metric('Loan amount', rupees(offer.amount)),
                        Metric('Monthly EMI · ${offer.months} months',
                            rupees(offer.emi)),
                        Metric('APR (lender KFS)',
                            '${offer.apr.toStringAsFixed(2)}%'),
                        Metric('Processing fee (${offer.feePercent}%)',
                            rupees(offer.fee)),
                        Metric(
                            'GST on processing fee (18%)', rupees(offer.gst)),
                        Metric('Net disbursal',
                            rupees(offer.amount - offer.fee - offer.gst)),
                        Metric('Total payable including fees',
                            rupees(offer.total)),
                        LocalizedText(
                            'Lender: ${offer.lender}\nCooling-off period: ${offer.coolingOffDays} days'),
                        const SizedBox(height: 16),
                        const LocalizedText('Why this decision?'),
                        ...offer.reasons.map((r) => ListTile(
                            leading: const Icon(Icons.info_outline),
                            title: LocalizedText(r))),
                        TextButton(
                            onPressed: () =>
                                saveDocument(ref, context, 'offer'),
                            child: const LocalizedText(
                                'Download offer letter and KFS PDF')),
                        ActionButton('Accept offer',
                            onPressed: operation.isLoading
                                ? null
                                : () => decide(true)),
                        TextButton(
                            onPressed: operation.isLoading
                                ? null
                                : () => decide(false),
                            child: const LocalizedText('Reject offer')),
                      ])),
        if (operation.isLoading) const Skeleton(),
        if (operation.hasError)
          const LocalizedText('Unable to record your decision. Retry.'),
      ]);
}

class AgreementScreen extends ConsumerStatefulWidget {
  const AgreementScreen({super.key});
  @override
  ConsumerState<AgreementScreen> createState() => _AgreementState();
}

class _AgreementState extends ConsumerState<AgreementScreen> {
  final otp = TextEditingController();
  bool consent = false;
  bool sent = false;
  bool signed = false;
  AsyncValue<void> operation = const AsyncData(null);
  @override
  void dispose() {
    otp.dispose();
    super.dispose();
  }

  Future<void> sign() async {
    if (sent && otpValidator(otp.text) != null) {
      return;
    }
    setState(() => operation = const AsyncLoading());
    final result = await AsyncValue.guard(() async {
      await ref.read(repositoryProvider).call(sent ? 'esign' : 'esignOtp',
          sent ? {'otp': otp.text, 'consent': true} : {});
    });
    if (mounted) {
      setState(() {
        operation = result;
        if (!result.hasError) {
          if (sent) {
            signed = true;
          } else {
            sent = true;
          }
        }
      });
      if (signed) {
        otp.clear();
        ref.invalidate(dashboardProvider);
        ref.invalidate(scheduleProvider);
      }
    }
  }

  @override
  Widget build(BuildContext context) =>
      PageFrame(title: 'Agreement and e-sign', children: [
        AsyncPanel(
            value: ref.watch(offerProvider),
            retry: () => ref.invalidate(offerProvider),
            builder: (offer) => offer == null
                ? const LocalizedText('No offer available')
                : SelectableText(offer.agreement)),
        CheckboxListTile(
            value: consent,
            onChanged: (v) => setState(() => consent = v!),
            title: const LocalizedText(
                'I reviewed the KFS, agreement and all charges and consent to e-sign.')),
        if (sent && !signed)
          TextField(
              controller: otp,
              keyboardType: TextInputType.number,
              maxLength: 6,
              obscureText: true,
              decoration: InputDecoration(labelText: t(context, 'E-sign OTP'))),
        if (!signed)
          ActionButton(sent ? 'Sign agreement' : 'Request e-sign OTP',
              onPressed: consent && !operation.isLoading ? sign : null),
        if (signed) ...[
          const LocalizedText(
              'Agreement signed. Track lender-confirmed disbursal in loan status.'),
          ActionButton('Download signed agreement',
              onPressed: () => saveDocument(ref, context, 'agreement')),
          ActionButton('View loan status',
              onPressed: () => context.go('/status'))
        ],
        if (operation.isLoading) const Skeleton(),
        if (operation.hasError)
          const LocalizedText('E-sign failed. Check the OTP and retry.'),
      ]);
}

class LoanStatusScreen extends ConsumerWidget {
  const LoanStatusScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      PageFrame(title: 'Loan status', children: [
        AsyncPanel(
            value: ref.watch(dashboardProvider),
            retry: () => ref.invalidate(dashboardProvider),
            builder: (data) => LocalizedText(data['active'] == true
                ? 'Active loan · View dashboard for repayment details'
                : 'No active loan. Complete your application and agreement.')),
        ActionButton('Dashboard', onPressed: () => context.go('/home')),
      ]);
}
