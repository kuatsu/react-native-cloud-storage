import Foundation
import MobileCoreServices

// MARK: - CloudStorageLocalFileSystem

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

  @objc(downloadFile:withLocalPath:withOptions:withResolver:withRejecter:)
  func downloadFile(remoteUri: String, localPath: String, options: [String: Any]?, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let remoteUrl = URL(string: remoteUri) else {
      let error = CloudStorageError.invalidUrl(url: remoteUri)
      reject(error.code, error.message, nil)
      return
    }

    let localUrl = URL(fileURLWithPath: localPath)

    let configuration = URLSessionConfiguration.default
    if let headers = options?["headers"] as? [String: String] {
      configuration.httpAdditionalHeaders = headers
    }
    let session = URLSession(configuration: configuration)

    let downloadTask = session.downloadTask(with: remoteUrl) { tempLocalUrl, _, error in
      if let error {
        let nsError = error as NSError
        let cloudError = CloudStorageError.networkError(message: "Download error for path \(remoteUri): \(nsError.localizedDescription)")
        reject(cloudError.code, cloudError.message, nsError)
        return
      }

      guard let tempLocalUrl else {
        let cloudError = CloudStorageError.unknown(message: "Download failed: temporary file location is missing.")
        reject(cloudError.code, cloudError.message, nil)
        return
      }

      do {
        let directory = localUrl.deletingLastPathComponent()
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true, attributes: nil)

        if FileManager.default.fileExists(atPath: localUrl.path) {
          try FileManager.default.removeItem(at: localUrl)
        }

        try FileManager.default.moveItem(at: tempLocalUrl, to: localUrl)
        resolve(nil)
      } catch {
        let nsError = error as NSError
        let cloudError = CloudStorageError.writeError(path: localUrl.path)
        reject(cloudError.code, cloudError.message, nsError)
      }
    }

    downloadTask.resume()
  }

  @objc(uploadFile:withRemoteUri:withOptions:withResolver:withRejecter:)
  func uploadFile(localPath: String, remoteUri: String, options: [String: Any], resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    guard let remoteUrl = URL(string: remoteUri) else {
      let error = CloudStorageError.invalidUrl(url: remoteUri)
      reject(error.code, error.message, nil)
      return
    }

    let localUrl = URL(fileURLWithPath: localPath)

    guard let uploadTypeString = options["uploadType"] as? String,
          let uploadType = UploadType(rawValue: uploadTypeString) else {
      let error = CloudStorageError.unknown(message: "uploadType is required and must be either 'multipart' or 'binary'")
      reject(error.code, error.message, nil)
      return
    }

    var request = URLRequest(url: remoteUrl)
    request.httpMethod = (options["method"] as? String)?.uppercased() ?? "POST"

    if let headers = options["headers"] as? [String: String] {
      for (key, value) in headers {
        request.setValue(value, forHTTPHeaderField: key)
      }
    }

    do {
      let fileData = try Data(contentsOf: localUrl)

      switch uploadType {
      case .binary:
        request.httpBody = fileData
        if request.value(forHTTPHeaderField: "Content-Type") == nil {
          request.setValue("application/octet-stream", forHTTPHeaderField: "Content-Type")
        }
      case .multipart:
        guard let fieldName = options["fieldName"] as? String else {
          let error = CloudStorageError.unknown(message: "fieldName is required for multipart uploads")
          reject(error.code, error.message, nil)
          return
        }

        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        var body = Data()
        let lineBreak = "\r\n"

        if let parameters = options["parameters"] as? [String: String] {
          for (key, value) in parameters {
            body.append("--\(boundary)\(lineBreak)")
            body.append("Content-Disposition: form-data; name=\"\(key)\"\(lineBreak)\(lineBreak)")
            body.append("\(value)\(lineBreak)")
          }
        }

        body.append("--\(boundary)\(lineBreak)")
        body.append("Content-Disposition: form-data; name=\"\(fieldName)\"; filename=\"\(localUrl.lastPathComponent)\"\(lineBreak)")
        if let mimeType = getMimeType(for: localUrl) {
          body.append("Content-Type: \(mimeType)\(lineBreak)\(lineBreak)")
        } else {
          body.append("Content-Type: application/octet-stream\(lineBreak)\(lineBreak)")
        }
        body.append(fileData)
        body.append(lineBreak)
        body.append("--\(boundary)--\(lineBreak)")

        request.httpBody = body
      }

      let task = URLSession.shared.dataTask(with: request) { _, response, error in
        if let error {
          let nsError = error as NSError
          let cloudError = CloudStorageError.networkError(message: "Upload error for path \(localPath): \(nsError.localizedDescription)")
          reject(cloudError.code, cloudError.message, nsError)
          return
        }

        guard let httpResponse = response as? HTTPURLResponse, (200 ... 299).contains(httpResponse.statusCode) else {
          let httpResponse = response as? HTTPURLResponse
          let message = "Upload failed for path \(localPath) with status code: \(httpResponse?.statusCode ?? -1)"
          let cloudError = CloudStorageError.networkError(message: message)
          reject(cloudError.code, cloudError.message, nil)
          return
        }

        resolve(nil)
      }
      task.resume()
    } catch {
      let nsError = error as NSError
      let cloudError = CloudStorageError.readError(path: localPath)
      reject(cloudError.code, cloudError.message, nsError)
    }
  }

  private func getMimeType(for url: URL) -> String? {
    let pathExtension = url.pathExtension
    if let uti = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, pathExtension as CFString, nil)?.takeRetainedValue() {
      if let mimetype = UTTypeCopyPreferredTagWithClass(uti, kUTTagClassMIMEType)?.takeRetainedValue() {
        return mimetype as String
      }
    }
    return nil
  }
}

extension Data {
  mutating func append(_ string: String) {
    if let data = string.data(using: .utf8) {
      append(data)
    }
  }
}
