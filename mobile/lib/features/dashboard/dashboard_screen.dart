import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/utils/finance.dart';
import '../../shared/models/models.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/widgets.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final language = ref.watch(languageProvider);
    final title = switch (language) {
      'hi' => 'आपका खाता',
      'ta' => 'உங்கள் கணக்கு',
      _ => 'Your money, at a glance'
    };
    return PageFrame(title: title, children: [
      AsyncPanel(
          value: ref.watch(dashboardProvider),
          retry: () => ref.invalidate(dashboardProvider),
          builder: (data) {
            final next = data['next'] == null
                ? null
                : Installment.fromJson(data['next'] as Map<String, dynamic>);
            return Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  if (data['active'] == true) ...[
                    Metric('Next EMI', rupees(next!.amount)),
                    LocalizedText('Due ${DateFormat.yMMMd().format(next.due)}'),
                    Metric('Outstanding principal',
                        rupees(data['outstanding'] as num)),
                  ] else
                    const Metric('Loan status', 'No active loan'),
                  Metric(
                      'Credit score${data['creditScore'] == null ? '' : ' (as reported by provider)'}',
                      data['creditScore']?.toString() ?? 'Not available'),
                ]);
          }),
      ActionButton('Apply for a loan', onPressed: () => context.push('/apply')),
      ActionButton('Pay EMI', onPressed: () => context.push('/repayment')),
      OutlinedButton(
          onPressed: () => context.push('/repayment'),
          child: const LocalizedText('View schedule')),
      OutlinedButton(
          onPressed: () => context.push('/history'),
          child: const LocalizedText('Payment history')),
      OutlinedButton(
          onPressed: () => context.push('/support'),
          child: const LocalizedText('Support')),
      OutlinedButton(
          onPressed: () => context.push('/profile'),
          child: const LocalizedText('Profile and settings')),
      OutlinedButton(
          onPressed: () => ref.invalidate(dashboardProvider),
          child: const LocalizedText('Refresh account')),
    ]);
  }
}
