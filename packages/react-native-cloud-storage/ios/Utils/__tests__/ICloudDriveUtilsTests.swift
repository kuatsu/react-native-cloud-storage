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

  @Test func stopsCompletedQueries() async throws {
    let (result, didStop) = await gather(.success)
    _ = try result.get()
    #expect(didStop)
  }

  @Test func normalizesQueryStartFailuresAndStopsTheQuery() async {
    let (result, didStop) = await gather(.startFailure)
    let error = #expect(throws: CloudStorageError.self) {
      try result.get()
    }
    #expect(error?.code == "ERR_UNKNOWN")
    #expect(didStop)
  }

  @Test func normalizesQueryTimeoutsAndStopsTheQuery() async {
    let (result, didStop) = await gather(.timeout, timeout: 0.01)
    let error = #expect(throws: CloudStorageError.self) {
      try result.get()
    }
    #expect(error?.code == "ERR_NETWORK_ERROR")
    #expect(didStop)
  }

  private func gather(_ behavior: TestMetadataQuery.Behavior, timeout: TimeInterval = 30) async -> (Result<[URL], Error>, Bool) {
    await withCheckedContinuation { continuation in
      DispatchQueue.global().async {
        let query = TestMetadataQuery(behavior)
        let result = Result { try ICloudMetadataQuery(query: query).gather(timeout: timeout) }
        continuation.resume(returning: (result, query.didStop))
      }
    }
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
