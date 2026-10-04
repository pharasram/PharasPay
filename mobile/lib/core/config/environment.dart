class Environment {
  static const mock = bool.fromEnvironment('MOCK_API', defaultValue: true);
  static const apiUrl = String.fromEnvironment('API_URL');
  static const region =
      String.fromEnvironment('AWS_REGION', defaultValue: 'ap-south-1');
  static const pins = String.fromEnvironment('CERT_SHA256');
  static void validate() {
    if (!['ap-south-1', 'ap-south-2'].contains(region)) {
      throw StateError('Only Mumbai and Hyderabad regions are permitted');
    }
    final uri = Uri.tryParse(apiUrl);
    if (!mock &&
        (uri == null ||
            uri.scheme != 'https' ||
            uri.host.isEmpty ||
            uri.userInfo.isNotEmpty ||
            pins.split(',').any(
                (p) => !RegExp(r'^[a-fA-F0-9]{64}$').hasMatch(p.trim())))) {
      throw StateError('Production requires HTTPS and certificate SHA256 pins');
    }
  }
}
