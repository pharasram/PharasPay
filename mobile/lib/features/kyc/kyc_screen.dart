import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';
import '../../core/utils/finance.dart';
import '../../shared/providers/providers.dart';
import '../../shared/widgets/widgets.dart';

class KycScreen extends ConsumerStatefulWidget {
  const KycScreen({super.key});
  @override
  ConsumerState<KycScreen> createState() => _KycState();
}

class _KycState extends ConsumerState<KycScreen> {
  final form = GlobalKey<FormState>();
  final pan = TextEditingController();
  final aadhaar = TextEditingController();
  final otp = TextEditingController();
  int step = 0;
  bool consent = false;
  bool sent = false;
  AsyncValue<void> operation = const AsyncData(null);
  @override
  void dispose() {
    pan.dispose();
    aadhaar.dispose();
    otp.dispose();
    super.dispose();
  }

  Future<void> run(Future<void> Function() action) async {
    setState(() => operation = const AsyncLoading());
    final result = await AsyncValue.guard(action);
    if (mounted) {
      setState(() => operation = result);
    }
  }

  Future<void> advance() async {
    if (!consent || !form.currentState!.validate()) {
      return;
    }
    await run(() async {
      final api = ref.read(repositoryProvider);
      await api.call('consent', {
        'scope': ['PAN', 'Aadhaar', 'Selfie'][step],
        'version': '2026-01',
        'granted': true
      });
      if (step == 0) {
        await api.call('pan', {'pan': pan.text.toUpperCase()});
        pan.clear();
        if (mounted) {
          setState(() {
            step = 1;
            consent = false;
          });
        }
      } else if (step == 1) {
        if (!sent) {
          await api.call('aadhaarOtp', {'aadhaar': aadhaar.text});
          aadhaar.clear();
          if (mounted) {
            setState(() => sent = true);
          }
        } else {
          await api.call('aadhaar', {'otp': otp.text});
          otp.clear();
          if (mounted) {
            setState(() {
              step = 2;
              consent = false;
            });
          }
        }
      } else {
        if (!(await Permission.camera.request()).isGranted) {
          throw StateError('Camera permission required');
        }
        final file = await ImagePicker().pickImage(
            source: ImageSource.camera,
            preferredCameraDevice: CameraDevice.front,
            imageQuality: 80);
        if (file == null) {
          return;
        }
        try {
          final bytes = await FlutterImageCompress.compressWithList(
              await file.readAsBytes(),
              minWidth: 1024,
              minHeight: 1024,
              quality: 75);
          await api.upload(bytes);
        } finally {
          // Camera plugins create a temporary plaintext image; remove it promptly.
          final temporary = File(file.path);
          if (await temporary.exists()) {
            await temporary.delete();
          }
        }
        // Backend must reject missing/expired provider liveness evidence in live mode.
        final result =
            await api.call('liveness', {'challenge': 'server-session-bound'});
        if ((result as Map<String, dynamic>)['verified'] != true) {
          throw StateError('Liveness verification failed');
        }
        ref.invalidate(profileProvider);
        if (mounted) {
          context.go('/apply');
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) =>
      PageFrame(title: 'Verify your identity', children: [
        LocalizedText('Step ${step + 1} of 3: ${[
          'PAN',
          'Aadhaar OTP',
          'Selfie and liveness'
        ][step]}'),
        LinearProgressIndicator(
            value: (step + 1) / 3, semanticsLabel: 'KYC progress'),
        Form(
            key: form,
            child: Column(children: [
              if (step == 0)
                TextFormField(
                    controller: pan,
                    textCapitalization: TextCapitalization.characters,
                    maxLength: 10,
                    decoration: InputDecoration(labelText: t(context, 'PAN')),
                    validator: (v) => panValidator(v?.toUpperCase())),
              if (step == 1 && !sent)
                TextFormField(
                    controller: aadhaar,
                    obscureText: true,
                    keyboardType: TextInputType.number,
                    maxLength: 12,
                    decoration: InputDecoration(
                        labelText: t(context, 'Aadhaar number')),
                    validator: (v) => RegExp(r'^[2-9]\d{11}$').hasMatch(v ?? '')
                        ? null
                        : 'Enter 12-digit Aadhaar'),
              if (step == 1 && sent)
                TextFormField(
                    controller: otp,
                    obscureText: true,
                    keyboardType: TextInputType.number,
                    maxLength: 6,
                    decoration:
                        InputDecoration(labelText: t(context, 'Aadhaar OTP')),
                    validator: otpValidator),
              if (step == 2)
                const LocalizedText(
                    'Position your face in good light. The production liveness provider must perform an active challenge and server verification; a selfie alone does not prove liveness.'),
            ])),
        CheckboxListTile(
            value: consent,
            onChanged: operation.isLoading
                ? null
                : (v) => setState(() => consent = v!),
            title: const LocalizedText(
                'I consent to this identity verification and its disclosed retention purpose.')),
        ActionButton(
            step == 2
                ? 'Capture selfie and verify'
                : step == 1 && !sent
                    ? 'Send Aadhaar OTP'
                    : 'Verify and continue',
            onPressed: consent && !operation.isLoading ? advance : null),
        if (operation.isLoading) const Skeleton(),
        if (operation.hasError)
          const LocalizedText(
              'Verification could not be completed. Check your details and retry.'),
      ]);
}
