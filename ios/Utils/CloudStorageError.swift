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
  case writeError(path: String)
  case readError(path: String)
  case deleteError(path: String)
  case statError(path: String)
  case unknown(message: String = "An unknown error occurred")
  case fileNotDownloadable(path: String)

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
    case .writeError: "ERR_WRITE_ERROR"
    case .readError: "ERR_READ_ERROR"
    case .deleteError: "ERR_DELETE_ERROR"
    case .statError: "ERR_STAT_ERROR"
    case .unknown: "ERR_UNKNOWN"
    case .fileNotDownloadable: "ERR_FILE_NOT_DOWNLOADABLE"
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
    }
  }
}
