# PharasPay mobile

Flutter Android/iOS lending client with Riverpod, GoRouter, Freezed, Dio, Material 3, dark mode, encrypted Hive vault, secure tokens, PDF viewing, native security templates and a stateful memory-only demo backend.

## 1. Folder structure

```text
lib/
  main.dart
  app.dart
  core/
    config/environment.dart
    theme/theme.dart
    router/router.dart
    network/{client,repository}.dart
    storage/vault.dart
    utils/{finance,audit_logger}.dart
  features/
    auth/auth_screen.dart
    onboarding/onboarding_screen.dart
    kyc/kyc_screen.dart
    dashboard/dashboard_screen.dart
    loan/loan_screens.dart
    repayment/repayment_screens.dart
    profile/profile_screen.dart
    support/support_screen.dart
  shared/
    models/models.dart
    providers/providers.dart
    widgets/widgets.dart
test/{unit,widget}/
platform_templates/{android,ios}/
tool/
docs/API_CONTRACT.md
```

## 2. Code and implementation status

All listed screens have source implementations. Generated Freezed/JSON files come from build_runner. Native Android/iOS projects are included, generated with Flutter 3.29.3 and patched with the security templates. Bootstrap scripts can initialize a checkout without native folders; do not run `flutter create .` over the authored project.

The mock journey is login → KYC → apply → review offer → accept → e-sign → dashboard → repay / prepay → history. Demo OTP is **123456**. Sample credit score, lender, reasons and verification results are clearly labeled simulations. Demo data resets on logout/restart. No real funds move and no real identity checks occur.

JWT storage uses OS secure storage. Hive preferences and downloaded PDF bytes use AES encryption with a random secure-storage key. Tokens are never stored in Hive. Logout clears tokens and cached documents. The app starts locked; OTP or an opted-in local biometric check unlocks it. Inactivity locks after 15 minutes, including time spent backgrounded. The backend must independently enforce session expiration.

Live Dio transport uses trusted TLS certificate validation plus SHA256 leaf-certificate pins; configure overlapping pins for certificate rotation. No bad-certificate bypass exists. Minimum TLS 1.2 is required. Public authentication calls do not carry bearer tokens. A single in-flight refresh handles concurrent 401s, and each request is replayed at most once. There is no request-body logging. The JSON diagnostic logger only accepts a closed enum of nonsensitive events.

Android applies FLAG_SECURE across all screens, disables backup and cleartext, enables R8 and uses release signing. iOS covers background previews and detected screen recording; iOS cannot guarantee prevention of still screenshots. Native root/jailbreak checks are heuristics, not proof of integrity; add server Play Integrity/App Attest verification for production. Live mode fails closed when security channel is missing.

Brand colors are #0A5CFF and #00C48C. Green uses dark text rather than white. Material color roles provide body text contrast. Large text, screen reader semantics, touch targets and light/dark modes still need real device accessibility QA. Primary controls, titles and input labels support English/Hindi/Tamil through a translation catalog. Detailed notices, errors and lender-issued documents need reviewed Hindi/Tamil translations before a fully localized production launch.

SMS reading is intentionally excluded: manual OTP entry meets authentication needs without inbox access. Camera consent occurs at KYC. Optional foreground location and notification consent is disclosed. No background location/contact/call-log permissions exist. No push token registration or notification delivery backend is included.

The mock KYC step captures/compresses a selfie. Active liveness, PAN/Aadhaar verification, legal e-sign and provider checkout/mandates need authorized provider integrations. Bank verification, real credit scoring, support agent messaging, lender grievance contacts, legally complete KFS/agreements and immutable audit storage belong to the backend. Read `docs/API_CONTRACT.md` before switching to live mode. Production readiness and legal compliance are not asserted.

## 3. Tests

```sh
flutter pub get
dart run build_runner build --delete-conflicting-outputs
dart format lib test
flutter analyze
flutter test --coverage
dart run tool/check_coverage.dart coverage/lcov.info
```

Tests cover financial bounds, EMI/APR, validators, immutable model roundtrips, KYC ordering, offer terms/reasons, agreement prerequisites, schedule principal conservation, payment duplication, prepayment, bank masking, encrypted preferences, document gating, auth timeout, native adapter bridge, language catalog, text contrast, dashboard/application/schedule/history/support UI and async retry states. The latest run passed **36 tests with 84.0% authored Dart line coverage**. The gate requires 80%; generated files are excluded but authored screens are not. See `docs/VERIFICATION.md`. Hardware camera/biometric/security and TLS pin rotation tests need real devices/test certificates.

## 4. Run locally

Install Flutter 3.x (Dart >=3.4; 3.29.3 is the initial target), Android Studio SDK/JDK 17 for Android, or macOS/Xcode/CocoaPods for iOS. Flutter SDK is not committed. Confirm `flutter doctor` and accept Android SDK licenses.

Windows setup from `mobile` (native folders are already included):

```powershell
flutter pub get
dart run build_runner build --delete-conflicting-outputs
flutter run --dart-define=MOCK_API=true
```

macOS setup:

```sh
flutter pub get
dart run build_runner build --delete-conflicting-outputs
cd ios && pod install && cd ..
flutter run --dart-define=MOCK_API=true
```

After initialization, use `flutter pub get` and model generation when dependencies/models change. Select an Android/iOS device with `flutter devices`. Camera and biometrics require hardware or properly configured simulators. Production device checks intentionally reject an iOS simulator.

Demo: use a valid Indian mobile number and 123456, a PAN shaped ABCDE1234F, a twelve digit Aadhaar beginning 2–9 and 123456, then capture a selfie. Finish the offer and agreement to create an EMI schedule.

## 5. Build and deploy

Complete tests and coverage gate before release. Commit reviewed `pubspec.lock` after dependency resolution. Use a registered application/bundle ID and real app icons. Configure Cognito/backend/providers and an India-region API hostname. Pin SHA256 hashes are public configuration, not secrets. Provide current and next trusted leaf-certificate hashes as comma-separated lowercase hex values.

Android: create an upload keystore outside source control and configure ignored `android/key.properties` with `storeFile`, `storePassword`, `keyAlias`, `keyPassword`. Fetch signing materials into isolated CI from Secrets Manager; never commit them or expose values in logs. Release has no debug-key fallback.

```sh
flutter build apk --release --split-per-abi --obfuscate --split-debug-info=build/symbols/android --dart-define=MOCK_API=false --dart-define=AWS_REGION=ap-south-1 --dart-define=API_URL=https://YOUR_INDIA_API --dart-define=CERT_SHA256=CURRENT_HEX,NEXT_HEX
flutter build appbundle --release --obfuscate --split-debug-info=build/symbols/android --dart-define=MOCK_API=false --dart-define=AWS_REGION=ap-south-1 --dart-define=API_URL=https://YOUR_INDIA_API --dart-define=CERT_SHA256=CURRENT_HEX,NEXT_HEX
```

Outputs: `build/app/outputs/flutter-apk/` and `build/app/outputs/bundle/release/app-release.aab`. Upload signed AAB to Play Console internal testing, validate on real devices, complete Data Safety disclosures and lender/digital lending app requirements, then stage production rollout.

iOS requires macOS. Open `ios/Runner.xcworkspace`, set Apple team, unique bundle ID, iOS deployment target >=13 and distribution signing. Configure notification capabilities only when push integration is ready.

```sh
flutter build ipa --release --obfuscate --split-debug-info=build/symbols/ios --dart-define=MOCK_API=false --dart-define=AWS_REGION=ap-south-1 --dart-define=API_URL=https://YOUR_INDIA_API --dart-define=CERT_SHA256=CURRENT_HEX,NEXT_HEX
```

Output: `build/ios/ipa/`. Upload through Xcode Organizer/Transporter, run TestFlight QA, complete privacy disclosures and App Review. Store symbols, signing assets and logs with India-region KMS encryption. CodePipeline can orchestrate Android CodeBuild jobs and a separately managed macOS signing runner; CodeDeploy does not publish mobile binaries to app stores.

Official references: [Flutter Android release](https://docs.flutter.dev/deployment/android), [Flutter obfuscation](https://docs.flutter.dev/deployment/obfuscate), [RBI digital lending guidance](https://systemhealth.rbi.org.in/Scripts/NotificationUser.aspx_Id%3D12382%26Mode%3D0.html).
