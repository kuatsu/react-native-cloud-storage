import Foundation

@objc(CloudStorageLocalFileSystem)
class CloudStorageLocalFileSystem: NSObject {
  @objc(createTemporaryFile:withData:withResolver:withRejecter:)
  func createTemporaryFile(filename: String, data: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = FileUtils.temporaryDirectory.appendingPathComponent(filename)
      try FileUtils.writeFile(fileUrl: fileUrl, content: data)
      return fileUrl.path
    }
  }

  @objc(readFile:withResolver:withRejecter:)
  func readFile(path: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = URL(fileURLWithPath: path)
      return try FileUtils.readFile(fileUrl: fileUrl)
    }
  }
}
