import Foundation

@objc(CloudStorage)
class CloudStorage: NSObject {
  @objc(fileExists:withScope:withResolver:withRejecter:)
  func fileExists(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileManager = FileManager.default
    let directory = getDirectory(scope)
    if (directory == nil) {
      reject("ERR_NO_DIRECTORY_FOUND", "No directory found for scope \(scope)", nil)
      return
    }
    let filePath = directory?.appendingPathComponent(path)
    let fileExists = fileManager.fileExists(atPath: filePath!.path)
    resolve(fileExists)
  }

  @objc(createFile:withData:withScope:withOverwrite:withResolver:withRejecter:)
  func createFile(path: String, data: String, scope: String, overwrite: Bool, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileManager = FileManager.default
    let directory = getDirectory(scope)
    if (directory == nil) {
      reject("ERR_NO_DIRECTORY_FOUND", "No directory found for scope \(scope)", nil)
      return
    }
    let filePath = directory?.appendingPathComponent(path)
    let fileExists = fileManager.fileExists(atPath: filePath!.path)
    if (fileExists && !overwrite) {
      reject("ERR_FILE_EXISTS", "File \(path) already exists", nil)
      return
    }
    do {
      try data.write(to: filePath!, atomically: true, encoding: .utf8)
      resolve(true)
    } catch {
      reject("ERR_WRITE_ERROR", "Error writing file \(path)", error)
    }
  }

  @objc(createDirectory:withScope:withResolver:withRejecter:)
  func createDirectory(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileManager = FileManager.default
    let directory = getDirectory(scope)
    if (directory == nil) {
      reject("ERR_NO_DIRECTORY_FOUND", "No directory found for scope \(scope)", nil)
      return
    }
    let dirPath = directory?.appendingPathComponent(path)
    let dirExists = fileManager.fileExists(atPath: dirPath!.path)
    if (dirExists) {
      reject("ERR_FILE_EXISTS", "Directory \(path) already exists", nil)
      return
    }
    do {
      try fileManager.createDirectory(at: dirPath!, withIntermediateDirectories: true, attributes: nil)
      resolve(true)
    } catch {
      reject("ERR_WRITE_ERROR", "Error creating directory \(path)", error)
    }
  }

  @objc(readFile:withScope:withResolver:withRejecter:)
  func readFile(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileManager = FileManager.default
    let directory = getDirectory(scope)
    if (directory == nil) {
      reject("ERR_NO_DIRECTORY_FOUND", "No directory found for scope \(scope)", nil)
      return
    }
    let filePath = directory?.appendingPathComponent(path)
    let fileExists = fileManager.fileExists(atPath: filePath!.path)
    if (!fileExists) {
      reject("ERR_FILE_NOT_FOUND", "File \(path) not found", nil)
      return
    }
    do {
      let fileContents = try String(contentsOf: filePath!, encoding: .utf8)
      resolve(fileContents)
    } catch {
      reject("ERR_READ_ERROR", "Error reading file \(path)", error)
    }
  }

  @objc(deleteFile:withScope:withResolver:withRejecter:)
  func deleteFile(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileManager = FileManager.default
    let directory = getDirectory(scope)
    if (directory == nil) {
      reject("ERR_NO_DIRECTORY_FOUND", "No directory found for scope \(scope)", nil)
      return
    }
    let filePath = directory?.appendingPathComponent(path)
    let fileExists = fileManager.fileExists(atPath: filePath!.path)
    if (!fileExists) {
      reject("ERR_FILE_NOT_FOUND", "File \(path) not found", nil)
      return
    }
    do {
      try fileManager.removeItem(at: filePath!)
      resolve(true)
    } catch {
      reject("ERR_DELETE_ERROR", "Error deleting file \(path)", error)
    }
  }

  @objc(statFile:withScope:withResolver:withRejecter:)
  func statFile(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileManager = FileManager.default
    let directory = getDirectory(scope)
    if (directory == nil) {
      reject("ERR_NO_DIRECTORY_FOUND", "No directory found for scope \(scope)", nil)
      return
    }
    let filePath = directory?.appendingPathComponent(path)
    let fileExists = fileManager.fileExists(atPath: filePath!.path)
    if (!fileExists) {
      reject("ERR_FILE_NOT_FOUND", "File \(path) not found", nil)
      return
    }
    do {
      let attributes = try fileManager.attributesOfItem(atPath: filePath!.path)
      let size = attributes[FileAttributeKey.size] as! UInt64
      let birthtime = attributes[FileAttributeKey.creationDate] as! Date
      let mtime = attributes[FileAttributeKey.modificationDate] as! Date
      let isDirectory = attributes[FileAttributeKey.type] as! FileAttributeType == FileAttributeType.typeDirectory
      let isFile = attributes[FileAttributeKey.type] as! FileAttributeType == FileAttributeType.typeRegular
      let result = [
        "size": size,
        "birthtimeMs": birthtime.timeIntervalSince1970 * 1000,
        "mtimeMs": mtime.timeIntervalSince1970 * 1000,
        "isDirectory": isDirectory,
        "isFile": isFile
      ] as [String : Any]
      resolve(result)
    } catch {
      reject("ERR_STAT_ERROR", "Error getting stats for file \(path)", error)
    }
  }

  @objc(isCloudAvailable:withRejecter:)
  func isCloudAvailable(resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let token = FileManager.default.ubiquityIdentityToken
    resolve(token != nil)
  }

  /// Returns the iCloud directory URL for the given scope.
  ///
  /// - Parameter scope: The scope of the directory. Can be either "documents" or "app_data".
  /// - Returns: The URL of the iCloud directory.
  private func getDirectory(_ scope: String) -> URL? {
    let fileManager = FileManager.default
    let isDocumentDirectory = scope.caseInsensitiveCompare("documents") == .orderedSame
    let ubiquityURL = fileManager.url(forUbiquityContainerIdentifier: nil)
    if (isDocumentDirectory) {
      return fileManager.urls(for: .documentDirectory, in: .userDomainMask).first
    } else {
      return ubiquityURL
    }
  }
}
