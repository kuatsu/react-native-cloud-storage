import Foundation

enum FileUtils {
  private static let fileManager = FileManager.default

  private static func finishCoordination<Value>(_ result: Result<Value, Error>?, error: NSError?, fallback: CloudStorageError) throws -> Value {
    if let error {
      throw fallback.caused(by: error)
    }
    do {
      // A successful coordination always calls its accessor.
      return try result!.get()
    } catch let error as CloudStorageError {
      throw error
    } catch {
      throw fallback.caused(by: error)
    }
  }

  private static func coordinateReading<Value>(at url: URL, options: NSFileCoordinator.ReadingOptions = [], error: CloudStorageError, _ operation: (URL) throws -> Value) throws -> Value {
    var coordinationError: NSError?
    var result: Result<Value, Error>?
    NSFileCoordinator().coordinate(readingItemAt: url, options: options, error: &coordinationError) { coordinatedUrl in
      result = Result { try operation(coordinatedUrl) }
    }
    if let coordinationError, coordinationError.domain == NSCocoaErrorDomain,
       [NSFileNoSuchFileError, NSFileReadNoSuchFileError].contains(coordinationError.code) {
      throw CloudStorageError.fileNotFound(path: url.path).caused(by: coordinationError)
    }
    return try finishCoordination(result, error: coordinationError, fallback: error)
  }

  private static func coordinateWriting<Value>(at url: URL, options: NSFileCoordinator.WritingOptions = [], error: CloudStorageError, _ operation: (URL) throws -> Value) throws -> Value {
    var coordinationError: NSError?
    var result: Result<Value, Error>?
    NSFileCoordinator().coordinate(writingItemAt: url, options: options, error: &coordinationError) { coordinatedUrl in
      result = Result { try operation(coordinatedUrl) }
    }
    return try finishCoordination(result, error: coordinationError, fallback: error)
  }

  static func checkFileExists(fileUrl: URL) throws -> Bool {
    do {
      return try coordinateReading(at: fileUrl, options: .immediatelyAvailableMetadataOnly, error: .readError(path: fileUrl.path)) { url in
        fileManager.fileExists(atPath: url.path) || fileManager.isUbiquitousItem(at: url)
      }
    } catch let error as CloudStorageError {
      if let cause = error.cause, cause.domain == NSCocoaErrorDomain,
         [NSFileNoSuchFileError, NSFileReadNoSuchFileError].contains(cause.code) {
        return false
      }
      throw error
    }
  }

  static func readFile(fileUrl: URL) throws -> String {
    try coordinateReading(at: fileUrl, error: .readError(path: fileUrl.path)) { url in
      guard fileManager.fileExists(atPath: url.path) else {
        throw CloudStorageError.fileNotFound(path: url.path)
      }
      return try String(contentsOf: url, encoding: .utf8)
    }
  }

  static func writeFile(fileUrl: URL, content: String, overwrite: Bool = true) throws {
    try coordinateWriting(at: fileUrl, options: .forReplacing, error: .writeError(path: fileUrl.path)) { url in
      if !overwrite, fileManager.fileExists(atPath: url.path) || fileManager.isUbiquitousItem(at: url) {
        throw CloudStorageError.fileAlreadyExists(path: url.path)
      }
      try content.write(to: url, atomically: true, encoding: .utf8)
    }
  }

  static func appendFile(fileUrl: URL, content: String) throws {
    try coordinateWriting(at: fileUrl, options: .forMerging, error: .writeError(path: fileUrl.path)) { url in
      let existing = fileManager.fileExists(atPath: url.path) ? try String(contentsOf: url, encoding: .utf8) : ""
      try (existing + content).write(to: url, atomically: true, encoding: .utf8)
    }
  }

  static func createDirectory(directoryUrl: URL) throws {
    try coordinateWriting(at: directoryUrl, error: .writeError(path: directoryUrl.path)) { url in
      try fileManager.createDirectory(at: url, withIntermediateDirectories: true, attributes: nil)
    }
  }

  static func listFiles(directoryUrl: URL) throws -> [String] {
    try coordinateReading(at: directoryUrl, options: .immediatelyAvailableMetadataOnly, error: .readError(path: directoryUrl.path)) { url in
      try fileManager.contentsOfDirectory(atPath: url.path)
    }
  }

  static func deleteFileOrDirectory(fileUrl: URL) throws {
    try coordinateWriting(at: fileUrl, options: .forDeleting, error: .deleteError(path: fileUrl.path)) { url in
      try fileManager.removeItem(at: url)
    }
  }

  static func copyFile(from sourceUrl: URL, to destinationUrl: URL, overwrite: Bool = false) throws {
    var coordinationError: NSError?
    var result: Result<Void, Error>?
    NSFileCoordinator().coordinate(readingItemAt: sourceUrl, options: [], writingItemAt: destinationUrl, options: .forReplacing, error: &coordinationError) { source, destination in
      result = Result {
        guard fileManager.fileExists(atPath: source.path) else {
          throw CloudStorageError.fileNotFound(path: source.path)
        }
        if try source.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true {
          throw CloudStorageError.pathIsDirectory(path: source.path)
        }
        let parent = destination.deletingLastPathComponent()
        guard fileManager.fileExists(atPath: parent.path) else {
          throw CloudStorageError.directoryNotFound(path: parent.path)
        }
        if try parent.resourceValues(forKeys: [.isDirectoryKey]).isDirectory != true {
          throw CloudStorageError.pathIsFile(path: parent.path)
        }

        if fileManager.fileExists(atPath: destination.path) || fileManager.isUbiquitousItem(at: destination) {
          guard overwrite else { throw CloudStorageError.fileAlreadyExists(path: destination.path) }
          if try destination.resourceValues(forKeys: [.isDirectoryKey]).isDirectory == true {
            throw CloudStorageError.pathIsDirectory(path: destination.path)
          }
          // Stage outside the cloud container so a failed copy cannot destroy the existing backup.
          let stagingDirectory = try fileManager.url(for: .itemReplacementDirectory, in: .userDomainMask, appropriateFor: destination, create: true)
          defer { try? fileManager.removeItem(at: stagingDirectory) }
          let stagedFile = stagingDirectory.appendingPathComponent(destination.lastPathComponent)
          try fileManager.copyItem(at: source, to: stagedFile)
          _ = try fileManager.replaceItemAt(destination, withItemAt: stagedFile)
        } else {
          try fileManager.copyItem(at: source, to: destination)
        }
      }
    }
    try finishCoordination(result, error: coordinationError, fallback: .writeError(path: destinationUrl.path))
  }

  static func statFile(fileUrl: URL) throws -> FileStat {
    try coordinateReading(at: fileUrl, options: .immediatelyAvailableMetadataOnly, error: .statError(path: fileUrl.path)) { url in
      guard fileManager.fileExists(atPath: url.path) || fileManager.isUbiquitousItem(at: url) else {
        throw CloudStorageError.fileNotFound(path: url.path)
      }
      let values = try url.resourceValues(forKeys: [.fileSizeKey, .creationDateKey, .contentModificationDateKey, .isDirectoryKey, .isRegularFileKey])
      guard let size = values.fileSize, let birthtime = values.creationDate, let mtime = values.contentModificationDate else {
        throw CloudStorageError.statError(path: url.path)
      }
      return FileStat(
        size: UInt64(size),
        birthtimeMs: birthtime.timeIntervalSince1970 * 1000,
        mtimeMs: mtime.timeIntervalSince1970 * 1000,
        isDirectory: values.isDirectory == true,
        isFile: values.isRegularFile == true
      )
    }
  }

  static func localFileURL(path: String) throws -> URL {
    guard path.lowercased().hasPrefix("file:") else {
      return URL(fileURLWithPath: path)
    }
    guard let url = URL(string: path), url.isFileURL, url.path.hasPrefix("/"),
          url.host == nil || url.host == "" || url.host == "localhost" else {
      throw CloudStorageError.invalidUrl(url: path)
    }
    return url
  }

  static func sanitizePath(path: String) -> String {
    path.replacingOccurrences(of: "^/+", with: "", options: .regularExpression)
  }

  static var temporaryDirectory: URL {
    fileManager.temporaryDirectory
  }
}
