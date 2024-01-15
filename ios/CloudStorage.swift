import Foundation

@objc(CloudStorage)
class CloudStorage: NSObject {
  @objc(fileExists:withScope:withResolver:withRejecter:)
  func fileExists(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileUrl: URL?
    do {
      fileUrl = try getFileURL(path, scope)
    } catch let error as NSError {
      reject(error.domain, error.userInfo["message"] as? String, error)
      return
    }

    let fileManager = FileManager.default
    let fileExists = fileManager.fileExists(atPath: fileUrl!.path)
    resolve(fileExists)
  }

  @objc(appendToFile:withData:withScope:withResolver:withRejecter:)
  func appendToFile(path: String, data: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    // Append data to the file at path. If the file doesn't exist, create it.
    let fileUrl: URL?
    do {
      fileUrl = try getFileURL(path, scope)
    } catch let error as NSError {
      reject(error.domain, error.userInfo["message"] as? String, error)
      return
    }

    let fileManager = FileManager.default
    if (!fileManager.fileExists(atPath: fileUrl!.path)) {
      do {
        try data.write(to: fileUrl!, atomically: true, encoding: .utf8)
        resolve(true)
      } catch {
        reject("ERR_WRITE_ERROR", "Error writing file \(path)", error)
      }
    } else {
      do {
        let fileHandle = try FileHandle(forWritingTo: fileUrl!)
        fileHandle.seekToEndOfFile()
        fileHandle.write(data.data(using: .utf8)!)
        fileHandle.closeFile()
        resolve(true)
      } catch {
        reject("ERR_WRITE_ERROR", "Error writing file \(path)", error)
      }
    }
  }

  @objc(createFile:withData:withScope:withOverwrite:withResolver:withRejecter:)
  func createFile(path: String, data: String, scope: String, overwrite: Bool, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileUrl: URL?
    do {
      fileUrl = try getFileURL(path, scope, overwrite ? nil : false)
    } catch let error as NSError {
      reject(error.domain, error.userInfo["message"] as? String, error)
      return
    }

    do {
      try data.write(to: fileUrl!, atomically: true, encoding: .utf8)
      resolve(true)
    } catch {
      reject("ERR_WRITE_ERROR", "Error writing file \(path)", error)
    }
  }

  @objc(createDirectory:withScope:withResolver:withRejecter:)
  func createDirectory(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let directoryUrl: URL?
    do {
      directoryUrl = try getFileURL(path, scope, false)
    } catch let error as NSError {
      reject(error.domain, error.userInfo["message"] as? String, error)
      return
    }

    let fileManager = FileManager.default
    do {
      try fileManager.createDirectory(at: directoryUrl!, withIntermediateDirectories: true, attributes: nil)
      resolve(true)
    } catch {
      reject("ERR_WRITE_ERROR", "Error creating directory \(path)", error)
    }
  }

  @objc(listFiles:withScope:withResolver:withRejecter:)
  func listFiles(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let directoryUrl: URL?
    do {
      directoryUrl = try getFileURL(path, scope, true)
    } catch let error as NSError {
      reject(error.domain, error.userInfo["message"] as? String, error)
      return
    }

    let fileManager = FileManager.default
    do {
      let files = try fileManager.contentsOfDirectory(atPath: directoryUrl!.path)
      resolve(files)
    } catch {
      reject("ERR_READ_ERROR", "Error reading directory \(path)", error)
    }
  }

  @objc(readFile:withScope:withResolver:withRejecter:)
  func readFile(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileUrl: URL?
    do {
      fileUrl = try getFileURL(path, scope, true)
    } catch let error as NSError {
      reject(error.domain, error.userInfo["message"] as? String, error)
      return
    }

    do {
      let fileContents = try String(contentsOf: fileUrl!, encoding: .utf8)
      resolve(fileContents)
    } catch {
      reject("ERR_READ_ERROR", "Error reading file \(path)", error)
    }
  }

  @objc(triggerDownloadFile:withScope:withResolver:withRejecter:)
    func triggerDownloadFile(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
        let fileManager = FileManager.default
        
        guard let directory = getDirectory(scope) else {
            reject("ERR_READ_ERROR", "Error reading directory \(scope)", NSError())
            return
        }

        // remove leading slashes
        let path = path.replacingOccurrences(of: "^/+", with: "", options: .regularExpression)

        // append path to scope directory and return URL
        let filePath = directory.appendingPathComponent(path)

        let isDownloadable = fileManager.isUbiquitousItem(at: filePath)
        
        if (!isDownloadable) {
            resolve(false)
            return
        }
          do {
            // trigger download of file^
             try fileManager.startDownloadingUbiquitousItem(at: filePath)
          } catch {
            reject("ERR_FILE_NOT_DOWNLOADABLE", "File or directory \(path) not downloadable", error)
            return
          }
        resolve(true)
    }
    

  @objc(deleteFile:withScope:withResolver:withRejecter:)
  func deleteFile(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileUrl: URL?
    do {
      fileUrl = try getFileURL(path, scope, true)
    } catch let error as NSError {
      reject(error.domain, error.userInfo["message"] as? String, error)
      return
    }

    let fileManager = FileManager.default
    do {
      try fileManager.removeItem(at: fileUrl!)
      resolve(true)
    } catch {
      reject("ERR_DELETE_ERROR", "Error deleting file \(path)", error)
    }
  }

  @objc(statFile:withScope:withResolver:withRejecter:)
  func statFile(path: String, scope: String, resolve:RCTPromiseResolveBlock,reject:RCTPromiseRejectBlock) -> Void {
    let fileUrl: URL?
    do {
      fileUrl = try getFileURL(path, scope, true)
    } catch let error as NSError {
      reject(error.domain, error.userInfo["message"] as? String, error)
      return
    }

    let fileManager = FileManager.default
    do {
      let attributes = try fileManager.attributesOfItem(atPath: fileUrl!.path)
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

  /**
    Returns the iCloud directory URL for the given scope.

    - Parameter scope: The scope of the directory. Can be either "documents" or "app_data".
    - Returns: The URL of the iCloud directory.
  */
  private func getDirectory(_ scope: String) -> URL? {
    let fileManager = FileManager.default
    let isDocumentDirectory = scope.caseInsensitiveCompare("documents") == .orderedSame
    let ubiquityURL = fileManager.url(forUbiquityContainerIdentifier: nil)
    print(ubiquityURL)
    if (isDocumentDirectory) {
      return fileManager.urls(for: .documentDirectory, in: .userDomainMask).first
    } else {
      return ubiquityURL
    }
  }

  /**
    Parses a given path and directory scope to a full file URL. Does not check if the file exists.

    - Parameter path: The path of the file.
    - Parameter scope: The scope of the directory. Can be either "documents" or "app_data".
    - Parameter shouldExist: Whether the file should exist. If true, throws an error if the file does not exist. If false, throws an error if the file exists. If nil, does not check if the file exists.
    - Returns: The full URL of the file.
    - Throws: An NSError if the scope directory couldn't be found or the file should exist but doesn't or vice versa.
  */
  private func getFileURL(_ path: String, _ scope: String, _ shouldExist: Bool? = nil) throws -> URL? {
    let fileManager = FileManager.default

    guard let directory = getDirectory(scope) else {
      throw NSError(domain: "ERR_DIRECTORY_NOT_FOUND", code: 0, userInfo: ["message": "Directory for scope \(scope) not found"])
    }

    // remove leading slashes
    let path = path.replacingOccurrences(of: "^/+", with: "", options: .regularExpression)

    // append path to scope directory and return URL
    let filePath = directory.appendingPathComponent(path)

    if (shouldExist != nil) {
      let fileExists = fileManager.fileExists(atPath: filePath.path)
      if (shouldExist! && !fileExists) {
        throw NSError(domain: "ERR_FILE_NOT_FOUND", code: 0, userInfo: ["message": "File or directory \(path) not found"])
      } else if (!shouldExist! && fileExists) {
        throw NSError(domain: "ERR_FILE_EXISTS", code: 0, userInfo: ["message": "File or directory \(path) already exists"])
      }
    }

    return filePath
  }
}
