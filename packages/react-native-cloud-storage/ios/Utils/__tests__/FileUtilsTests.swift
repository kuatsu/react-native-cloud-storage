import Foundation
import Testing

// MARK: - FileUtilsTests

final class FileUtilsTests {
  let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)

  init() throws {
    try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
  }

  deinit {
    try? FileManager.default.removeItem(at: directory)
  }

  @Test(arguments: [false, true])
  func localFileURLPreservesPaths(useURL: Bool) throws {
    let file = directory.appendingPathComponent("backup space é %.zip")
    let url = try FileUtils.localFileURL(path: useURL ? file.absoluteString : file.path)
    #expect(url.path == file.path)
  }

  @Test func rejectsNonLocalFileURLs() {
    let error = #expect(throws: CloudStorageError.self) {
      try FileUtils.localFileURL(path: "file://other-host/backup.zip")
    }
    #expect(error?.code == "ERR_INVALID_URL")
  }

  @Test func coordinatesReadsAndWrites() throws {
    let file = directory.appendingPathComponent("text.txt")
    try "one".write(to: file, atomically: true, encoding: .utf8)
    let presenter = FilePresenter(url: file)
    NSFileCoordinator.addFilePresenter(presenter)
    defer { NSFileCoordinator.removeFilePresenter(presenter) }

    try FileUtils.appendFile(fileUrl: file, content: " two")
    #expect(try FileUtils.readFile(fileUrl: file) == "one two")
    #expect(presenter.reads > 0)
    #expect(presenter.writes > 0)
  }

  @Test func concurrentAppendsPreserveAllWrites() async throws {
    let file = directory.appendingPathComponent("concurrent.txt")
    try "".write(to: file, atomically: true, encoding: .utf8)

    try await withThrowingTaskGroup(of: Void.self) { group in
      for _ in 0 ..< 20 {
        group.addTask {
          try await withCheckedThrowingContinuation { (continuation: CheckedContinuation<Void, Error>) in
            DispatchQueue.global().async {
              continuation.resume(with: Result { try FileUtils.appendFile(fileUrl: file, content: "x") })
            }
          }
        }
      }
      try await group.waitForAll()
    }

    #expect(try FileUtils.readFile(fileUrl: file) == String(repeating: "x", count: 20))
  }

  @Test func rejectsWritesWithoutOverwrite() throws {
    let file = directory.appendingPathComponent("text.txt")
    try "kept".write(to: file, atomically: true, encoding: .utf8)

    let error = #expect(throws: CloudStorageError.self) {
      try FileUtils.writeFile(fileUrl: file, content: "lost", overwrite: false)
    }

    #expect(error?.code == "ERR_FILE_EXISTS")
    #expect(try String(contentsOf: file, encoding: .utf8) == "kept")
  }

  @Test(arguments: [0, 256])
  func preservesBinaryFiles(length: Int) throws {
    let file = directory.appendingPathComponent("bytes.bin")
    let data = Data((0 ..< length).map { UInt8($0) })
    try "old".write(to: file, atomically: true, encoding: .utf8)

    try FileUtils.writeFile(fileUrl: file, data: data as NSData)
    #expect(try Data(contentsOf: file) == data)
    #expect(try FileUtils.readBytes(fileUrl: file) as Data == data)
  }

  @Test func copyRespectsOverwriteAndPreservesExistingData() throws {
    let source = directory.appendingPathComponent("source.txt")
    let destination = directory.appendingPathComponent("destination.txt")
    try "new".write(to: source, atomically: true, encoding: .utf8)
    try "kept".write(to: destination, atomically: true, encoding: .utf8)

    let overwriteError = #expect(throws: CloudStorageError.self) {
      try FileUtils.copyFile(from: source, to: destination)
    }
    #expect(overwriteError?.code == "ERR_FILE_EXISTS")
    #expect(try String(contentsOf: destination, encoding: .utf8) == "kept")

    try FileUtils.copyFile(from: source, to: destination, overwrite: true)
    #expect(try String(contentsOf: destination, encoding: .utf8) == "new")

    let sourceError = #expect(throws: CloudStorageError.self) {
      try FileUtils.copyFile(from: directory, to: destination, overwrite: true)
    }
    #expect(sourceError?.code == "ERR_PATH_IS_DIRECTORY")
    #expect(try String(contentsOf: destination, encoding: .utf8) == "new")
  }

  @Test func reportsFileStatistics() throws {
    let file = directory.appendingPathComponent("text.txt")
    try "one two".write(to: file, atomically: true, encoding: .utf8)

    let stat = try FileUtils.statFile(fileUrl: file)
    #expect(stat.isFile)
    #expect(stat.size == 7)
  }

  @Test func rejectsDeletingDirectoriesAsFiles() throws {
    let child = directory.appendingPathComponent("child.txt")
    try "kept".write(to: child, atomically: true, encoding: .utf8)

    let error = #expect(throws: CloudStorageError.self) {
      try FileUtils.deleteFile(fileUrl: directory)
    }

    #expect(error?.code == "ERR_PATH_IS_DIRECTORY")
    #expect(try String(contentsOf: child, encoding: .utf8) == "kept")
    try FileUtils.deleteFile(fileUrl: child)
    #expect(!FileManager.default.fileExists(atPath: child.path))
  }

  @Test(arguments: [false, true])
  func rejectsDeletingFilesAsDirectories(recursive: Bool) throws {
    let file = directory.appendingPathComponent("file.txt")
    try "kept".write(to: file, atomically: true, encoding: .utf8)

    let error = #expect(throws: CloudStorageError.self) {
      try FileUtils.deleteDirectory(directoryUrl: file, recursive: recursive)
    }

    #expect(error?.code == "ERR_PATH_IS_FILE")
    #expect(try String(contentsOf: file, encoding: .utf8) == "kept")
  }

  @Test(arguments: [401, 403, 404, 500])
  func failedDownloadsPreserveExistingFiles(status: Int) throws {
    let destination = directory.appendingPathComponent("backup.txt")
    let temporary = directory.appendingPathComponent("response.txt")
    try "kept".write(to: destination, atomically: true, encoding: .utf8)
    try "error body".write(to: temporary, atomically: true, encoding: .utf8)
    let response = try HTTPURLResponse(url: #require(URL(string: "https://example.com/backup")), statusCode: status, httpVersion: nil, headerFields: nil)

    let error = #expect(throws: CloudStorageError.self) {
      try FileUtils.saveDownloadedFile(temporaryUrl: temporary, response: response, destinationUrl: destination)
    }

    #expect(error?.code == (status == 401 ? "ERR_AUTHENTICATION_FAILED" : status == 404 ? "ERR_FILE_NOT_FOUND" : "ERR_READ_ERROR"))
    #expect(try String(contentsOf: destination, encoding: .utf8) == "kept")
  }

  @Test func normalizesMissingFileErrors() throws {
    let file = directory.appendingPathComponent("missing.txt")
    #expect(try !FileUtils.checkFileExists(fileUrl: file))
    let readError = #expect(throws: CloudStorageError.self) {
      try FileUtils.readFile(fileUrl: file)
    }
    #expect(readError?.code == "ERR_FILE_NOT_FOUND")
    let bytesError = #expect(throws: CloudStorageError.self) {
      try FileUtils.readBytes(fileUrl: file)
    }
    #expect(bytesError?.code == "ERR_FILE_NOT_FOUND")
    let statError = #expect(throws: CloudStorageError.self) {
      try FileUtils.statFile(fileUrl: file)
    }
    #expect(statError?.code == "ERR_FILE_NOT_FOUND")
  }
}

// MARK: - FilePresenter

private final class FilePresenter: NSObject, NSFilePresenter {
  let presentedItemURL: URL?
  let presentedItemOperationQueue = OperationQueue()
  var reads = 0
  var writes = 0

  init(url: URL) {
    presentedItemURL = url
    presentedItemOperationQueue.maxConcurrentOperationCount = 1
  }

  func relinquishPresentedItem(toReader reader: @escaping @Sendable ((@Sendable () -> Void)?) -> Void) {
    reads += 1
    reader(nil)
  }

  func relinquishPresentedItem(toWriter writer: @escaping @Sendable ((@Sendable () -> Void)?) -> Void) {
    writes += 1
    writer(nil)
  }
}
