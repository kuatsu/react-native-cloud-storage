import Foundation
import React

@objc(CloudStorageICloudDrive)
public class CloudStorageICloudDrive: NSObject {
  @objc(fileExists:withScope:withResolver:withRejecter:)
  public func fileExists(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      do {
        _ = try ICloudDriveUtils.getFileURL(path: path, scope: scope, true)
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
        fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope, true)
      } catch CloudStorageError.fileNotFound {
        fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope)
      }
      return try FileUtils.appendFile(fileUrl: fileUrl, content: data)
    }
  }

  @objc(createFile:withData:withScope:withOverwrite:withResolver:withRejecter:)
  public func createFile(path: String, data: String, scope: String, overwrite: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.writeFile(fileUrl: fileUrl, content: data, overwrite: overwrite)
    }
  }

  @objc(createDirectory:withScope:withResolver:withRejecter:)
  public func createDirectory(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.createDirectory(directoryUrl: fileUrl)
    }
  }

  @objc(listFiles:withScope:withResolver:withRejecter:)
  public func listFiles(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope)
      return try ICloudDriveUtils.listFiles(directoryUrl: fileUrl, scope: scope)
    }
  }

  @objc(readFile:withScope:withResolver:withRejecter:)
  public func readFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope, true)
      return try FileUtils.readFile(fileUrl: fileUrl)
    }
  }

  @objc(readBytes:withScope:withResolver:withRejecter:)
  public func readBytes(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope, true)
      return try FileUtils.readBytes(fileUrl: fileUrl)
    }
  }

  @objc(writeBytes:withData:withScope:withOverwrite:withResolver:withRejecter:)
  public func writeBytes(path: String, data: NSData, scope: String, overwrite: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope)
      try FileUtils.writeFile(fileUrl: fileUrl, data: data, overwrite: overwrite)
      return nil
    }
  }

  @objc(triggerSync:withScope:withResolver:withRejecter:)
  public func triggerSync(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope, true)
      return try ICloudDriveUtils.triggerSync(fileUrl: fileUrl)
    }
  }

  @objc(deleteFile:withScope:withResolver:withRejecter:)
  public func deleteFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope, true)
      return try FileUtils.deleteFile(fileUrl: fileUrl)
    }
  }

  @objc(deleteDirectory:withRecursive:withScope:withResolver:withRejecter:)
  public func deleteDirectory(path: String, recursive: Bool, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope, true)
      if !recursive, try fileUrl.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true,
         try !(ICloudDriveUtils.listFiles(directoryUrl: fileUrl, scope: scope)).isEmpty {
        throw CloudStorageError.directoryNotEmpty(path: path)
      }
      return try FileUtils.deleteDirectory(directoryUrl: fileUrl, recursive: recursive)
    }
  }

  @objc(statFile:withScope:withResolver:withRejecter:)
  public func statFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let fileUrl = try ICloudDriveUtils.getFileURL(path: path, scope: scope, true)
      return try FileUtils.statFile(fileUrl: fileUrl).toDictionary()
    }
  }

  @objc(downloadFile:withLocalPath:withScope:withResolver:withRejecter:)
  public func downloadFile(remotePath: String, localPath: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let sourceUrl = try ICloudDriveUtils.getFileURL(path: remotePath, scope: scope, true)
      let destinationUrl = try FileUtils.localFileURL(path: localPath)
      return try FileUtils.copyFile(from: sourceUrl, to: destinationUrl)
    }
  }

  @objc(uploadFile:withLocalPath:withMimeType:withScope:withOverwrite:withResolver:withRejecter:)
  public func uploadFile(remotePath: String, localPath: String, mimeType _: String, scope: String, overwrite: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      let destinationUrl = try ICloudDriveUtils.getFileURL(path: remotePath, scope: scope)
      let sourceUrl = try FileUtils.localFileURL(path: localPath)
      try FileUtils.createDirectory(directoryUrl: destinationUrl.deletingLastPathComponent())
      return try FileUtils.copyFile(from: sourceUrl, to: destinationUrl, overwrite: overwrite)
    }
  }

  @objc(isCloudAvailable:withRejecter:)
  public func isCloudAvailable(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withBackgroundPromise(resolve: resolve, reject: reject) {
      ICloudDriveUtils.isICloudDriveAvailable()
    }
  }
}
