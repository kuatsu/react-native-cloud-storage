//
//  Types.swift
//  CloudStorage
//
//  Created by Maximilian Krause on 27.09.24.
//  Copyright © 2024 Kuatsu App Agency. All rights reserved.
//

import Foundation

// MARK: - UploadType

@frozen
enum UploadType: String {
  case multipart
  case binary
}

// MARK: - DirectoryScope

@frozen
enum DirectoryScope: String {
  case appData = "app_data"
  case documents
}

// MARK: - FileStat

struct FileStat: Encodable {
  let size: UInt64
  let birthtimeMs: Double
  let mtimeMs: Double
  let isDirectory: Bool
  let isFile: Bool

  func toDictionary() -> [String: Any] {
    guard let data = try? JSONEncoder().encode(self),
          let dictionary = try? JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any]
    else {
      return [:]
    }
    return dictionary
  }
}
