import 'dart:convert';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:pharaspay/core/network/client.dart';
import 'package:pharaspay/core/storage/vault.dart';
import 'package:pharaspay/shared/models/models.dart';

class FakeVault extends Mock implements Vault {}

class Adapter implements HttpClientAdapter {
  final Future<ResponseBody> Function(RequestOptions) respond;
  Adapter(this.respond);
  @override
  Future<ResponseBody> fetch(RequestOptions options,
          Stream<Uint8List>? requestStream, Future<void>? cancelFuture) =>
      respond(options);
  @override
  void close({bool force = false}) {}
}

ResponseBody body(int status, Object data) =>
    ResponseBody.fromString(jsonEncode(data), status, headers: {
      Headers.contentTypeHeader: ['application/json']
    });
void main() {
  setUpAll(
      () => registerFallbackValue(const Tokens(access: 'a', refresh: 'r')));
  late FakeVault vault;
  late ApiClient client;
  setUp(() {
    vault = FakeVault();
    when(() => vault.tokens()).thenAnswer(
        (_) async => const Tokens(access: 'old', refresh: 'refresh'));
    when(() => vault.save(any())).thenAnswer((_) async {});
    when(() => vault.clear()).thenAnswer((_) async {});
    client = ApiClient(vault);
    client.dio.options.baseUrl = 'https://example.invalid';
  });
  test('public auth omits bearer and write carries idempotency key', () async {
    client.dio.httpClientAdapter = Adapter((o) async {
      expect(o.headers['Authorization'], isNull);
      expect(o.headers['Idempotency-Key'], 'stable-key');
      return body(200, {'sent': true});
    });
    await client.request('/otp',
        method: 'POST', public: true, key: 'stable-key');
  });
  test('401 rotates tokens and replays exactly once', () async {
    var calls = 0;
    client.dio.httpClientAdapter = Adapter((o) async {
      if (o.path == '/auth/refresh') {
        when(() => vault.tokens()).thenAnswer(
            (_) async => const Tokens(access: 'new', refresh: 'rotated'));
        return body(200, {'access': 'new', 'refresh': 'rotated'});
      }
      calls++;
      if (calls == 1) {
        return body(401, {});
      }
      expect(o.headers['Authorization'], 'Bearer new');
      expect(o.extra['retried'], true);
      return body(200, {'ok': true});
    });
    expect(await client.request('/account'), {'ok': true});
    expect(calls, 2);
    verify(() => vault.save(const Tokens(access: 'new', refresh: 'rotated')))
        .called(1);
  });
  test('failed refresh clears tokens and expires session', () async {
    var expired = false;
    client.onExpired = () => expired = true;
    client.dio.httpClientAdapter = Adapter((_) async => body(401, {}));
    await expectLater(client.request('/account'), throwsA(isA<ApiFailure>()));
    expect(expired, true);
    verify(() => vault.clear()).called(1);
  });
  test('public 401 never triggers refresh', () async {
    var requests = 0;
    client.dio.httpClientAdapter = Adapter((_) async {
      requests++;
      return body(401, {});
    });
    await expectLater(
        client.request('/login', public: true), throwsA(isA<ApiFailure>()));
    expect(requests, 1);
  });
  test('API errors never expose backend PII', () async {
    client.dio.httpClientAdapter =
        Adapter((_) async => body(500, {'message': 'private-pan'}));
    try {
      await client.request('/account');
      fail('expected failure');
    } on ApiFailure catch (e) {
      expect(e.toString(), isNot(contains('private-pan')));
    }
  });
}
