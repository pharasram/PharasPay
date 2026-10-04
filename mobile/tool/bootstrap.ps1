$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
if (Test-Path -LiteralPath 'android') { throw 'Platforms already exist. Apply template updates manually to preserve native changes.' }
# Generate into a temporary workspace so flutter create cannot overwrite authored source.
$tempProject = Join-Path ([IO.Path]::GetTempPath()) ('pharaspay-' + [guid]::NewGuid())
flutter create --platforms=android,ios --org com.pharaspay --project-name pharaspay --no-pub $tempProject
if ($LASTEXITCODE -ne 0) { throw 'flutter create failed' }
Copy-Item -LiteralPath (Join-Path $tempProject 'android') -Destination 'android' -Recurse
Copy-Item -LiteralPath (Join-Path $tempProject 'ios') -Destination 'ios' -Recurse
Copy-Item -LiteralPath (Join-Path $tempProject '.metadata') -Destination '.metadata'
Copy-Item 'platform_templates/android/MainActivity.kt' 'android/app/src/main/kotlin/com/pharaspay/pharaspay/MainActivity.kt'
Copy-Item 'platform_templates/android/AndroidManifest.xml' 'android/app/src/main/AndroidManifest.xml'
Copy-Item 'platform_templates/android/build.gradle.kts' 'android/app/build.gradle.kts'
Copy-Item 'platform_templates/android/proguard-rules.pro' 'android/app/proguard-rules.pro'
Copy-Item 'platform_templates/ios/AppDelegate.swift' 'ios/Runner/AppDelegate.swift'
Copy-Item 'platform_templates/ios/Podfile' 'ios/Podfile'
# Flutter releases before Kotlin DSL generated app/build.gradle instead.
if (Test-Path -LiteralPath 'android/app/build.gradle') {
  Move-Item -LiteralPath 'android/app/build.gradle' -Destination 'android/app/build.gradle.generated-backup'
}
$plistPath = 'ios/Runner/Info.plist'
$plist = Get-Content -LiteralPath $plistPath -Raw
$keys = @'
<key>NSCameraUsageDescription</key><string>Capture a selfie with your consent for identity verification.</string>
<key>NSFaceIDUsageDescription</key><string>Unlock your PharasPay session using Face ID.</string>
<key>NSLocationWhenInUseUsageDescription</key><string>Optional one-time KYC fraud prevention with your consent.</string>
<key>NSAppTransportSecurity</key><dict><key>NSAllowsArbitraryLoads</key><false/></dict>
<key>LSSupportsOpeningDocumentsInPlace</key><false/>
'@
$plist = [regex]::Replace($plist, '</dict>\s*</plist>\s*$', $keys + "`n</dict>`n</plist>")
[IO.File]::WriteAllText((Join-Path (Get-Location) $plistPath), $plist)
flutter pub get
if ($LASTEXITCODE -ne 0) { throw 'Dependency resolution failed' }
dart run build_runner build --delete-conflicting-outputs
if ($LASTEXITCODE -ne 0) { throw 'Model generation failed' }
# The temporary generator output is intentionally retained for inspection.
Write-Output "Native projects initialized. Generator output: $tempProject"
