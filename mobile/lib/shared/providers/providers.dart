import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:local_auth/local_auth.dart';
import '../../core/config/environment.dart';
import '../../core/network/client.dart';
import '../../core/network/repository.dart';
import '../../core/storage/vault.dart';
import '../models/models.dart';

final vaultProvider =
    Provider<Vault>((ref) => throw StateError('Override at bootstrap'));
final clientProvider =
    Provider<ApiClient>((ref) => ApiClient(ref.watch(vaultProvider)));
final repositoryProvider = Provider<Repository>((ref) => Environment.mock
    ? MockRepository()
    : LiveRepository(ref.watch(clientProvider)));
final themeProvider = StateProvider<ThemeMode>((ref) => ThemeMode.system);
final languageProvider =
    StateProvider<String>((ref) => ref.watch(vaultProvider).language);
final onboardedProvider =
    StateProvider<bool>((ref) => ref.watch(vaultProvider).onboarded);
final profileProvider = FutureProvider<Profile>((ref) async => Profile.fromJson(
    await ref.watch(repositoryProvider).call('profile')
        as Map<String, dynamic>));
final offerProvider = FutureProvider<Offer?>((ref) async {
  final data = await ref.watch(repositoryProvider).call('offer');
  if (data == null) {
    return null;
  }
  final offer = Offer.fromJson(data as Map<String, dynamic>);
  offer.validate();
  return offer;
});
final scheduleProvider = FutureProvider<List<Installment>>((ref) async =>
    (await ref.watch(repositoryProvider).call('schedule') as List<dynamic>)
        .map((e) => Installment.fromJson(e as Map<String, dynamic>))
        .toList());
final historyProvider = FutureProvider<List<Payment>>((ref) async =>
    (await ref.watch(repositoryProvider).call('history') as List<dynamic>)
        .map((e) => Payment.fromJson(e as Map<String, dynamic>))
        .toList());
final dashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async =>
    await ref.watch(repositoryProvider).call('dashboard')
        as Map<String, dynamic>);
final authProvider = StateNotifierProvider<AuthController, AsyncValue<bool>>(
    (ref) => AuthController(ref));

class AuthController extends StateNotifier<AsyncValue<bool>> {
  final Ref ref;
  Timer? _timer;
  DateTime? _lastActivity;
  AuthController(this.ref) : super(const AsyncData(false)) {
    ref.read(clientProvider).onExpired = () {
      unawaited(logout(revoke: false));
    };
  }
  Future<void> login(String mobile, String otp, {bool register = false}) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final data = await ref.read(repositoryProvider).call(
          register ? 'register' : 'login', {'mobile': mobile, 'otp': otp});
      await ref
          .read(vaultProvider)
          .save(Tokens.fromJson(data as Map<String, dynamic>));
      touch();
      return true;
    });
  }

  Future<void> biometric() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final enabled = ref
          .read(vaultProvider)
          .preferences
          .get('biometric', defaultValue: false) as bool;
      if (!enabled) {
        throw const ApiFailure(
            'Enable biometric login in Profile after OTP login');
      }
      final authenticated = await LocalAuthentication().authenticate(
          localizedReason: 'Unlock PharasPay',
          options: const AuthenticationOptions(biometricOnly: true));
      if (!authenticated || await ref.read(vaultProvider).tokens() == null) {
        throw const ApiFailure('Use OTP login');
      }
      if (!Environment.mock) {
        await ref.read(clientProvider).request('/auth/session', method: 'POST');
      }
      touch();
      return true;
    });
  }

  void touch() {
    _lastActivity = DateTime.now();
    _timer?.cancel();
    _timer = Timer(const Duration(minutes: 15), () {
      unawaited(lock());
    });
  }

  void resumed() {
    if (_lastActivity != null &&
        DateTime.now().difference(_lastActivity!) >=
            const Duration(minutes: 15)) {
      unawaited(lock());
    }
  }

  Future<void> lock() async {
    _timer?.cancel();
    state = const AsyncData(false);
  }

  Future<void> logout({bool revoke = true}) async {
    _timer?.cancel();
    // Remove local credentials even if revocation cannot reach the server.
    try {
      if (revoke) {
        await ref.read(repositoryProvider).call('logout');
      }
    } catch (_) {
      /* Server expiration remains the fallback for offline revocation. */
    } finally {
      await ref.read(vaultProvider).clear();
      ref.invalidate(profileProvider);
      ref.invalidate(offerProvider);
      ref.invalidate(scheduleProvider);
      ref.invalidate(historyProvider);
      ref.invalidate(dashboardProvider);
      ref.invalidate(repositoryProvider);
      for (final key in ref.read(vaultProvider).preferences.keys.toList()) {
        if (key.toString().startsWith('pdf_')) {
          await ref.read(vaultProvider).preferences.delete(key);
        }
      }
      state = const AsyncData(false);
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
}

const securityChannel = MethodChannel('pharaspay/security');
final securityProvider = FutureProvider<bool>((ref) async {
  if (Environment.mock) {
    return true;
  }
  // Missing native implementation fails closed in production.
  return await securityChannel.invokeMethod<bool>('isTrustedDevice') ?? false;
});
