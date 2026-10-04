import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:pdfrx/pdfrx.dart';
import '../../core/config/environment.dart';
import '../../core/config/translations.dart';
import '../providers/providers.dart';

String t(BuildContext context, String value) =>
    translate(value, Localizations.localeOf(context).languageCode);

class LocalizedText extends StatelessWidget {
  final String value;
  final TextStyle? style;
  final TextAlign? textAlign;
  const LocalizedText(this.value, {super.key, this.style, this.textAlign});
  @override
  Widget build(BuildContext context) =>
      Text(t(context, value), style: style, textAlign: textAlign);
}

class PageFrame extends StatelessWidget {
  final String title;
  final List<Widget> children;
  const PageFrame({super.key, required this.title, required this.children});
  @override
  Widget build(BuildContext context) => Scaffold(
      appBar: AppBar(title: LocalizedText(title)),
      body: SafeArea(
          child: Center(
              child: ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 640),
                  child: ListView(padding: const EdgeInsets.all(24), children: [
                    if (Environment.mock)
                      const Card(
                          child: Padding(
                              padding: EdgeInsets.all(12),
                              child: Text(
                                  'DEMO · No real verification, loan or payment. OTP: 123456'))),
                    ...children.map((w) => Padding(
                        padding: const EdgeInsets.only(bottom: 16), child: w)),
                  ])))));
}

class ActionButton extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  const ActionButton(this.label, {super.key, this.onPressed});
  @override
  Widget build(BuildContext context) => FilledButton(
      onPressed: onPressed == null
          ? null
          : () {
              HapticFeedback.lightImpact();
              onPressed!();
            },
      child: LocalizedText(label));
}

class Skeleton extends StatelessWidget {
  const Skeleton({super.key});
  @override
  Widget build(BuildContext context) => Semantics(
          label: 'Loading',
          child: Column(
              children: List.generate(
                  3,
                  (i) => Container(
                      height: 72,
                      margin: const EdgeInsets.only(bottom: 16),
                      decoration: BoxDecoration(
                          color: Theme.of(context)
                              .colorScheme
                              .surfaceContainerHighest,
                          borderRadius: BorderRadius.circular(16))))))
      .animate(onPlay: (controller) => controller.repeat())
      .shimmer(duration: 1200.ms);
}

class AsyncPanel<T> extends StatelessWidget {
  final AsyncValue<T> value;
  final Widget Function(T) builder;
  final VoidCallback retry;
  const AsyncPanel(
      {super.key,
      required this.value,
      required this.builder,
      required this.retry});
  @override
  Widget build(BuildContext context) => value.when(
      data: builder,
      loading: () => const Skeleton(),
      error: (_, __) => Column(children: [
            const Text('Unable to load. Please retry.'),
            TextButton(onPressed: retry, child: const Text('Retry'))
          ]));
}

class Metric extends StatelessWidget {
  final String label;
  final String value;
  const Metric(this.label, this.value, {super.key});
  @override
  Widget build(BuildContext context) => Card(
      child: Padding(
          padding: const EdgeInsets.all(20),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            LocalizedText(label),
            const SizedBox(height: 8),
            Text(value, style: Theme.of(context).textTheme.titleLarge)
          ])));
}

Future<void> saveDocument(
    WidgetRef ref, BuildContext context, String kind) async {
  try {
    final bytes = await ref.read(repositoryProvider).document(kind);
    await ref.read(vaultProvider).preferences.put('pdf_$kind', bytes);
    if (context.mounted) {
      await Navigator.of(context).push<void>(MaterialPageRoute(
          builder: (context) => Scaffold(
                appBar: AppBar(title: Text('$kind.pdf · encrypted vault')),
                body: PdfViewer.data(bytes, sourceName: '$kind.pdf'),
              )));
    }
  } catch (_) {
    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Document unavailable. Please retry.')));
    }
  }
}
