import 'package:dio/dio.dart';
import 'pinned_adapter.dart';
import '../config/environment.dart';
import '../storage/vault.dart';
import '../utils/audit_logger.dart';
import '../../shared/models/models.dart';

class ApiFailure implements Exception {
  final String message;
  const ApiFailure(this.message);
  @override
  String toString() => message;
}

class ApiClient {
  final Vault vault;
  late final Dio dio;
  Future<Tokens>? _refresh;
  void Function()? onExpired;
  ApiClient(this.vault) {
    dio = Dio(BaseOptions(
        baseUrl: Environment.apiUrl,
        connectTimeout: const Duration(seconds: 20),
        receiveTimeout: const Duration(seconds: 30),
        followRedirects: false));
    if (!Environment.mock) {
      final allowed = Environment.pins
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .toList();
      final host = Uri.parse(Environment.apiUrl).host;
      dio.httpClientAdapter = PinnedAdapter(host, allowed);
    }
    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final tokens = await vault.tokens();
        if (tokens != null && options.extra['public'] != true) {
          options.headers['Authorization'] = 'Bearer ${tokens.access}';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        final opts = error.requestOptions;
        if (error.response?.statusCode != 401 ||
            opts.extra['public'] == true ||
            opts.extra['retried'] == true) {
          handler.next(error);
          return;
        }
        try {
          final tokens = await (_refresh ??= _refreshTokens());
          opts.extra['retried'] = true;
          opts.headers['Authorization'] = 'Bearer ${tokens.access}';
          handler.resolve(await dio.fetch<dynamic>(opts));
        } catch (_) {
          await vault.clear();
          onExpired?.call();
          handler.next(error);
        } finally {
          _refresh = null;
        }
      },
    ));
  }
  Future<Tokens> _refreshTokens() async {
    final previous = await vault.tokens();
    if (previous == null) {
      throw const ApiFailure('Session expired');
    }
    final response = await dio.post<Map<String, dynamic>>('/auth/refresh',
        data: {'refresh_token': previous.refresh},
        options: Options(extra: {'public': true}));
    final tokens = Tokens.fromJson(response.data!);
    await vault.save(tokens);
    return tokens;
  }

  Future<dynamic> request(String path,
      {String method = 'GET',
      Object? data,
      bool public = false,
      String? key}) async {
    try {
      final result = await dio.request<dynamic>(path,
          data: data,
          options: Options(
              method: method,
              extra: {'public': public},
              headers: key == null ? null : {'Idempotency-Key': key}));
      return result.data;
    } on DioException catch (e) {
      diagnostic(DiagnosticEvent.requestFailed);
      throw ApiFailure(e.response?.statusCode == 401
          ? 'Session expired. Please log in again.'
          : e.type == DioExceptionType.connectionError
              ? 'Connection unavailable. Please retry.'
              : 'Request could not be completed. Please retry.');
    }
  }
}
