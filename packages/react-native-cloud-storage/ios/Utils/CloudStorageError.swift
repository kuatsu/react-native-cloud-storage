//
//  CloudStorageError.swift
//  CloudStorage
//
//  Created by Maximilian Krause on 27.09.24.
//  Copyright © 2024 Kuatsu App Agency. All rights reserved.
//

import Foundation

enum CloudStorageError: Error {
  case invalidScope(scope: String)
  case fileNotFound(path: String)
  case pathIsDirectory(path: String)
  case pathIsFile(path: String)
  case directoryNotFound(path: String)
  case directoryNotEmpty(path: String)
  case fileAlreadyExists(path: String)
  case authenticationFailed
  case rateLimited
  case quotaExceeded
  case writeError(path: String)
  case readError(path: String)
  case deleteError(path: String)
  case statError(path: String)
  case unknown(message: String = "An unknown error occurred")
  case fileNotDownloadable(path: String)
  case invalidUrl(url: String)
  case networkError(message: String)
  case native(code: String, message: String, cause: NSError)

  var cause: NSError? {
    if case let .native(_, _, cause) = self {
      return cause
    }
    return nil
  }

  func caused(by error: Error) -> CloudStorageError {
    .native(code: code, message: "\(message): \((error as NSError).localizedDescription)", cause: error as NSError)
  }

  static func httpError(response: HTTPURLResponse, data: Data?, fallback: CloudStorageError) -> CloudStorageError {
    let body = data.flatMap { String(data: $0, encoding: .utf8) } ?? ""
    let json = data.flatMap { try? JSONSerialization.jsonObject(with: $0) } as? [String: Any]
    let error = json?["error"] as? [String: Any]
    let reason = (error?["errors"] as? [[String: Any]])?.first?["reason"] as? String
    let code = switch response.statusCode {
    case 401: CloudStorageError.authenticationFailed.code
    case 404: CloudStorageError.fileNotFound(path: response.url?.path ?? "").code
    case 429: CloudStorageError.rateLimited.code
    default:
      switch reason {
      case "rateLimitExceeded", "userRateLimitExceeded": CloudStorageError.rateLimited.code
      case "storageQuotaExceeded", "dailyLimitExceeded": CloudStorageError.quotaExceeded.code
      case "fileNotDownloadable": CloudStorageError.fileNotDownloadable(path: response.url?.path ?? "").code
      default: fallback.code
      }
    }
    let message = error?["message"] as? String ?? "Request failed with status \(response.statusCode)"
    var details: [String: Any] = [NSLocalizedDescriptionKey: message, "status": response.statusCode, "body": body]
    details["retryAfter"] = response.value(forHTTPHeaderField: "Retry-After")
    let cause = NSError(domain: "CloudStorageHTTPError", code: response.statusCode, userInfo: details)
    return .native(code: code, message: message, cause: cause)
  }

  var code: String {
    switch self {
    case .invalidScope: "ERR_INVALID_SCOPE"
    case .fileNotFound: "ERR_FILE_NOT_FOUND"
    case .pathIsDirectory: "ERR_PATH_IS_DIRECTORY"
    case .pathIsFile: "ERR_PATH_IS_FILE"
    case .directoryNotFound: "ERR_DIRECTORY_NOT_FOUND"
    case .directoryNotEmpty: "ERR_DIRECTORY_NOT_EMPTY"
    case .fileAlreadyExists: "ERR_FILE_EXISTS"
    case .authenticationFailed: "ERR_AUTHENTICATION_FAILED"
    case .rateLimited: "ERR_RATE_LIMITED"
    case .quotaExceeded: "ERR_QUOTA_EXCEEDED"
    case .writeError: "ERR_WRITE_ERROR"
    case .readError: "ERR_READ_ERROR"
    case .deleteError: "ERR_DELETE_ERROR"
    case .statError: "ERR_STAT_ERROR"
    case .unknown: "ERR_UNKNOWN"
    case .fileNotDownloadable: "ERR_FILE_NOT_DOWNLOADABLE"
    case .invalidUrl: "ERR_INVALID_URL"
    case .networkError: "ERR_NETWORK_ERROR"
    case let .native(code, _, _): code
    }
  }

  var message: String {
    switch self {
    case let .invalidScope(scope):
      "Invalid scope \(scope) provided"
    case let .fileNotFound(path):
      "File not found at path \(path)"
    case let .pathIsDirectory(path):
      "Path is a directory at path \(path)"
    case let .pathIsFile(path):
      "Path is a file at path \(path)"
    case let .directoryNotFound(path):
      "Directory not found at path \(path)"
    case let .directoryNotEmpty(path):
      "Directory not empty at path \(path)"
    case let .fileAlreadyExists(path):
      "File already exists at path \(path)"
    case .authenticationFailed:
      "Authentication failed"
    case .rateLimited:
      "Rate limit exceeded"
    case .quotaExceeded:
      "Cloud quota exceeded"
    case let .writeError(path):
      "Write error for path \(path)"
    case let .readError(path):
      "Read error for path \(path)"
    case let .deleteError(path):
      "Delete error for path \(path)"
    case let .statError(path):
      "Stat error for path \(path)"
    case let .unknown(message):
      message
    case let .fileNotDownloadable(path):
      "File not downloadable at path \(path)"
    case let .invalidUrl(url):
      "Invalid URL provided: \(url)"
    case let .networkError(message):
      message
    case let .native(_, message, _):
      message
    }
  }
}
