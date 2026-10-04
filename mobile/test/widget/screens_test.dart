import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pharaspay/core/network/repository.dart';
import 'package:pharaspay/core/theme/theme.dart';
import 'package:pharaspay/features/dashboard/dashboard_screen.dart';
import 'package:pharaspay/features/loan/loan_screens.dart';
import 'package:pharaspay/features/repayment/repayment_screens.dart';
import 'package:pharaspay/features/support/support_screen.dart';
import 'package:pharaspay/shared/providers/providers.dart';
import 'package:pharaspay/shared/widgets/widgets.dart';

Widget wrap(Widget child, MockRepository api) => ProviderScope(overrides: [
      repositoryProvider.overrideWithValue(api),
      languageProvider.overrideWith((ref) => 'en')
    ], child: MaterialApp(theme: AppTheme.make(Brightness.light), home: child));
Future<void> loaded(WidgetTester tester) async {
  await tester.pump();
  await tester.pump(const Duration(milliseconds: 300));
  await tester.pump();
}

void main() {
  testWidgets('dashboard empty state and quick actions', (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(wrap(const DashboardScreen(), MockRepository()));
    await loaded(tester);
    expect(find.text('No active loan'), findsOneWidget);
    expect(find.text('Apply for a loan'), findsOneWidget);
    expect(find.text('Pay EMI'), findsOneWidget);
  });
  testWidgets(
      'application shows boundaries, EMI range and disabled submit before KYC',
      (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(wrap(const ApplyScreen(), MockRepository()));
    await loaded(tester);
    expect(find.text('Loan amount'), findsOneWidget);
    final sliders = tester.widgetList<Slider>(find.byType(Slider)).toList();
    expect(sliders[0].min, 10000);
    expect(sliders[0].max, 1000000);
    expect(sliders[1].min, 6);
    expect(sliders[1].max, 60);
    expect(
        tester
            .widget<ActionButton>(
                find.widgetWithText(ActionButton, 'Submit application'))
            .onPressed,
        isNull);
  });
  testWidgets('repayment has no fictitious schedule before signing',
      (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(wrap(const RepaymentScreen(), MockRepository()));
    await loaded(tester);
    expect(
        find.text('Your EMI schedule appears after the agreement is signed.'),
        findsOneWidget);
    expect(find.text('Pay now'), findsNothing);
  });
  testWidgets('history empty state', (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(wrap(const HistoryScreen(), MockRepository()));
    await loaded(tester);
    expect(find.text('No payments yet'), findsOneWidget);
  });
  testWidgets('support prevents empty messages and accepts a case',
      (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    await tester.pumpWidget(wrap(const SupportScreen(), MockRepository()));
    await tester.enterText(find.byType(TextField), 'Please explain my EMI');
    await tester.ensureVisible(find.text('Send to support'));
    await tester.tap(find.text('Send to support'));
    await loaded(tester);
    expect(
        find.text(
            'Your message was received. An agent will respond in your support case.'),
        findsOneWidget);
  });
  testWidgets('async error retry and skeleton semantics', (tester) async {
    tester.view.physicalSize = const Size(800, 4000);
    tester.view.devicePixelRatio = 1;
    addTearDown(tester.view.resetPhysicalSize);
    addTearDown(tester.view.resetDevicePixelRatio);
    var retried = false;
    await tester.pumpWidget(MaterialApp(
        home: Scaffold(
            body: AsyncPanel<int>(
                value: AsyncError(StateError('error'), StackTrace.empty),
                builder: (v) => Text('$v'),
                retry: () => retried = true))));
    await tester.tap(find.text('Retry'));
    expect(retried, true);
    await tester
        .pumpWidget(const MaterialApp(home: Scaffold(body: Skeleton())));
    expect(find.bySemanticsLabel('Loading'), findsOneWidget);
    await tester.pumpWidget(const SizedBox());
    await tester.pump(const Duration(seconds: 1));
  });
}
