import Foundation

@objc(CloudStorageEventEmitter)
class CloudStorageEventEmitter: RCTEventEmitter {
  public static var shared: CloudStorageEventEmitter!

  override init() {
    super.init()
    CloudStorageEventEmitter.shared = self
  }

  override func supportedEvents() -> [String]! {
    return ["RNCloudStorage.cloud.availability-changed"]
  }

  override func startObserving() {
    NotificationCenter.default.addObserver(self, selector: #selector(iCloudIdentityChanged(_:)), name: NSNotification.Name.NSUbiquityIdentityDidChange, object: nil)
    // call this immediately after init to trigger an initial value being sent to the JS side
    iCloudIdentityChanged()
  }

  override func stopObserving() {
    NotificationCenter.default.removeObserver(self, name: NSNotification.Name.NSUbiquityIdentityDidChange, object: nil)
  }

  @objc func iCloudIdentityChanged(_ notification: Notification? = nil) {
    let isAvailable = CloudKitUtils.isCloudKitAvailable()
    CloudStorageEventEmitter.shared.sendEvent(withName: "RNCloudStorage.cloud.availability-changed", body: ["available": isAvailable])
  }
}
