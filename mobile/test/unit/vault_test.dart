import 'dart:io';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:hive/hive.dart';
import 'package:pharaspay/core/storage/vault.dart';
import 'package:pharaspay/shared/models/models.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  test('encrypted vault stores preferences and secure tokens separately',
      () async {
    FlutterSecureStorage.setMockInitialValues({});
    final temporary =
        await Directory.systemTemp.createTemp('pharaspay-vault-test-');
    Hive.init(temporary.path);
    final box = await Hive.openBox<dynamic>('preferences-test',
        encryptionCipher: HiveAesCipher(List<int>.filled(32, 7)));
    final vault = Vault(const FlutterSecureStorage(), box);
    try {
      expect(await vault.tokens(), isNull);
      await vault
          .save(const Tokens(access: 'test-access', refresh: 'test-refresh'));
      expect((await vault.tokens())!.access, 'test-access');
      expect(box.get('tokens'), isNull);
      expect(vault.onboarded, false);
      expect(vault.language, 'en');
      await vault.preference('onboarded', true);
      await vault.preference('language', 'hi');
      expect(vault.onboarded, true);
      expect(vault.language, 'hi');
      await vault.preference('fixture', 'sensitive-fixture');
      await box.flush();
      final bytes =
          await File('${temporary.path}/preferences-test.hive').readAsBytes();
      expect(String.fromCharCodes(bytes), isNot(contains('sensitive-fixture')));
      await vault.clear();
      expect(await vault.tokens(), isNull);
    } finally {
      await box.deleteFromDisk();
      await temporary.delete();
    }
  });
}
