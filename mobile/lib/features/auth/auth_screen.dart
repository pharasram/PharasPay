import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/utils/finance.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/widgets.dart';

class AuthScreen extends ConsumerStatefulWidget {
  final bool register;
  const AuthScreen({super.key, this.register = false});
  @override
  ConsumerState<AuthScreen> createState() => _AuthState();
}

class _AuthState extends ConsumerState<AuthScreen> {
  final form = GlobalKey<FormState>();
  final mobile = TextEditingController();
  final otp = TextEditingController();
  bool sent = false;
  bool consent = false;
  AsyncValue<void> request = const AsyncData(null);
  @override
  void dispose() {
    mobile.dispose();
    otp.dispose();
    super.dispose();
  }

  Future<void> send() async {
    if (mobileValidator(mobile.text) != null || !consent) {
      form.currentState!.validate();
      return;
    }
    setState(() => request = const AsyncLoading());
    final result = await AsyncValue.guard(() async {
      await ref
          .read(repositoryProvider)
          .call('otp', {'mobile': mobile.text, 'consentVersion': '2026-01'});
    });
    if (mounted) {
      setState(() {
        request = result;
        sent = !result.hasError;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return PageFrame(
        title: widget.register ? 'Create account' : 'Welcome to PharasPay',
        children: [
          const LocalizedText('Simple borrowing. Clear terms.',
              style: TextStyle(fontSize: 26, fontWeight: FontWeight.bold)),
          Form(
              key: form,
              child: Column(children: [
                TextFormField(
                    controller: mobile,
                    keyboardType: TextInputType.phone,
                    maxLength: 10,
                    enabled: !sent,
                    decoration: InputDecoration(
                        labelText: t(context, 'Mobile number'),
                        prefixText: '+91 '),
                    validator: mobileValidator),
                if (sent)
                  TextFormField(
                      controller: otp,
                      obscureText: true,
                      maxLength: 6,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(labelText: t(context, 'OTP')),
                      validator: otpValidator),
              ])),
          CheckboxListTile(
              value: consent,
              onChanged: (v) => setState(() => consent = v!),
              title: const LocalizedText(
                  'I consent to authentication and have reviewed the privacy information.')),
          TextButton(
              onPressed: () => context.push('/privacy'),
              child: const LocalizedText('Privacy, consent and data rights')),
          if (!sent)
            ActionButton('Send OTP',
                onPressed: consent && !request.isLoading ? send : null),
          if (sent)
            ActionButton('Verify and continue',
                onPressed: !auth.isLoading && consent
                    ? () {
                        if (form.currentState!.validate()) {
                          ref.read(authProvider.notifier).login(
                              mobile.text, otp.text,
                              register: widget.register);
                        }
                      }
                    : null),
          if (sent)
            TextButton(
                onPressed: request.isLoading ? null : send,
                child: const LocalizedText('Resend OTP')),
          if (auth.isLoading || request.isLoading) const Skeleton(),
          if (auth.hasError || request.hasError)
            const LocalizedText(
                'Authentication failed. Check your OTP and try again.'),
          ActionButton('Use fingerprint / Face ID',
              onPressed: auth.isLoading
                  ? null
                  : () => ref.read(authProvider.notifier).biometric()),
          TextButton(
              onPressed: () =>
                  context.go(widget.register ? '/login' : '/register'),
              child: LocalizedText(widget.register
                  ? 'Already have an account? Log in'
                  : 'Create an account')),
        ]);
  }
}
