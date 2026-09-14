import Foundation
import React

@objc(CloudStorageCloudKit)
public class CloudStorageCloudKit: NSObject {
  @objc(fileExists:withScope:withResolver:withRejecter:)
  public func fileExists(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      do {
        _ = try CloudKitUtils.getFileURL(path: path, scope: scope, true)
        return true
      } catch CloudStorageError.fileNotFound {
        return false
      }
    }
  }

  @objc(appendToFile:withData:withScope:withResolver:withRejecter:)
  public func appendToFile(path: String, data: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl: URL
      do {
        fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope, true)
      } catch CloudStorageError.fileNotFound {
        fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      }
      return try FileUtils.appendFile(fileUrl: fileUrl, content: data)
    }
  }

  @objc(createFile:withData:withScope:withOverwrite:withResolver:withRejecter:)
  public func createFile(path: String, data: String, scope: String, overwrite: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.writeFile(fileUrl: fileUrl, content: data, overwrite: overwrite)
    }
  }

  @objc(createDirectory:withScope:withResolver:withRejecter:)
  public func createDirectory(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.createDirectory(directoryUrl: fileUrl)
    }
  }

  @objc(listFiles:withScope:withResolver:withRejecter:)
  public func listFiles(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try CloudKitUtils.listFiles(directoryUrl: fileUrl, scope: scope)
    }
  }

  @objc(readFile:withScope:withResolver:withRejecter:)
  public func readFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope, true)
      return try FileUtils.readFile(fileUrl: fileUrl)
    }
  }

  @objc(triggerSync:withScope:withResolver:withRejecter:)
  public func triggerSync(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope, true)
      return try CloudKitUtils.triggerSync(fileUrl: fileUrl)
    }
  }

  @objc(deleteFile:withScope:withResolver:withRejecter:)
  public func deleteFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope, true)
      return try FileUtils.deleteFileOrDirectory(fileUrl: fileUrl)
    }
  }

  @objc(deleteDirectory:withRecursive:withScope:withResolver:withRejecter:)
  public func deleteDirectory(path: String, recursive _: Bool, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope, true)
      return try FileUtils.deleteFileOrDirectory(fileUrl: fileUrl)
    }
  }

  @objc(statFile:withScope:withResolver:withRejecter:)
  public func statFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope, true)
      return try FileUtils.statFile(fileUrl: fileUrl).toDictionary()
    }
  }

  @objc(downloadFile:withLocalPath:withScope:withResolver:withRejecter:)
  public func downloadFile(remotePath: String, localPath: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let sourceUrl = try CloudKitUtils.getFileURL(path: remotePath, scope: scope, true)
      let destinationUrl = try FileUtils.localFileURL(path: localPath)
      return try FileUtils.copyFile(from: sourceUrl, to: destinationUrl)
    }
  }

  @objc(uploadFile:withLocalPath:withMimeType:withScope:withOverwrite:withResolver:withRejecter:)
  public func uploadFile(remotePath: String, localPath: String, mimeType _: String, scope: String, overwrite: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let destinationUrl = try CloudKitUtils.getFileURL(path: remotePath, scope: scope)
      let sourceUrl = try FileUtils.localFileURL(path: localPath)
      try FileUtils.createDirectory(directoryUrl: destinationUrl.deletingLastPathComponent())
      return try FileUtils.copyFile(from: sourceUrl, to: destinationUrl, overwrite: overwrite)
    }
  }

  @objc(isCloudAvailable:withRejecter:)
  public func isCloudAvailable(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      CloudKitUtils.isCloudKitAvailable()
    }
  }
}
