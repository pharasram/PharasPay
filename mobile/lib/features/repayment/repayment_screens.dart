import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../core/utils/finance.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/widgets.dart';

class RepaymentScreen extends ConsumerStatefulWidget {
  const RepaymentScreen({super.key});
  @override
  ConsumerState<RepaymentScreen> createState() => _RepaymentState();
}

class _RepaymentState extends ConsumerState<RepaymentScreen> {
  String method = 'UPI';
  AsyncValue<void> operation = const AsyncData(null);
  Future<void> transact(String action, Map<String, dynamic> data) async {
    setState(() => operation = const AsyncLoading());
    final result = await AsyncValue.guard(() async {
      final response = await ref.read(repositoryProvider).call(action, data)
          as Map<String, dynamic>;
      // Production response is pending until provider webhook/server confirms settlement.
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: LocalizedText(
                response['status'] as String? ?? 'Request recorded')));
      }
      ref.invalidate(scheduleProvider);
      ref.invalidate(historyProvider);
      ref.invalidate(dashboardProvider);
    });
    if (mounted) {
      setState(() => operation = result);
    }
  }

  Future<void> prepay() async {
    try {
      final quote = await ref.read(repositoryProvider).call('prepaymentQuote')
          as Map<String, dynamic>;
      if (!mounted) {
        return;
      }
      final confirmed = await showDialog<bool>(
          context: context,
          builder: (c) => AlertDialog(
                  title: const LocalizedText('Review prepayment'),
                  content: LocalizedText(
                      'Principal ${rupees(quote['amount'] as num)}\nFees ${rupees(quote['fee'] as num)}'),
                  actions: [
                    TextButton(
                        onPressed: () => Navigator.pop(c, false),
                        child: const LocalizedText('Cancel')),
                    TextButton(
                        onPressed: () => Navigator.pop(c, true),
                        child: const LocalizedText('Confirm'))
                  ]));
      if (confirmed == true) {
        await transact('prepay', {'method': method, 'quoteId': quote['id']});
      }
    } catch (_) {
      if (mounted) {
        setState(() => operation =
            AsyncError(StateError('Quote unavailable'), StackTrace.current));
      }
    }
  }

  Future<void> mandate() async {
    final confirm = await showDialog<bool>(
        context: context,
        builder: (c) => AlertDialog(
                title: const LocalizedText('Auto-debit consent'),
                content: const LocalizedText(
                    'Authorize the regulated lender’s mandate for scheduled EMIs. Review amount, frequency and cancellation terms in the provider flow.'),
                actions: [
                  TextButton(
                      onPressed: () => Navigator.pop(c, false),
                      child: const LocalizedText('Cancel')),
                  TextButton(
                      onPressed: () => Navigator.pop(c, true),
                      child: const LocalizedText('Continue'))
                ]));
    if (confirm == true) {
      await transact('autodebit', {'consent': true});
    }
  }

  @override
  Widget build(BuildContext context) =>
      PageFrame(title: 'Repayments', children: [
        DropdownButtonFormField<String>(
            value: method,
            decoration:
                InputDecoration(labelText: t(context, 'Payment method')),
            items: ['UPI', 'Netbanking', 'Debit card']
                .map((e) => DropdownMenuItem(value: e, child: LocalizedText(e)))
                .toList(),
            onChanged: (v) => setState(() => method = v!)),
        const LocalizedText(
            'Card details and UPI PIN must be entered only in the authorized payment provider’s secure checkout.'),
        AsyncPanel(
            value: ref.watch(scheduleProvider),
            retry: () => ref.invalidate(scheduleProvider),
            builder: (schedule) => schedule.isEmpty
                ? const LocalizedText(
                    'Your EMI schedule appears after the agreement is signed.')
                : Column(
                    children: schedule
                        .map((emi) => Card(
                            child: Padding(
                                padding: const EdgeInsets.all(12),
                                child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.stretch,
                                    children: [
                                      LocalizedText(
                                          'EMI ${emi.id} · ${DateFormat.yMMMd().format(emi.due)}'),
                                      LocalizedText(rupees(emi.amount),
                                          style: Theme.of(context)
                                              .textTheme
                                              .titleLarge),
                                      LocalizedText(
                                          'Principal ${rupees(emi.principal)} · Interest ${rupees(emi.interest)}'),
                                      if (emi.paid)
                                        const LocalizedText('Paid')
                                      else
                                        ActionButton('Pay now',
                                            onPressed: operation.isLoading
                                                ? null
                                                : () => transact('pay', {
                                                      'id': emi.id,
                                                      'method': method
                                                    })),
                                    ]))))
                        .toList())),
        ActionButton('Set up auto-debit',
            onPressed: operation.isLoading ? null : mandate),
        OutlinedButton(
            onPressed: operation.isLoading ? null : prepay,
            child: const LocalizedText('Prepay loan')),
        OutlinedButton(
            onPressed: () => saveDocument(ref, context, 'statement'),
            child: const LocalizedText('Download statement')),
        TextButton(
            onPressed: () => context.push('/history'),
            child: const LocalizedText('Payment history')),
        if (operation.isLoading) const Skeleton(),
        if (operation.hasError)
          const LocalizedText(
              'Payment request failed. Check status before retrying.'),
      ]);
}

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      PageFrame(title: 'Payment history', children: [
        AsyncPanel(
            value: ref.watch(historyProvider),
            retry: () => ref.invalidate(historyProvider),
            builder: (payments) => payments.isEmpty
                ? const LocalizedText('No payments yet')
                : Column(
                    children: payments.reversed
                        .map((p) => ListTile(
                            title: LocalizedText(rupees(p.amount)),
                            subtitle: LocalizedText(
                                '${DateFormat.yMMMd().format(p.date)} · ${p.method}\n${p.status}'),
                            trailing: const Icon(Icons.receipt_long)))
                        .toList())),
        ActionButton('Download statement',
            onPressed: () => saveDocument(ref, context, 'statement')),
      ]);
}
