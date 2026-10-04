import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:local_auth/local_auth.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/widgets.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _ProfileState();
}

class _ProfileState extends ConsumerState<ProfileScreen> {
  final form = GlobalKey<FormState>();
  final name = TextEditingController();
  final email = TextEditingController();
  final account = TextEditingController();
  final ifsc = TextEditingController();
  bool notifications = true;
  bool initialized = false;
  AsyncValue<void> operation = const AsyncData(null);
  @override
  void dispose() {
    name.dispose();
    email.dispose();
    account.dispose();
    ifsc.dispose();
    super.dispose();
  }

  Future<void> save(bool bank) async {
    if (!bank && !form.currentState!.validate()) {
      return;
    }
    setState(() => operation = const AsyncLoading());
    final result = await AsyncValue.guard(() async {
      await ref.read(repositoryProvider).call(
          bank ? 'bank' : 'saveProfile',
          bank
              ? {'account': account.text, 'ifsc': ifsc.text.toUpperCase()}
              : {
                  'name': name.text,
                  'email': email.text,
                  'notifications': notifications
                });
      account.clear();
      ifsc.clear();
      ref.invalidate(profileProvider);
    });
    if (mounted) {
      setState(() => operation = result);
    }
  }

  Future<void> enableBiometric() async {
    try {
      final auth = LocalAuthentication();
      if (await auth.canCheckBiometrics &&
          await auth.authenticate(
              localizedReason: 'Enable biometric unlock',
              options: const AuthenticationOptions(biometricOnly: true))) {
        await ref.read(vaultProvider).preference('biometric', true);
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
              content: LocalizedText('Biometric login enabled')));
        }
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: LocalizedText('Biometrics unavailable on this device')));
      }
    }
  }

  @override
  Widget build(BuildContext context) => PageFrame(title: 'Profile', children: [
        AsyncPanel(
            value: ref.watch(profileProvider),
            retry: () => ref.invalidate(profileProvider),
            builder: (profile) {
              if (!initialized) {
                name.text = profile.name;
                email.text = profile.email;
                notifications = profile.notifications;
                initialized = true;
              }
              return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Form(
                        key: form,
                        child: Column(children: [
                          TextFormField(
                              controller: name,
                              decoration: InputDecoration(
                                  labelText: t(context, 'Full name')),
                              validator: (v) => (v ?? '').trim().isEmpty
                                  ? 'Enter your name'
                                  : null),
                          const SizedBox(height: 16),
                          TextFormField(
                              controller: email,
                              keyboardType: TextInputType.emailAddress,
                              decoration: InputDecoration(
                                  labelText: t(context, 'Email')),
                              validator: (v) =>
                                  RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
                                          .hasMatch(v ?? '')
                                      ? null
                                      : 'Enter a valid email'),
                        ])),
                    SwitchListTile(
                        value: notifications,
                        onChanged: (v) => setState(() => notifications = v),
                        title: const LocalizedText('Notification preferences')),
                    ActionButton('Save personal details',
                        onPressed:
                            operation.isLoading ? null : () => save(false)),
                    const SizedBox(height: 24),
                    LocalizedText(
                        'Bank account: ${profile.bankMasked.isEmpty ? 'Not linked' : profile.bankMasked}'),
                    TextField(
                        controller: account,
                        obscureText: true,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                            labelText: t(context, 'Bank account number'))),
                    const SizedBox(height: 16),
                    TextField(
                        controller: ifsc,
                        textCapitalization: TextCapitalization.characters,
                        decoration:
                            InputDecoration(labelText: t(context, 'IFSC'))),
                    const SizedBox(height: 16),
                    ActionButton('Verify and link bank',
                        onPressed:
                            operation.isLoading ? null : () => save(true)),
                    const SizedBox(height: 24),
                    const LocalizedText('Document vault'),
                    ...profile.documents.map((d) => ListTile(
                        title: LocalizedText(d),
                        leading: const Icon(Icons.verified_outlined))),
                    TextButton(
                        onPressed: () => saveDocument(ref, context, 'offer'),
                        child: const LocalizedText('Offer / KFS')),
                    TextButton(
                        onPressed: () =>
                            saveDocument(ref, context, 'agreement'),
                        child: const LocalizedText('Signed agreement')),
                    TextButton(
                        onPressed: () =>
                            saveDocument(ref, context, 'statement'),
                        child: const LocalizedText('Statement')),
                  ]);
            }),
        DropdownButtonFormField<ThemeMode>(
            value: ref.watch(themeProvider),
            decoration: InputDecoration(labelText: t(context, 'Appearance')),
            items: ThemeMode.values
                .map((e) =>
                    DropdownMenuItem(value: e, child: LocalizedText(e.name)))
                .toList(),
            onChanged: (v) => ref.read(themeProvider.notifier).state = v!),
        ActionButton('Enable biometric login', onPressed: enableBiometric),
        TextButton(
            onPressed: () => context.push('/privacy'),
            child: const LocalizedText('Privacy and data rights')),
        ActionButton('Logout',
            onPressed: () => ref.read(authProvider.notifier).logout()),
        if (operation.isLoading) const Skeleton(),
        if (operation.hasError)
          const LocalizedText('Save failed. Check details and retry.'),
      ]);
}

class PrivacyScreen extends ConsumerStatefulWidget {
  const PrivacyScreen({super.key});
  @override
  ConsumerState<PrivacyScreen> createState() => _PrivacyState();
}

class _PrivacyState extends ConsumerState<PrivacyScreen> {
  String status = '';
  @override
  Widget build(BuildContext context) =>
      PageFrame(title: 'Privacy and your rights', children: [
        const LocalizedText(
            'Authentication uses your mobile number. PAN, Aadhaar and selfie are collected with purpose-specific consent for KYC. Credit assessment uses authorized financial data. No contacts, call logs or SMS inbox are collected. Backend data must stay in Mumbai or Hyderabad with KMS encryption and immutable audit records.'),
        const LocalizedText(
            'You may request access, correction, consent withdrawal or deletion through the lender’s grievance channel. Mandatory legal retention may limit deletion. The live lender must provide its identity, retention periods, privacy notice and grievance officer before launch.'),
        const LocalizedText(
            'Camera, location and notification permissions can be revoked from your operating system settings. This app does not collect background location.'),
        ActionButton('Request data access / deletion',
            onPressed: ref.watch(authProvider).valueOrNull == true
                ? () async {
                    try {
                      await ref.read(repositoryProvider).call('deleteRequest',
                          {'request': 'contact-me-for-data-rights'});
                      if (mounted) {
                        setState(() => status =
                            'Request recorded. Support will confirm identity and applicable retention.');
                      }
                    } catch (_) {
                      if (mounted) {
                        setState(() =>
                            status = 'Unable to record request. Please retry.');
                      }
                    }
                  }
                : null),
        LocalizedText(status),
      ]);
}
