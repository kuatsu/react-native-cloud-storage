//
//  FileUtils.swift
//  CloudStorage
//
//  Created by Maximilian Krause on 27.09.24.
//  Copyright © 2024 Kuatsu App Agency. All rights reserved.
//

import Foundation

enum FileUtils {
  private static let fileManager = FileManager.default

  static func checkFileExists(fileUrl: URL) throws -> Bool {
    fileManager.fileExists(atPath: fileUrl.path)
  }

  /**
     Reads a file and returns its content as a string.

     - Parameter fileUrl: The URL of the file to read.
     - Returns: The content of the file as a string.
     - Throws: An NSError if the file couldn't be read.
   */
  static func readFile(fileUrl: URL) throws -> String {
    if try !checkFileExists(fileUrl: fileUrl) {
      throw CloudStorageError.fileNotFound(path: fileUrl.path)
    }

    do {
      let fileContents = try String(contentsOf: fileUrl, encoding: .utf8)
      return fileContents
    } catch {
      throw CloudStorageError.readError(path: fileUrl.path)
    }
  }

  /**
     Writes a string to a file. If the file already exists, it will be overwritten.

     - Parameter fileUrl: The URL of the file to write to.
     - Parameter content: The string to write to the file.
     - Throws: An NSError if the file couldn't be written to.
   */
  static func writeFile(fileUrl: URL, content: String) throws {
    do {
      try content.write(to: fileUrl, atomically: true, encoding: .utf8)
    } catch {
      throw CloudStorageError.writeError(path: fileUrl.path)
    }
  }

  /**
     Creates a directory.

     - Parameter directoryUrl: The URL of the directory to create.
     - Throws: An NSError if the directory couldn't be created.
   */
  static func createDirectory(directoryUrl: URL) throws {
    do {
      try fileManager.createDirectory(at: directoryUrl, withIntermediateDirectories: true, attributes: nil)
    } catch {
      throw CloudStorageError.writeError(path: directoryUrl.path)
    }
  }

  /**
     Lists the files in a directory.

     - Parameter directoryUrl: The URL of the directory to list the files of.
     - Returns: An array of Strings representing the file names.
     - Throws: An NSError if the directory couldn't be read.
   */
  static func listFiles(directoryUrl: URL) throws -> [String] {
    do {
      let fileUrls = try fileManager.contentsOfDirectory(atPath: directoryUrl.path)
      return fileUrls
    } catch {
      throw CloudStorageError.readError(path: directoryUrl.path)
    }
  }

  /**
     Deletes a file or directory.

     - Parameter fileUrl: The URL of the file or directory to delete.
     - Throws: An NSError if the file / directory couldn't be deleted.
   */
  static func deleteFileOrDirectory(fileUrl: URL) throws {
    do {
      try fileManager.removeItem(at: fileUrl)
    } catch {
      throw CloudStorageError.deleteError(path: fileUrl.path)
    }
  }

  /**
     Gets the stats of a file.

     - Parameter fileUrl: The URL of the file to get the stats of.
     - Returns: The stats of the file.
     - Throws: An NSError if the stats couldn't be retrieved.
   */
  static func statFile(fileUrl: URL) throws -> FileStat {
    if try !checkFileExists(fileUrl: fileUrl) {
      throw CloudStorageError.fileNotFound(path: fileUrl.path)
    }

    do {
      let attributes = try fileManager.attributesOfItem(atPath: fileUrl.path)
      let size = attributes[FileAttributeKey.size] as! UInt64
      let birthtime = attributes[FileAttributeKey.creationDate] as! Date
      let mtime = attributes[FileAttributeKey.modificationDate] as! Date
      let isDirectory = attributes[FileAttributeKey.type] as! FileAttributeType == FileAttributeType.typeDirectory
      let isFile = attributes[FileAttributeKey.type] as! FileAttributeType == FileAttributeType.typeRegular

      return FileStat(
        size: size,
        birthtimeMs: birthtime.timeIntervalSince1970 * 1000,
        mtimeMs: mtime.timeIntervalSince1970 * 1000,
        isDirectory: isDirectory,
        isFile: isFile
      )
    } catch {
      throw CloudStorageError.statError(path: fileUrl.path)
    }
  }

  static func sanitizePath(path: String) -> String {
    path.replacingOccurrences(of: "^/+", with: "", options: .regularExpression)
  }
}
