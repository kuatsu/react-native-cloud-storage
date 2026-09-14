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

print("iOS file utility checks passed")
