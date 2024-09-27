//
//  CloudKitUtils.swift
//  CloudStorage
//
//  Created by Maximilian Krause on 27.09.24.
//  Copyright © 2024 Kuatsu App Agency. All rights reserved.
//

import Foundation

enum CloudKitUtils {
  private static let fileManager = FileManager.default

  /**
    Checks if the CloudKit service is available.

    - Returns: True if the CloudKit service is available, false otherwise.
  */
  static func isCloudKitAvailable() -> Bool {
    return fileManager.ubiquityIdentityToken != nil
  }

  /**
    Downloads a file from iCloud.

    - Parameter fileUrl: The URL of the file to download.
    - Throws: An NSError if the file is not downloadable or the download failed.
  */
  static func downloadFile(fileUrl: URL) throws -> Void {
    let isDownloadable = fileManager.isUbiquitousItem(at: fileUrl)

    if (!isDownloadable) {
      throw CloudStorageError.fileNotDownloadable(path: fileUrl.path)
    }

    do {
      // trigger download of file
      try fileManager.startDownloadingUbiquitousItem(at: fileUrl)
    } catch {
      throw CloudStorageError.fileNotDownloadable(path: fileUrl.path)
    }
  }

  /**
    Returns the iCloud directory URL for the given scope.

    - Parameter scope: The scope of the directory.
    - Returns: The URL of the iCloud directory, or nil if no directory is found.
  */
  private static func getScopeDirectory(scope: DirectoryScope) -> URL? {
    switch scope {
      case .appData:
        return appDataDirectory
      case .documents:
        return documentsDirectory
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

    if (shouldExist != nil) {
      let fileExists = try FileUtils.checkFileExists(fileUrl: fileUrl)
      if (shouldExist! && !fileExists) {
        throw CloudStorageError.fileNotFound(path: path)
      } else if (!shouldExist! && fileExists) {
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

  static var appDataDirectory: URL? {
    return fileManager.url(forUbiquityContainerIdentifier: nil)
  }

  static var documentsDirectory: URL? {
    return fileManager.urls(for: .documentDirectory, in: .userDomainMask).first
  }
}
