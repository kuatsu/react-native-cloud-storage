import Foundation
import React

@objc(CloudStorageKVStore)
public class CloudStorageKVStore: NSObject {
  private let store = NSUbiquitousKeyValueStore.default

  @objc(kvGetItem:withResolver:withRejecter:)
  public func kvGetItem(key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      self.store.string(forKey: key)
    }
  }

  @objc(kvSetItem:withValue:withResolver:withRejecter:)
  public func kvSetItem(key: String, value: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      self.store.set(value, forKey: key)
    }
  }

  @objc(kvRemoveItem:withResolver:withRejecter:)
  public func kvRemoveItem(key: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      self.store.removeObject(forKey: key)
    }
  }

  @objc(kvGetAllKeys:withRejecter:)
  public func kvGetAllKeys(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      self.store.dictionaryRepresentation.compactMap { key, value -> String? in
        value is String ? key : nil
      }
    }
  }

  /// Skips values written as non-string types by earlier app versions.
  @objc(kvGetAllItems:withRejecter:)
  public func kvGetAllItems(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      self.store.dictionaryRepresentation.compactMap { key, value -> [String: String]? in
        guard let value = value as? String else { return nil }
        return ["key": key, "value": value]
      }
    }
  }

  @objc(kvClear:withRejecter:)
  public func kvClear(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      for key in self.store.dictionaryRepresentation.keys {
        self.store.removeObject(forKey: key)
      }
      return nil
    }
  }

  @objc(kvSync:withRejecter:)
  public func kvSync(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    withPromise(resolve: resolve, reject: reject) {
      self.store.synchronize()
    }
  }
}
