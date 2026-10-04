$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$localFlutter = Join-Path (Split-Path -Parent (Get-Location)) '.flutter-sdk/bin/flutter.bat'
if (Test-Path -LiteralPath $localFlutter) {
  $env:PUB_CACHE = Join-Path (Split-Path -Parent (Get-Location)) '.pub-cache'
  & $localFlutter run --dart-define=MOCK_API=true
} else {
  flutter run --dart-define=MOCK_API=true
}
if ($LASTEXITCODE -ne 0) { throw 'Flutter could not start. Check flutter doctor and attach an Android/iOS device.' }
