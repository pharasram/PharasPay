#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [ -d android ] || [ -d ios ]; then
  echo 'Platforms already exist; apply template updates manually.' >&2
  exit 1
fi
temporary="$(mktemp -d)/pharaspay"
flutter create --platforms=android,ios --org com.pharaspay --project-name pharaspay --no-pub "$temporary"
cp -R "$temporary/android" android
cp -R "$temporary/ios" ios
cp "$temporary/.metadata" .metadata
cp platform_templates/android/MainActivity.kt android/app/src/main/kotlin/com/pharaspay/pharaspay/MainActivity.kt
cp platform_templates/android/AndroidManifest.xml android/app/src/main/AndroidManifest.xml
cp platform_templates/android/build.gradle.kts android/app/build.gradle.kts
cp platform_templates/android/proguard-rules.pro android/app/proguard-rules.pro
if [ -f android/app/build.gradle ]; then mv android/app/build.gradle android/app/build.gradle.generated-backup; fi
cp platform_templates/ios/AppDelegate.swift ios/Runner/AppDelegate.swift
cp platform_templates/ios/Podfile ios/Podfile
/usr/libexec/PlistBuddy -c 'Add :NSCameraUsageDescription string Capture a selfie with your consent for identity verification.' ios/Runner/Info.plist
/usr/libexec/PlistBuddy -c 'Add :NSFaceIDUsageDescription string Unlock PharasPay using Face ID.' ios/Runner/Info.plist
/usr/libexec/PlistBuddy -c 'Add :NSLocationWhenInUseUsageDescription string Optional one-time KYC fraud prevention with your consent.' ios/Runner/Info.plist
/usr/libexec/PlistBuddy -c 'Add :NSAppTransportSecurity dict' ios/Runner/Info.plist
/usr/libexec/PlistBuddy -c 'Add :NSAppTransportSecurity:NSAllowsArbitraryLoads bool false' ios/Runner/Info.plist
flutter pub get
dart run build_runner build --delete-conflicting-outputs
