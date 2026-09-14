//
//  CloudKitUtils.swift
//  CloudStorage
//
//  Created by Maximilian Krause on 27.09.24.
//  Copyright © 2024 Kuatsu App Agency. All rights reserved.
//

import Foundation

// MARK: - CloudKitUtils

enum CloudKitUtils {
  private static let fileManager = FileManager.default

  /**
     Checks if the CloudKit service is available.

     - Returns: True if the CloudKit service is available, false otherwise.
   */
  static func isCloudKitAvailable() -> Bool {
    fileManager.ubiquityIdentityToken != nil
  }

  /**
     Syncs a file from iCloud to the device.

     - Parameter fileUrl: The URL of the file to sync.
     - Throws: An NSError if the file is not downloadable or the sync failed.
   */
  static func triggerSync(fileUrl: URL) throws {
    do {
      try fileManager.startDownloadingUbiquitousItem(at: fileUrl)
    } catch {
      throw CloudStorageError.fileNotDownloadable(path: fileUrl.path).caused(by: error)
    }
  }

  /**
     Returns the directory URL for the given scope.

     - Parameter scope: The scope of the directory.
     - Returns: The URL of the scope directory, or nil if no directory is found.
   */
  private static func getScopeDirectory(scope: DirectoryScope) -> URL? {
    switch scope {
    case .appData:
      appDataDirectory
    case .documents:
      documentsDirectory
    case .documentsLegacy:
      legacyDocumentsDirectory
    }
  }

  /**
     Parses a given path and directory scope to a full file URL.

     - Parameter path: The path of the file.
     - Parameter scope: The scope of the directory.
     - Parameter shouldExist: Whether the file should exist. If true, throws an error if the file does not exist. If false, throws an error if the file exists. If nil, does not check if the file exists.
     - Returns: The full URL of the file.
     - Throws: An NSError if the scope directory couldn't be found or the file should exist but doesn't or vice versa.
   */
  static func getFileURL(path: String, scope: DirectoryScope, _ shouldExist: Bool? = nil) throws -> URL {
    guard let directory = getScopeDirectory(scope: scope) else {
      throw CloudStorageError.directoryNotFound(path: path)
    }

    // append path to scope directory
    let fileUrl = directory.appendingPathComponent(FileUtils.sanitizePath(path: path))

    if shouldExist != nil {
      var fileExists = try FileUtils.checkFileExists(fileUrl: fileUrl)
      if !fileExists, scope != .documentsLegacy {
        let urls = try ICloudMetadataQuery().gather()
        if let discoveredUrl = urls.first(where: { canonicalPath($0) == canonicalPath(fileUrl) }), shouldExist == true {
          return discoveredUrl
        }
        fileExists = contains(fileUrl, in: urls)
      }
      if shouldExist! && !fileExists {
        throw CloudStorageError.fileNotFound(path: path)
      } else if !shouldExist! && fileExists {
        throw CloudStorageError.fileAlreadyExists(path: path)
      }
    }

    return fileUrl
  }

  /**
     Parses a given path and unchecked directory scope to a full file URL.

     - Parameter path: The path of the file.
     - Parameter scope: The scope of the directory. Will be checked for validity.
     - Parameter shouldExist: Whether the file should exist. If true, throws an error if the file does not exist. If false, throws an error if the file exists. If nil, does not check if the file exists.
     - Returns: The full URL of the file.
     - Throws: An NSError if the scope directory couldn't be found or the file should exist but doesn't or vice versa.
   */
  static func getFileURL(path: String, scope: String, _ shouldExist: Bool? = nil) throws -> URL {
    guard let directoryScope = DirectoryScope(rawValue: scope) else {
      throw CloudStorageError.invalidScope(scope: scope)
    }

    return try getFileURL(path: path, scope: directoryScope, shouldExist)
  }

  private static func canonicalPath(_ url: URL) -> String {
    url.standardizedFileURL.resolvingSymlinksInPath().path
  }

  static func contains(_ url: URL, in metadataURLs: [URL]) -> Bool {
    let path = canonicalPath(url)
    return metadataURLs.contains { canonicalPath($0) == path || canonicalPath($0).hasPrefix(path + "/") }
  }

  static func directoryEntries(at directoryUrl: URL, localNames: [String], metadataURLs: [URL]) -> [String] {
    let prefix = canonicalPath(directoryUrl) + "/"
    let cloudNames = Set(metadataURLs.compactMap { url -> String? in
      let path = canonicalPath(url)
      guard path.hasPrefix(prefix) else { return nil }
      return path.dropFirst(prefix.count).split(separator: "/").first.map(String.init)
    })
    let localNames = localNames.filter { name in
      // Hide a physical placeholder only when metadata supplies its logical filename.
      !(name.hasPrefix(".") && name.hasSuffix(".icloud") && !cloudNames.contains(name)
        && cloudNames.contains(String(name.dropFirst().dropLast(".icloud".count))))
    }
    return cloudNames.union(localNames).sorted()
  }

  static func listFiles(directoryUrl: URL, scope: String) throws -> [String] {
    if scope == DirectoryScope.documentsLegacy.rawValue {
      return try FileUtils.listFiles(directoryUrl: directoryUrl)
    }
    let urls = try ICloudMetadataQuery().gather()
    let localNames: [String]
    do {
      localNames = try FileUtils.listFiles(directoryUrl: directoryUrl)
    } catch let error as CloudStorageError {
      guard let cause = error.cause, cause.domain == NSCocoaErrorDomain,
            [NSFileNoSuchFileError, NSFileReadNoSuchFileError].contains(cause.code),
            contains(directoryUrl, in: urls) else { throw error }
      return directoryEntries(at: directoryUrl, localNames: [], metadataURLs: urls)
    }
    return directoryEntries(at: directoryUrl, localNames: localNames, metadataURLs: urls)
  }

  static var appDataDirectory: URL? {
    fileManager.url(forUbiquityContainerIdentifier: nil)
  }

  static var documentsDirectory: URL? {
    fileManager.url(forUbiquityContainerIdentifier: nil)?.appendingPathComponent("Documents")
  }

  static var legacyDocumentsDirectory: URL? {
    fileManager.urls(for: .documentDirectory, in: .userDomainMask).first
  }
}

// MARK: - ICloudMetadataQuery

final class ICloudMetadataQuery {
  private let query: NSMetadataQuery
  private let queue = OperationQueue()
  private let completion = DispatchSemaphore(value: 0)
  private var result: Result<[URL], Error>?

  init(query: NSMetadataQuery = NSMetadataQuery()) {
    self.query = query
    queue.maxConcurrentOperationCount = 1
    query.operationQueue = queue
    query.searchScopes = [NSMetadataQueryUbiquitousDataScope, NSMetadataQueryUbiquitousDocumentsScope]
    query.predicate = NSPredicate(format: "%K LIKE %@", NSMetadataItemFSNameKey, "*")
  }

  func gather(timeout: TimeInterval = 30) throws -> [URL] {
    let observer = NotificationCenter.default.addObserver(forName: .NSMetadataQueryDidFinishGathering, object: query, queue: queue) { [self] _ in
      query.disableUpdates()
      result = .success(query.results.compactMap { ($0 as? NSMetadataItem)?.value(forAttribute: NSMetadataItemURLKey) as? URL })
      completion.signal()
    }
    defer {
      queue.addOperations([BlockOperation { [self] in
        query.stop()
        NotificationCenter.default.removeObserver(observer)
      }], waitUntilFinished: true)
    }
    queue.addOperation { [self] in
      if !query.start() {
        result = .failure(CloudStorageError.unknown(message: "Could not start the iCloud metadata query"))
        completion.signal()
      }
    }
    guard completion.wait(timeout: .now() + timeout) == .success else {
      throw CloudStorageError.networkError(message: "The iCloud metadata query timed out")
    }
    return try result!.get()
  }
}
