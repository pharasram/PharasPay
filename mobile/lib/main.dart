import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'app.dart';
import 'core/config/environment.dart';
import 'core/storage/vault.dart';
import 'core/utils/audit_logger.dart';
import 'shared/providers/providers.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  Environment.validate();
  diagnostic(DiagnosticEvent.started);
  final vault = await Vault.open();
  runApp(ProviderScope(
      overrides: [vaultProvider.overrideWithValue(vault)],
      child: const PharasPayApp()));
}
