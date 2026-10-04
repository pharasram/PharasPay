import 'package:dio/dio.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:pharaspay/core/network/pinned_adapter.dart';
import 'package:pharaspay/core/config/environment.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  const channel = MethodChannel('pharaspay/api');
  tearDown(() => TestDefaultBinaryMessengerBinding
      .instance.defaultBinaryMessenger
      .setMockMethodCallHandler(channel, null));
  test('mock configuration accepts only allowed India region', () {
    Environment.validate();
    expect(Environment.region, 'ap-south-1');
  });
  test('native adapter passes pins, serialized body and response bytes',
      () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (call) async {
      final args = call.arguments as Map<dynamic, dynamic>;
      expect(args['host'], 'india.example.invalid');
      expect(args['pins'], ['public-certificate-hash']);
      expect(args['body'], Uint8List.fromList([1, 2]));
      return {
        'status': 200,
        'headers': {
          'content-type': ['application/json']
        },
        'body': Uint8List.fromList([123, 125])
      };
    });
    final adapter =
        PinnedAdapter('india.example.invalid', ['public-certificate-hash']);
    final response = await adapter.fetch(
        RequestOptions(
            path: 'https://india.example.invalid/test', method: 'POST'),
        Stream.value(Uint8List.fromList([1, 2])),
        null);
    expect(response.statusCode, 200);
    expect(response.headers['content-type'], ['application/json']);
    adapter.close(force: true);
  });
  test('host changes and HTTP are rejected before native transport', () async {
    final adapter = PinnedAdapter('india.example.invalid', ['pin']);
    for (final url in [
      'http://india.example.invalid/test',
      'https://other.example.invalid/test'
    ]) {
      await expectLater(adapter.fetch(RequestOptions(path: url), null, null),
          throwsA(isA<DioException>()));
    }
  });
  test('native failures are sanitized', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(
            channel,
            (_) async =>
                throw PlatformException(code: 'BAD', message: 'private-pan'));
    try {
      await PinnedAdapter('india.example.invalid', ['pin']).fetch(
          RequestOptions(path: 'https://india.example.invalid/test'),
          null,
          null);
      fail('Expected exception');
    } on DioException catch (e) {
      expect(e.type, DioExceptionType.connectionError);
      expect(e.toString(), isNot(contains('private-pan')));
    }
  });
  test('empty native response fails closed', () async {
    TestDefaultBinaryMessengerBinding.instance.defaultBinaryMessenger
        .setMockMethodCallHandler(channel, (_) async => null);
    await expectLater(
        PinnedAdapter('india.example.invalid', ['pin']).fetch(
            RequestOptions(path: 'https://india.example.invalid/test'),
            null,
            null),
        throwsA(isA<DioException>()));
  });
}
