import Flutter
import UIKit
import CryptoKit
import Security

@main
@objc class AppDelegate: FlutterAppDelegate {
  private var privacyCover: UIView?

  override func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    GeneratedPluginRegistrant.register(with: self)
    if let controller = window?.rootViewController as? FlutterViewController {
      let channel = FlutterMethodChannel(name: "pharaspay/security", binaryMessenger: controller.binaryMessenger)
      channel.setMethodCallHandler { [weak self] call, result in
        if call.method == "isTrustedDevice" { result(!(self?.isJailbroken() ?? true)) }
        else { result(FlutterMethodNotImplemented) }
      }
      let api = FlutterMethodChannel(name: "pharaspay/api", binaryMessenger: controller.binaryMessenger)
      api.setMethodCallHandler { call, result in
        guard call.method == "request", let args = call.arguments as? [String: Any],
          let address = args["url"] as? String, let url = URL(string: address),
          let host = args["host"] as? String, url.scheme == "https", url.host == host,
          let pins = args["pins"] as? [String] else {
          result(FlutterError(code: "NETWORK", message: "Secure request unavailable", details: nil)); return
        }
        var request = URLRequest(url: url)
        request.httpMethod = args["method"] as? String
        request.allHTTPHeaderFields = args["headers"] as? [String: String]
        request.httpBody = (args["body"] as? FlutterStandardTypedData)?.data
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60
        configuration.tlsMinimumSupportedProtocolVersion = .TLSv12
        let delegate = PinnedSession(host: host, pins: Set(pins))
        let session = URLSession(configuration: configuration, delegate: delegate, delegateQueue: nil)
        session.dataTask(with: request) { data, response, error in
          defer { session.finishTasksAndInvalidate() }
          DispatchQueue.main.async {
            guard error == nil, let response = response as? HTTPURLResponse else {
              result(FlutterError(code: "NETWORK", message: "Secure request unavailable", details: nil)); return
            }
            var headers: [String: [String]] = [:]
            response.allHeaderFields.forEach { key, value in headers[String(describing: key).lowercased()] = [String(describing: value)] }
            result(["status": response.statusCode, "headers": headers, "body": FlutterStandardTypedData(bytes: data ?? Data())])
          }
        }.resume()
      }
    }
    NotificationCenter.default.addObserver(self, selector: #selector(captureChanged),
      name: UIScreen.capturedDidChangeNotification, object: nil)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
  override func applicationWillResignActive(_ application: UIApplication) {
    cover(); super.applicationWillResignActive(application)
  }
  override func applicationDidBecomeActive(_ application: UIApplication) {
    captureChanged(); super.applicationDidBecomeActive(application)
  }
  @objc private func captureChanged() {
    if UIScreen.main.isCaptured { cover() }
    else { privacyCover?.removeFromSuperview(); privacyCover = nil }
  }
  private func cover() {
    guard privacyCover == nil, let window = window else { return }
    let view = UIView(frame: window.bounds)
    view.backgroundColor = UIColor.systemBackground
    view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
    window.addSubview(view); privacyCover = view
  }
  private func isJailbroken() -> Bool {
    #if targetEnvironment(simulator)
    return true
    #else
    let paths = ["/Applications/Cydia.app", "/Library/MobileSubstrate/MobileSubstrate.dylib",
      "/bin/bash", "/usr/sbin/sshd", "/etc/apt", "/var/jb"]
    if paths.contains(where: { FileManager.default.fileExists(atPath: $0) }) { return true }
    let probe = "/private/pharaspay-integrity-\(UUID().uuidString)"
    do {
      try Data("probe".utf8).write(to: URL(fileURLWithPath: probe))
      try? FileManager.default.removeItem(atPath: probe)
      return true
    } catch { return false }
    #endif
  }
}

private final class PinnedSession: NSObject, URLSessionDelegate, URLSessionTaskDelegate {
  let host: String
  let pins: Set<String>
  init(host: String, pins: Set<String>) { self.host = host; self.pins = pins }
  func urlSession(_ session: URLSession, didReceive challenge: URLAuthenticationChallenge,
    completionHandler: @escaping (URLSession.AuthChallengeDisposition, URLCredential?) -> Void) {
    guard challenge.protectionSpace.authenticationMethod == NSURLAuthenticationMethodServerTrust,
      challenge.protectionSpace.host == host, let trust = challenge.protectionSpace.serverTrust,
      SecTrustEvaluateWithError(trust, nil), let certificate = SecTrustGetCertificateAtIndex(trust, 0) else {
      completionHandler(.cancelAuthenticationChallenge, nil); return
    }
    let hash = SHA256.hash(data: SecCertificateCopyData(certificate) as Data).map { String(format: "%02x", $0) }.joined()
    guard pins.contains(hash) else { completionHandler(.cancelAuthenticationChallenge, nil); return }
    completionHandler(.useCredential, URLCredential(trust: trust))
  }
  func urlSession(_ session: URLSession, task: URLSessionTask,
    willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest,
    completionHandler: @escaping (URLRequest?) -> Void) { completionHandler(nil) }
}
