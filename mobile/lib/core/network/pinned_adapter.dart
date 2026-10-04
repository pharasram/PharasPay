import 'dart:async';
import 'dart:typed_data';
import 'package:dio/dio.dart';
import 'package:flutter/services.dart';

/// Native trust managers validate system trust and leaf pins during TLS handshake.
class PinnedAdapter implements HttpClientAdapter {
  final List<String> pins;
  final String host;
  static const channel = MethodChannel('pharaspay/api');
  PinnedAdapter(this.host, this.pins);
  @override
  Future<ResponseBody> fetch(RequestOptions options,
      Stream<Uint8List>? requestStream, Future<void>? cancelFuture) async {
    if (options.uri.scheme != 'https' || options.uri.host != host) {
      throw DioException(
          requestOptions: options, type: DioExceptionType.badCertificate);
    }
    final builder = BytesBuilder(copy: false);
    if (requestStream != null) {
      await for (final chunk in requestStream) {
        builder.add(chunk);
      }
    }
    try {
      final response =
          await channel.invokeMapMethod<String, dynamic>('request', {
        'url': options.uri.toString(),
        'host': host,
        'pins': pins,
        'method': options.method,
        'headers': options.headers.map((k, v) => MapEntry(k, v.toString())),
        'body': builder.takeBytes(),
      });
      if (response == null) {
        throw StateError('Empty native response');
      }
      final headers = (response['headers'] as Map<dynamic, dynamic>).map(
          (k, v) => MapEntry(k.toString(),
              (v as List<dynamic>).map((e) => e.toString()).toList()));
      return ResponseBody.fromBytes(
          response['body'] as Uint8List, response['status'] as int,
          headers: headers);
    } catch (_) {
      // Native exceptions may contain a URL or other PII; never propagate their text.
      throw DioException(
          requestOptions: options, type: DioExceptionType.connectionError);
    }
  }

  @override
  void close({bool force = false}) {}
}
