import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:mocktail/mocktail.dart';
import 'package:pharaspay/app.dart';
import 'package:pharaspay/core/network/repository.dart';
import 'package:pharaspay/core/router/router.dart';
import 'package:pharaspay/core/storage/vault.dart';
import 'package:pharaspay/shared/models/models.dart';
import 'package:pharaspay/shared/providers/providers.dart';

class MemoryBox extends Mock implements Box<dynamic> {}

class MemoryVault extends Vault {
  Tokens? current;
  MemoryVault(super.secure, super.preferences);
  @override
  Future<Tokens?> tokens() async => current;
  @override
  Future<void> save(Tokens value) async {
    current = value;
  }

  @override
  Future<void> clear() async {
    current = null;
  }
}

Future<void> tick(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 350));
  await tester.pump();
}

Future<void> tapText(WidgetTester tester, String text) async {
  final finder = find.text(text);
  await tester.ensureVisible(finder);
  await tester.tap(finder);
  await tick(tester);
}

void main() {
  late ProviderContainer container;
  late MockRepository api;
  late MemoryVault vault;
  setUp(() {
    final box = MemoryBox();
    when(() => box.get('onboarded', defaultValue: false)).thenReturn(true);
    when(() => box.get('language', defaultValue: 'en')).thenReturn('en');
    when(() => box.get('biometric', defaultValue: false)).thenReturn(false);
    when(() => box.keys).thenReturn(<dynamic>[]);
    when(() => box.put(any<dynamic>(), any<dynamic>()))
        .thenAnswer((_) async {});
    vault = MemoryVault(const FlutterSecureStorage(), box);
    api = MockRepository();
    container = ProviderContainer(overrides: [
      vaultProvider.overrideWithValue(vault),
      repositoryProvider.overrideWithValue(api),
      securityProvider.overrideWith((ref) async => true)
    ]);
  });
  tearDown(() => container.dispose());
  Future<void> mount(WidgetTester tester) async {
    await tester.pumpWidget(UncontrolledProviderScope(
        container: container, child: const PharasPayApp()));
    await tick(tester);
  }

  Future<void> navigate(WidgetTester tester, String path) async {
    container.read(routerProvider).go(path);
    await tick(tester);
  }

  testWidgets('onboarding slides, language selection and completion',
      (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    container.read(onboardedProvider.notifier).state = false;
    await mount(tester);
    expect(find.text('Borrow with confidence'), findsOneWidget);
    await tapText(tester, 'Next');
    await tick(tester);
    expect(find.text('Transparent pricing'), findsOneWidget);
    await tapText(tester, 'Next');
    await tick(tester);
    expect(find.text('You control your data'), findsOneWidget);
    await tapText(tester, 'Get started');
    await tick(tester);
    expect(container.read(onboardedProvider), true);
    expect(find.text('Welcome to PharasPay'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 1));
  });

  testWidgets('auth guard, OTP login, profile edit, support and logout',
      (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await mount(tester);
    expect(find.text('Welcome to PharasPay'), findsOneWidget);
    await tester.enterText(find.byType(TextFormField).first, '9876543210');
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pump();
    await tapText(tester, 'Send OTP');
    await tester.enterText(find.byType(TextFormField).last, '123456');
    await tapText(tester, 'Verify and continue');
    expect(container.read(authProvider).valueOrNull, true);
    await navigate(tester, '/profile');
    await tester.enterText(find.byType(TextFormField).first, 'Customer');
    await tester.enterText(
        find.byType(TextFormField).at(1), 'customer@example.invalid');
    await tapText(tester, 'Save personal details');
    expect(api.profile.name, 'Customer');
    await navigate(tester, '/privacy');
    await tapText(tester, 'Request data access / deletion');
    expect(find.textContaining('Request recorded.'), findsOneWidget);
    await navigate(tester, '/profile');
    await tapText(tester, 'Logout');
    expect(vault.current, isNull);
    expect(find.text('Welcome to PharasPay'), findsOneWidget);
    await container.read(authProvider.notifier).lock();
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 1));
  });
  testWidgets('loan application to e-sign and repayment', (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await mount(tester);
    await tester.runAsync(() async {
      await container.read(authProvider.notifier).login('9876543210', '123456');
      await api.call('pan', {'pan': 'ABCDE1234F'});
      await api.call('aadhaar', {'otp': '123456'});
      await api.upload(Uint8List.fromList([1]));
      await api.call('liveness');
    });
    await tick(tester);
    container.invalidate(profileProvider);
    await navigate(tester, '/apply');
    await tester.ensureVisible(find.byType(CheckboxListTile));
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pump();
    await tapText(tester, 'Submit application');
    await tick(tester);
    expect(find.text('Personalized interest rate'), findsOneWidget);
    await tapText(tester, 'Accept offer');
    await tick(tester);
    await tester.ensureVisible(find.byType(CheckboxListTile));
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pump();
    await tapText(tester, 'Request e-sign OTP');
    await tester.enterText(find.byType(TextField), '123456');
    await tapText(tester, 'Sign agreement');
    expect(api.signed, true);
    await tapText(tester, 'View loan status');
    await tapText(tester, 'Dashboard');
    expect(find.text('Next EMI'), findsOneWidget);
    await navigate(tester, '/repayment');
    await tester.ensureVisible(find.text('Pay now').first);
    await tester.tap(find.text('Pay now').first);
    await tick(tester);
    expect(api.payments.length, 1);
    await navigate(tester, '/history');
    expect(find.textContaining('Simulated success'), findsWidgets);
    await container.read(authProvider.notifier).lock();
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 1));
  });
  testWidgets('KYC verifies PAN and binds Aadhaar OTP step', (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await mount(tester);
    await tester.runAsync(() =>
        container.read(authProvider.notifier).login('9876543210', '123456'));
    await tick(tester);
    await navigate(tester, '/kyc');
    await tester.enterText(find.byType(TextFormField), 'ABCDE1234F');
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pump();
    await tapText(tester, 'Verify and continue');
    await tick(tester);
    expect(find.text('Step 2 of 3: Aadhaar OTP'), findsOneWidget);
    await tester.enterText(find.byType(TextFormField), '234567890123');
    await tester.tap(find.byType(CheckboxListTile));
    await tester.pump();
    await tapText(tester, 'Send Aadhaar OTP');
    await tick(tester);
    await tester.enterText(find.byType(TextFormField), '123456');
    await tapText(tester, 'Verify and continue');
    await tick(tester);
    expect(find.text('Step 3 of 3: Selfie and liveness'), findsOneWidget);
    await container.read(authProvider.notifier).lock();
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 1));
  });
  testWidgets('inactivity locks session after fifteen minutes', (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await mount(tester);
    // Start login under the fake clock so its inactivity timer is deterministic.
    final login =
        container.read(authProvider.notifier).login('9876543210', '123456');
    await tick(tester);
    await login;
    await tick(tester);
    await tester.pump(const Duration(minutes: 15));
    await tick(tester);
    expect(container.read(authProvider).valueOrNull, false);
    expect(find.text('Welcome to PharasPay'), findsOneWidget);
    await container.read(authProvider.notifier).lock();
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 1));
  });
  testWidgets('registration route and unknown biometric fail safely',
      (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await mount(tester);
    await navigate(tester, '/register');
    expect(find.text('Create account'), findsOneWidget);
    await tapText(tester, 'Use fingerprint / Face ID');
    expect(find.text('Authentication failed. Check your OTP and try again.'),
        findsOneWidget);
    await container.read(authProvider.notifier).lock();
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 1));
  });
}
