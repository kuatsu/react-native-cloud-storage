import Foundation
import Testing

// MARK: - ICloudDriveUtilsTests

struct ICloudDriveUtilsTests {
  @Test func mergesMetadataAndLocalDirectoryEntries() {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    let urls = [
      directory.appendingPathComponent("remote.zip"),
      directory.appendingPathComponent("nested/remote.txt"),
      directory.appendingPathComponent("Documents/public.txt"),
      directory.appendingPathComponent("../another-container/ignored.zip"),
    ]

    let entries = ICloudDriveUtils.directoryEntries(at: directory, localNames: [".remote.zip.icloud", "local.txt", ".literal.icloud"], metadataURLs: urls)

    #expect(entries == [".literal.icloud", "Documents", "local.txt", "nested", "remote.zip"])
  }

  @Test func matchesDirectoryBoundariesInMetadata() {
    let directory = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
    let urls = [directory.appendingPathComponent("nested/remote.txt")]

    #expect(ICloudDriveUtils.contains(directory.appendingPathComponent("nested"), in: urls))
    #expect(!ICloudDriveUtils.contains(directory.appendingPathComponent("nest"), in: urls))
  }

  @Test func stopsCompletedQueries() throws {
    let query = TestMetadataQuery(.success)
    _ = try ICloudMetadataQuery(query: query).gather(timeout: 1)
    #expect(query.didStop)
  }

  @Test func normalizesQueryStartFailuresAndStopsTheQuery() {
    let query = TestMetadataQuery(.startFailure)
    let error = #expect(throws: CloudStorageError.self) {
      try ICloudMetadataQuery(query: query).gather(timeout: 1)
    }
    #expect(error?.code == "ERR_UNKNOWN")
    #expect(query.didStop)
  }

  @Test func normalizesQueryTimeoutsAndStopsTheQuery() {
    let query = TestMetadataQuery(.timeout)
    let error = #expect(throws: CloudStorageError.self) {
      try ICloudMetadataQuery(query: query).gather(timeout: 0.01)
    }
    #expect(error?.code == "ERR_NETWORK_ERROR")
    #expect(query.didStop)
  }
}

// MARK: - TestMetadataQuery

private final class TestMetadataQuery: NSMetadataQuery {
  enum Behavior { case success, startFailure, timeout }
  let behavior: Behavior
  var didStop = false

  init(_ behavior: Behavior) {
    self.behavior = behavior
    super.init()
  }

  override func start() -> Bool {
    #expect(OperationQueue.current === operationQueue)
    if behavior == .startFailure {
      return false
    }
    if behavior == .success {
      NotificationCenter.default.post(name: .NSMetadataQueryDidFinishGathering, object: self)
    }
    return true
  }

  override var results: [Any] {
    []
  }

  override func disableUpdates() {}
  override func stop() {
    didStop = true
  }
}
