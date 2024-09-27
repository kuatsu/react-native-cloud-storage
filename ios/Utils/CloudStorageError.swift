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
        case .invalidScope: return "ERR_INVALID_SCOPE"
        case .fileNotFound: return "ERR_FILE_NOT_FOUND"
        case .pathIsDirectory: return "ERR_PATH_IS_DIRECTORY"
        case .pathIsFile: return "ERR_PATH_IS_FILE"
        case .directoryNotFound: return "ERR_DIRECTORY_NOT_FOUND"
        case .directoryNotEmpty: return "ERR_DIRECTORY_NOT_EMPTY"
        case .fileAlreadyExists: return "ERR_FILE_EXISTS"
        case .authenticationFailed: return "ERR_AUTHENTICATION_FAILED"
        case .writeError: return "ERR_WRITE_ERROR"
        case .readError: return "ERR_READ_ERROR"
        case .deleteError: return "ERR_DELETE_ERROR"
        case .statError: return "ERR_STAT_ERROR"
        case .unknown: return "ERR_UNKNOWN"
        case .fileNotDownloadable: return "ERR_FILE_NOT_DOWNLOADABLE"
        }
    }

    var message: String {
        switch self {
        case .invalidScope(let scope):
            return "Invalid scope \(scope) provided"
        case .fileNotFound(let path):
            return "File not found at path \(path)"
        case .pathIsDirectory(let path):
            return "Path is a directory at path \(path)"
        case .pathIsFile(let path):
            return "Path is a file at path \(path)"
        case .directoryNotFound(let path):
            return "Directory not found at path \(path)"
        case .directoryNotEmpty(let path):
            return "Directory not empty at path \(path)"
        case .fileAlreadyExists(let path):
            return "File already exists at path \(path)"
        case .authenticationFailed:
            return "Authentication failed"
        case .writeError(let path):
            return "Write error for path \(path)"
        case .readError(let path):
            return "Read error for path \(path)"
        case .deleteError(let path):
            return "Delete error for path \(path)"
        case .statError(let path):
            return "Stat error for path \(path)"
        case .unknown(let message):
            return message
        case .fileNotDownloadable(let path):
            return "File not downloadable at path \(path)"
        }
    }
}
