#import <Foundation/Foundation.h>

#import <CloudStorageSpec/CloudStorageSpec.h>

#if __has_include("react_native_cloud_storage-Swift.h")
#import "react_native_cloud_storage-Swift.h"
#elif __has_include(<react_native_cloud_storage/react_native_cloud_storage-Swift.h>)
#import <react_native_cloud_storage/react_native_cloud_storage-Swift.h>
#else
#error "Unable to locate Swift compatibility header for react-native-cloud-storage."
#endif

@interface RCTCloudStorageKVStore : NativeCloudStorageKVStoreIOSSpecBase <NativeCloudStorageKVStoreIOSSpec>
@end

@implementation RCTCloudStorageKVStore {
  CloudStorageKVStore *_cloudStorageKVStore;
  id<NSObject> _externalChangeObserver;
}

+ (NSString *)moduleName
{
  return @"CloudStorageKVStore";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _cloudStorageKVStore = [CloudStorageKVStore new];
    // Install only after codegen binds its callback; an earlier notification can
    // call an empty std::function and crash. See issue #59.
  }

  return self;
}

- (void)dealloc
{
  if (_externalChangeObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:_externalChangeObserver];
    _externalChangeObserver = nil;
  }
}

- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper
{
  [super setEventEmitterCallback:eventEmitterCallbackWrapper];

  if (_externalChangeObserver == nil) {
    __weak __typeof__(self) weakSelf = self;
    _externalChangeObserver = [[NSNotificationCenter defaultCenter]
        addObserverForName:NSUbiquitousKeyValueStoreDidChangeExternallyNotification
                    object:nil
                     queue:nil
                usingBlock:^(NSNotification *notification) {
                  __strong __typeof__(weakSelf) strongSelf = weakSelf;
                  [strongSelf emitExternalChange:notification];
                }];
  }

  [[NSUbiquitousKeyValueStore defaultStore] synchronize];
}

- (void)emitExternalChange:(NSNotification *)notification
{
  NSNumber *reasonValue = notification.userInfo[NSUbiquitousKeyValueStoreChangeReasonKey];
  NSString *reason;

  switch (reasonValue.integerValue) {
    case NSUbiquitousKeyValueStoreServerChange:
      reason = @"server_change";
      break;
    case NSUbiquitousKeyValueStoreInitialSyncChange:
      reason = @"initial_sync";
      break;
    case NSUbiquitousKeyValueStoreQuotaViolationChange:
      reason = @"quota_violation";
      break;
    case NSUbiquitousKeyValueStoreAccountChange:
      reason = @"account_change";
      break;
    default:
      reason = @"server_change";
      break;
  }

  NSArray<NSString *> *changedKeys = notification.userInfo[NSUbiquitousKeyValueStoreChangedKeysKey] ?: @[];
  [self emitOnKVStoreChangedExternally:@{ @"reason" : reason, @"changedKeys" : changedKeys }];
}

- (void)kvGetItem:(NSString *)key
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageKVStore kvGetItem:key withResolver:resolve withRejecter:reject];
}

- (void)kvSetItem:(NSString *)key
            value:(NSString *)value
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageKVStore kvSetItem:key withValue:value withResolver:resolve withRejecter:reject];
}

- (void)kvRemoveItem:(NSString *)key
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageKVStore kvRemoveItem:key withResolver:resolve withRejecter:reject];
}

- (void)kvGetAllKeys:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageKVStore kvGetAllKeys:resolve withRejecter:reject];
}

- (void)kvGetAllItems:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageKVStore kvGetAllItems:resolve withRejecter:reject];
}

- (void)kvClear:(RCTPromiseResolveBlock)resolve
         reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageKVStore kvClear:resolve withRejecter:reject];
}

- (void)kvSync:(RCTPromiseResolveBlock)resolve
        reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageKVStore kvSync:resolve withRejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeCloudStorageKVStoreIOSSpecJSI>(params);
}

@end
