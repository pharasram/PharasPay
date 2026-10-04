$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
flutter pub get
if ($LASTEXITCODE -ne 0) { throw 'Dependency resolution failed' }
dart run build_runner build --delete-conflicting-outputs
if ($LASTEXITCODE -ne 0) { throw 'Model generation failed' }
dart format --output=none --set-exit-if-changed lib test
if ($LASTEXITCODE -ne 0) { throw 'Run dart format lib test' }
flutter analyze
if ($LASTEXITCODE -ne 0) { throw 'Static analysis failed' }
flutter test --coverage
if ($LASTEXITCODE -ne 0) { throw 'Tests failed' }
dart run tool/check_coverage.dart
if ($LASTEXITCODE -ne 0) { throw 'Coverage below 80 percent' }
