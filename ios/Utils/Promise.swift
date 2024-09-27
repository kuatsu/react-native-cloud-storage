//
//  Promise.swift
//  CloudStorage
//
//  Created by Maximilian Krause on 27.09.24.
//  Copyright © 2024 Kuatsu App Agency. All rights reserved.
//

import Foundation

// MARK: - Promise

class Promise {
  private let resolver: RCTPromiseResolveBlock
  private let rejecter: RCTPromiseRejectBlock

  init(resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
    self.resolver = resolver
    self.rejecter = rejecter
  }

  func reject(error: CloudStorageError, cause: NSError? = nil) {
    rejecter(error.code, error.message, cause)
  }

  func resolve(_ value: Any? = nil) {
    resolver(value)
  }
}

/**
 * Wrap a code block with automatic promise resolution and rejection handling, simplifying error handling.
 *
 * The `block` should return a value that can be serialized by the React Native bridge (or `nil`).
 * Any error thrown within the `block` should be of type `CloudStorageError`, otherwise it will be treated as
 * `CloudStorageError.unknown`.
 */
func withPromise(_ promise: Promise, _ block: () throws -> Any?) {
  do {
    let result = try block()
    promise.resolve(result)
  } catch let error as CloudStorageError {
    promise.reject(error: error)
  } catch let error as NSError {
    promise.reject(error: CloudStorageError.unknown(message: error.description), cause: error)
  }
}

/**
 * Wrap a code block with automatic promise resolution and rejection handling, simplifying error handling.
 *
 * The `block` should return a value that can be serialized by the React Native bridge (or `nil`).
 * Any error thrown within the `block` should be of type `CloudStorageError`, otherwise it will be treated as
 * `CloudStorageError.unknown`.
 */
func withPromise(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock, _ block: () throws -> Any?) {
  withPromise(Promise(resolver: resolve, rejecter: reject), block)
}
