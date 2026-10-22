import Foundation
import Testing

struct CloudStorageErrorTests {
  @Test func preservesUnderlyingErrorDetails() {
    let cause = NSError(domain: NSCocoaErrorDomain, code: NSFileReadNoPermissionError)
    let error = CloudStorageError.fileNotDownloadable(path: "/backup.zip").caused(by: cause)

    #expect(error.code == "ERR_FILE_NOT_DOWNLOADABLE")
    #expect(error.cause?.domain == cause.domain)
    #expect(error.cause?.code == cause.code)
    #expect(error.message.contains(cause.localizedDescription))
  }
}
