import Foundation

@objc(CloudStorageCloudKit)
class CloudStorageCloudKit: NSObject {
  @objc(fileExists:withScope:withResolver:withRejecter:)
  func fileExists(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.checkFileExists(fileUrl: fileUrl)
    }
  }

  @objc(appendToFile:withData:withScope:withResolver:withRejecter:)
  func appendToFile(path: String, data: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)

      var existingData = ""
      if try FileUtils.checkFileExists(fileUrl: fileUrl) {
        existingData = try FileUtils.readFile(fileUrl: fileUrl)
      }

      let newData = existingData + data
      return try FileUtils.writeFile(fileUrl: fileUrl, content: newData)
    }
  }

  @objc(createFile:withData:withScope:withOverwrite:withResolver:withRejecter:)
  func createFile(path: String, data: String, scope: String, overwrite: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)

      if try (FileUtils.checkFileExists(fileUrl: fileUrl) && !overwrite) {
        throw CloudStorageError.fileAlreadyExists(path: path)
      }

      return try FileUtils.writeFile(fileUrl: fileUrl, content: data)
    }
  }

  @objc(createDirectory:withScope:withResolver:withRejecter:)
  func createDirectory(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.createDirectory(directoryUrl: fileUrl)
    }
  }

  @objc(listFiles:withScope:withResolver:withRejecter:)
  func listFiles(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.listFiles(directoryUrl: fileUrl)
    }
  }

  @objc(readFile:withScope:withResolver:withRejecter:)
  func readFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.readFile(fileUrl: fileUrl)
    }
  }

  @objc(triggerSync:withScope:withResolver:withRejecter:)
  func triggerSync(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try CloudKitUtils.triggerSync(fileUrl: fileUrl)
    }
  }

  @objc(deleteFile:withScope:withResolver:withRejecter:)
  func deleteFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.deleteFileOrDirectory(fileUrl: fileUrl)
    }
  }

  @objc(deleteDirectory:withRecursive:withScope:withResolver:withRejecter:)
  func deleteDirectory(path: String, recursive _: Bool, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.deleteFileOrDirectory(fileUrl: fileUrl)
    }
  }

  @objc(statFile:withScope:withResolver:withRejecter:)
  func statFile(path: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let fileUrl = try CloudKitUtils.getFileURL(path: path, scope: scope)
      return try FileUtils.statFile(fileUrl: fileUrl).toDictionary()
    }
  }

  @objc(downloadFile:withLocalPath:withScope:withResolver:withRejecter:)
  func downloadFile(remotePath: String, localPath: String, scope: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let sourceUrl = try CloudKitUtils.getFileURL(path: remotePath, scope: scope, true)

      let sourceStat = try FileUtils.statFile(fileUrl: sourceUrl)
      if sourceStat.isDirectory {
        throw CloudStorageError.pathIsDirectory(path: remotePath)
      }

      let destinationUrl = URL(fileURLWithPath: localPath)
      let destinationDirectoryUrl = destinationUrl.deletingLastPathComponent()

      if try !FileUtils.checkFileExists(fileUrl: destinationDirectoryUrl) {
        throw CloudStorageError.directoryNotFound(path: destinationDirectoryUrl.path)
      }

      let destDirStat = try FileUtils.statFile(fileUrl: destinationDirectoryUrl)
      if !destDirStat.isDirectory {
        throw CloudStorageError.pathIsFile(path: destinationDirectoryUrl.path)
      }

      if try FileUtils.checkFileExists(fileUrl: destinationUrl) {
        throw CloudStorageError.fileAlreadyExists(path: localPath)
      }

      return try FileUtils.copyFile(from: sourceUrl, to: destinationUrl)
    }
  }

  @objc(uploadFile:withLocalPath:withMimeType:withScope:withOverwrite:withResolver:withRejecter:)
  func uploadFile(remotePath: String, localPath: String, mimeType _: String, scope: String, overwrite: Bool, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      let destinationUrl = try CloudKitUtils.getFileURL(path: remotePath, scope: scope)
      let sourceUrl = URL(fileURLWithPath: localPath)

      if try !FileUtils.checkFileExists(fileUrl: sourceUrl) {
        throw CloudStorageError.fileNotFound(path: localPath)
      }

      let destinationDirectoryUrl = destinationUrl.deletingLastPathComponent()
      try FileUtils.createDirectory(directoryUrl: destinationDirectoryUrl)

      if try FileUtils.checkFileExists(fileUrl: destinationUrl) {
        if overwrite {
          try FileUtils.deleteFileOrDirectory(fileUrl: destinationUrl)
        } else {
          throw CloudStorageError.fileAlreadyExists(path: remotePath)
        }
      }

      return try FileUtils.copyFile(from: sourceUrl, to: destinationUrl)
    }
  }

  @objc(isCloudAvailable:withRejecter:)
  func isCloudAvailable(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      CloudKitUtils.isCloudKitAvailable()
    }
  }
}
