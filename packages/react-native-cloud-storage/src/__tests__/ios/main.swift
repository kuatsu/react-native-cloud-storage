import Foundation

let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
defer { try? FileManager.default.removeItem(at: directory) }

let file = directory.appendingPathComponent("backup space é %.zip")
try Data([0, 1, 255]).write(to: file)
for path in [file.path, file.absoluteString] {
  let url = try FileUtils.localFileURL(path: path)
  assert(url.path == file.path)
  let data = try Data(contentsOf: url)
  assert(data == Data([0, 1, 255]))
}

do {
  _ = try FileUtils.localFileURL(path: "file://other-host/backup.zip")
  fatalError("Accepted a non-local file URL")
} catch CloudStorageError.invalidUrl {}

let nativeError = NSError(domain: NSCocoaErrorDomain, code: NSFileReadNoPermissionError)
let error = CloudStorageError.fileNotDownloadable(path: file.path).caused(by: nativeError)
assert(error.code == "ERR_FILE_NOT_DOWNLOADABLE")
assert(error.cause === nativeError)
assert(error.message.contains(nativeError.localizedDescription))

// MARK: - FilePresenter

final class FilePresenter: NSObject, NSFilePresenter {
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

func expectError(_ code: String, _ operation: () throws -> Void) {
  do {
    try operation()
    fatalError("Expected \(code)")
  } catch let error as CloudStorageError {
    assert(error.code == code, "Expected \(code), got \(error.code): \(error.message)")
  } catch {
    fatalError("Unnormalized error: \(error)")
  }
}

let textFile = directory.appendingPathComponent("text.txt")
try FileUtils.writeFile(fileUrl: textFile, content: "one")
let presenter = FilePresenter(url: textFile)
NSFileCoordinator.addFilePresenter(presenter)
defer { NSFileCoordinator.removeFilePresenter(presenter) }
try FileUtils.appendFile(fileUrl: textFile, content: " two")
let content = try FileUtils.readFile(fileUrl: textFile)
assert(content == "one two")
assert(presenter.reads > 0 && presenter.writes > 0)
expectError("ERR_FILE_EXISTS") { try FileUtils.writeFile(fileUrl: textFile, content: "lost", overwrite: false) }
let textStat = try FileUtils.statFile(fileUrl: textFile)
assert(textStat.isFile && textStat.size == 7)

let destination = directory.appendingPathComponent("copy.zip")
try FileUtils.copyFile(from: file, to: destination)
expectError("ERR_FILE_EXISTS") { try FileUtils.copyFile(from: textFile, to: destination) }
try FileUtils.copyFile(from: textFile, to: destination, overwrite: true)
let copied = try FileUtils.readFile(fileUrl: destination)
assert(copied == content)
expectError("ERR_PATH_IS_DIRECTORY") { try FileUtils.copyFile(from: directory, to: destination, overwrite: true) }
let preserved = try FileUtils.readFile(fileUrl: destination)
assert(preserved == content)
let subdirectory = directory.appendingPathComponent("nested/child")
try FileUtils.createDirectory(directoryUrl: subdirectory)
let names = try FileUtils.listFiles(directoryUrl: directory)
assert(names.contains("nested") && names.contains("copy.zip"))
try FileUtils.deleteFileOrDirectory(fileUrl: destination)
let exists = try FileUtils.checkFileExists(fileUrl: destination)
assert(!exists)
expectError("ERR_FILE_NOT_FOUND") { _ = try FileUtils.readFile(fileUrl: destination) }
expectError("ERR_FILE_NOT_FOUND") { _ = try FileUtils.statFile(fileUrl: destination) }

print("iOS file utility checks passed")
