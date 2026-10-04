import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/widgets.dart';

class SupportScreen extends ConsumerStatefulWidget {
  const SupportScreen({super.key});
  @override
  ConsumerState<SupportScreen> createState() => _SupportState();
}

class _SupportState extends ConsumerState<SupportScreen> {
  final message = TextEditingController();
  final List<String> messages = [];
  AsyncValue<void> operation = const AsyncData(null);
  @override
  void dispose() {
    message.dispose();
    super.dispose();
  }

  Future<void> send() async {
    if (message.text.trim().isEmpty) {
      return;
    }
    setState(() => operation = const AsyncLoading());
    final result = await AsyncValue.guard(() async {
      await ref
          .read(repositoryProvider)
          .call('support', {'message': message.text.trim()});
    });
    if (mounted) {
      setState(() {
        operation = result;
        if (!result.hasError) {
          messages.add(
              'Your message was received. An agent will respond in your support case.');
          message.clear();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) =>
      PageFrame(title: 'Help and support', children: [
        const ExpansionTile(
            title: LocalizedText('What are the charges?'),
            children: [
              Padding(
                  padding: EdgeInsets.all(16),
                  child: LocalizedText(
                      'Interest 8%–12% p.a.; processing fee 1%–2% plus GST. Your KFS discloses APR and all lender charges.'))
            ]),
        const ExpansionTile(
            title: LocalizedText('Can I prepay or cancel?'),
            children: [
              Padding(
                  padding: EdgeInsets.all(16),
                  child: LocalizedText(
                      'Review your agreement for prepayment terms and the cooling-off period. Request a quote before paying.'))
            ]),
        const ExpansionTile(
            title: LocalizedText('Where do I report a complaint?'),
            children: [
              Padding(
                  padding: EdgeInsets.all(16),
                  child: LocalizedText(
                      'Use the support case below. The live lender must disclose its grievance officer, response deadline and RBI complaint escalation channel.'))
            ]),
        const LocalizedText('Support chat / contact request'),
        ...messages.map((m) => Card(
            child: Padding(
                padding: const EdgeInsets.all(16), child: LocalizedText(m)))),
        TextField(
            controller: message,
            maxLines: 4,
            maxLength: 1000,
            decoration: InputDecoration(
                labelText: t(context, 'How can we help?'),
                helperText:
                    'Do not share OTPs, Aadhaar, card details or UPI PIN.')),
        ActionButton('Send to support',
            onPressed: operation.isLoading ? null : send),
        if (operation.isLoading) const Skeleton(),
        if (operation.hasError)
          const LocalizedText('Message failed. Please retry.'),
      ]);
}
