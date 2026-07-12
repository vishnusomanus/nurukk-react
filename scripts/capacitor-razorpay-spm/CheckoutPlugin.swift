import Foundation
import Capacitor
import Razorpay

/**
 Capacitor 8 / SPM-compatible Razorpay Checkout plugin.
 Native iOS checkout avoids WKWebView window.open failures from the web SDK.
 */
@objc(CheckoutPlugin)
public class CheckoutPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "CheckoutPlugin"
    public let jsName = "Checkout"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "echo", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "open", returnType: CAPPluginReturnPromise),
    ]

    private var pendingCall: CAPPluginCall?
    private var razorpay: RazorpayCheckout?

    @objc func echo(_ call: CAPPluginCall) {
        let value = call.getString("value") ?? ""
        call.resolve(["value": value])
    }

    @objc func open(_ call: CAPPluginCall) {
        pendingCall = call
        call.keepAlive = true

        let key = call.getString("key") ?? ""
        guard !key.isEmpty else {
            call.reject("Missing Razorpay key")
            pendingCall = nil
            return
        }

        guard var options = call.options else {
            call.reject("Missing Razorpay checkout options")
            pendingCall = nil
            return
        }

        options["integration"] = "capacitor"
        options["FRAMEWORK"] = "capacitor"

        DispatchQueue.main.async { [weak self] in
            guard let self else { return }
            let checkout = RazorpayCheckout.initWithKey(key, andDelegateWithData: self)
            checkout.setExternalWalletSelectionDelegate(self)
            self.razorpay = checkout
            checkout.open(options)
        }
    }
}

extension CheckoutPlugin: RazorpayPaymentCompletionProtocolWithData, ExternalWalletSelectionProtocol {
    public func onPaymentSuccess(_ payment_id: String, andData response: [AnyHashable: Any]?) {
        guard let call = pendingCall else { return }
        call.resolve(["response": response as Any])
        pendingCall = nil
        razorpay = nil
    }

    public func onPaymentError(_ code: Int32, description str: String, andData data: [AnyHashable: Any]?) {
        guard let call = pendingCall else { return }
        var payload: [String: Any] = [
            "code": Int(code),
            "description": str,
        ]
        if let data {
            payload["error"] = data
        }
        if let json = try? JSONSerialization.data(withJSONObject: payload),
           let message = String(data: json, encoding: .utf8) {
            call.reject(str, message, nil)
        } else {
            call.reject("\(code):\(str)")
        }
        pendingCall = nil
        razorpay = nil
    }

    public func onExternalWalletSelected(_ walletName: String, withPaymentData paymentData: [AnyHashable: Any]?) {
        guard let call = pendingCall else { return }
        call.reject(walletName)
        pendingCall = nil
        razorpay = nil
    }
}
