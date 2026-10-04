import 'dart:convert';
import 'dart:math';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../../shared/models/models.dart';

class Vault {
  final FlutterSecureStorage secure;
  final Box<dynamic> preferences;
  Vault(this.secure, this.preferences);
  static Future<Vault> open() async {
    await Hive.initFlutter();
    const secure = FlutterSecureStorage(
      aOptions: AndroidOptions(encryptedSharedPreferences: true),
      iOptions: IOSOptions(
          accessibility: KeychainAccessibility.first_unlock_this_device),
    );
    var key = await secure.read(key: 'hive_key');
    if (key == null) {
      key = base64Encode(
          List<int>.generate(32, (_) => Random.secure().nextInt(256)));
      await secure.write(key: 'hive_key', value: key);
    }
    final box = await Hive.openBox<dynamic>('preferences',
        encryptionCipher: HiveAesCipher(base64Decode(key)));
    return Vault(secure, box);
  }

  Future<Tokens?> tokens() async {
    final value = await secure.read(key: 'tokens');
    return value == null
        ? null
        : Tokens.fromJson(jsonDecode(value) as Map<String, dynamic>);
  }

  Future<void> save(Tokens tokens) =>
      secure.write(key: 'tokens', value: jsonEncode(tokens.toJson()));
  Future<void> clear() => secure.delete(key: 'tokens');
  bool get onboarded =>
      preferences.get('onboarded', defaultValue: false) as bool;
  String get language =>
      preferences.get('language', defaultValue: 'en') as String;
  Future<void> preference(String key, Object value) =>
      preferences.put(key, value);
}
