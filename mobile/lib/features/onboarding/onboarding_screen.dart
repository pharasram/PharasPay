import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/widgets.dart';

class OnboardingScreen extends ConsumerStatefulWidget {
  const OnboardingScreen({super.key});
  @override
  ConsumerState<OnboardingScreen> createState() => _OnboardingState();
}

class _OnboardingState extends ConsumerState<OnboardingScreen> {
  final pages = PageController();
  int index = 0;
  @override
  void dispose() {
    pages.dispose();
    super.dispose();
  }

  Future<void> finish() async {
    final vault = ref.read(vaultProvider);
    await vault.preference('language', ref.read(languageProvider));
    await vault.preference('onboarded', true);
    ref.read(onboardedProvider.notifier).state = true;
    if (mounted) {
      context.go('/login');
    }
  }

  Future<void> permission(Permission permission, String purpose) async {
    final allowed = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
                title: const LocalizedText('Permission purpose'),
                content: LocalizedText(purpose),
                actions: [
                  TextButton(
                      onPressed: () => Navigator.pop(context, false),
                      child: const LocalizedText('Skip')),
                  TextButton(
                      onPressed: () => Navigator.pop(context, true),
                      child: const LocalizedText('Allow'))
                ]));
    if (allowed == true) {
      final status = await permission.request();
      await ref.read(repositoryProvider).call('consent',
          {'scope': permission.toString(), 'granted': status.isGranted});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
            content: LocalizedText(status.isGranted
                ? 'Permission enabled'
                : 'Permission declined; you can enable it in settings')));
      }
    }
  }

  @override
  Widget build(BuildContext context) =>
      PageFrame(title: 'PharasPay', children: [
        SizedBox(
            height: 240,
            child: PageView(
                controller: pages,
                onPageChanged: (v) => setState(() => index = v),
                children: const [
                  _Slide(
                      Icons.account_balance,
                      'Borrow with confidence',
                      '₹10,000 to ₹10,00,000. Tenures from 6 to 60 months.',
                      'विश्वास के साथ उधार लें'),
                  _Slide(
                      Icons.percent,
                      'Transparent pricing',
                      '8%–12% p.a. Processing fee 1%–2% + GST. Review the KFS before signing.',
                      'स्पष्ट ब्याज और शुल्क'),
                  _Slide(
                      Icons.shield_outlined,
                      'You control your data',
                      'Consent for each purpose. No contacts, call logs or SMS inbox access.',
                      'आपके डेटा पर आपका नियंत्रण'),
                ])),
        Center(child: LocalizedText('${index + 1} / 3')),
        DropdownButtonFormField<String>(
            value: ref.watch(languageProvider),
            decoration: InputDecoration(
                labelText: t(context, 'Language / भाषा / மொழி')),
            items: const [
              DropdownMenuItem(value: 'en', child: LocalizedText('English')),
              DropdownMenuItem(value: 'hi', child: LocalizedText('हिन्दी')),
              DropdownMenuItem(value: 'ta', child: LocalizedText('தமிழ்'))
            ],
            onChanged: (v) => ref.read(languageProvider.notifier).state = v!),
        const LocalizedText(
            'Camera access is requested during KYC. Location is optional and used only for a disclosed KYC purpose. Enter OTP manually; SMS inbox access is never requested.'),
        TextButton(
            onPressed: () => permission(Permission.notification,
                'Receive EMI reminders and account alerts. You can withdraw this permission in settings.'),
            child: const LocalizedText('Enable notifications (optional)')),
        TextButton(
            onPressed: () => permission(Permission.locationWhenInUse,
                'Optional one-time location for KYC fraud prevention. No background location is collected.'),
            child: const LocalizedText('Allow KYC location (optional)')),
        ActionButton(index < 2 ? 'Next' : 'Get started',
            onPressed: index < 2
                ? () => pages.nextPage(
                    duration: const Duration(milliseconds: 300),
                    curve: Curves.easeOut)
                : finish),
      ]);
}

class _Slide extends ConsumerWidget {
  final IconData icon;
  final String title;
  final String body;
  final String hindi;
  const _Slide(this.icon, this.title, this.body, this.hindi);
  @override
  Widget build(BuildContext context, WidgetRef ref) =>
      Column(mainAxisAlignment: MainAxisAlignment.center, children: [
        Icon(icon, size: 64, color: Theme.of(context).colorScheme.primary),
        const SizedBox(height: 16),
        LocalizedText(ref.watch(languageProvider) == 'hi' ? hindi : title,
            style: Theme.of(context).textTheme.titleLarge,
            textAlign: TextAlign.center),
        const SizedBox(height: 16),
        LocalizedText(body, textAlign: TextAlign.center),
      ]);
}
