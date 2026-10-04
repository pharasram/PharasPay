import 'dart:convert';
import 'dart:developer' as developer;

/// Diagnostic events only; the server owns immutable audit events.
/// No payload, URL, token, identifier, exception text or user data is accepted.
enum DiagnosticEvent { started, requestFailed, sessionExpired, securityBlocked }

void diagnostic(DiagnosticEvent event) {
  developer.log(
      jsonEncode({
        'event': event.name,
        'timestamp': DateTime.now().toUtc().toIso8601String()
      }),
      name: 'pharaspay');
}
