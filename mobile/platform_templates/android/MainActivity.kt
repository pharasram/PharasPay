package com.pharaspay.pharaspay

import android.os.Build
import android.view.WindowManager
import io.flutter.embedding.android.FlutterFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.net.URL
import java.security.KeyStore
import java.security.MessageDigest
import java.security.cert.X509Certificate
import javax.net.ssl.HttpsURLConnection
import javax.net.ssl.SSLContext
import javax.net.ssl.TrustManagerFactory
import javax.net.ssl.X509TrustManager

class MainActivity : FlutterFragmentActivity() {
    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        // Entire app is sensitive; also prevents app switcher thumbnails.
        window.addFlags(WindowManager.LayoutParams.FLAG_SECURE)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "pharaspay/security")
            .setMethodCallHandler { call, result ->
                when (call.method) {
                    "isTrustedDevice" -> result.success(!isRooted())
                    else -> result.notImplemented()
                }
            }
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "pharaspay/api")
            .setMethodCallHandler { call, result ->
                if (call.method != "request") { result.notImplemented(); return@setMethodCallHandler }
                val args = call.arguments as? Map<*, *>
                if (args == null) { result.error("NETWORK", "Request unavailable", null); return@setMethodCallHandler }
                Thread {
                    var connection: HttpsURLConnection? = null
                    try {
                        val url = URL(args["url"] as String)
                        require(url.protocol == "https" && url.host == args["host"])
                        val pins = (args["pins"] as List<*>).map { it as String }.toSet()
                        val factory = TrustManagerFactory.getInstance(TrustManagerFactory.getDefaultAlgorithm())
                        factory.init(null as KeyStore?)
                        val system = factory.trustManagers.filterIsInstance<X509TrustManager>().first()
                        val trust = object : X509TrustManager {
                            override fun getAcceptedIssuers() = system.acceptedIssuers
                            override fun checkClientTrusted(chain: Array<X509Certificate>, type: String) = system.checkClientTrusted(chain, type)
                            override fun checkServerTrusted(chain: Array<X509Certificate>, type: String) {
                                system.checkServerTrusted(chain, type)
                                val digest = MessageDigest.getInstance("SHA-256").digest(chain.first().encoded)
                                    .joinToString("") { "%02x".format(it.toInt() and 0xff) }
                                require(pins.contains(digest)) { "Certificate pin rejected" }
                            }
                        }
                        val tls = SSLContext.getInstance("TLSv1.2")
                        tls.init(null, arrayOf(trust), null)
                        connection = url.openConnection() as HttpsURLConnection
                        connection!!.sslSocketFactory = tls.socketFactory
                        connection!!.instanceFollowRedirects = false
                        connection!!.connectTimeout = 20000
                        connection!!.readTimeout = 30000
                        connection!!.requestMethod = args["method"] as String
                        (args["headers"] as Map<*, *>).forEach { (k, v) -> connection!!.setRequestProperty(k as String, v as String) }
                        val body = args["body"] as ByteArray
                        if (body.isNotEmpty()) {
                            connection!!.doOutput = true
                            connection!!.outputStream.use { it.write(body) }
                        }
                        val status = connection!!.responseCode
                        val stream = if (status >= 400) connection!!.errorStream else connection!!.inputStream
                        val bytes = stream?.use { it.readBytes() } ?: ByteArray(0)
                        val headers = connection!!.headerFields.filterKeys { it != null }
                        runOnUiThread { result.success(mapOf("status" to status, "headers" to headers, "body" to bytes)) }
                    } catch (_: Exception) {
                        runOnUiThread { result.error("NETWORK", "Secure request unavailable", null) }
                    } finally { connection?.disconnect() }
                }.start()
            }
    }
    private fun isRooted(): Boolean {
        val paths = listOf("/system/bin/su", "/system/xbin/su", "/sbin/su", "/data/adb/magisk",
            "/system/app/Superuser.apk", "/system/bin/.ext/.su")
        return Build.TAGS?.contains("test-keys") == true || paths.any { File(it).exists() }
    }
}
