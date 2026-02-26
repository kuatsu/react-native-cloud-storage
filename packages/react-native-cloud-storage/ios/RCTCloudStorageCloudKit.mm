#import <Foundation/Foundation.h>

#import <CloudStorageSpec/CloudStorageSpec.h>

#if __has_include("react_native_cloud_storage-Swift.h")
#import "react_native_cloud_storage-Swift.h"
#elif __has_include(<react_native_cloud_storage/react_native_cloud_storage-Swift.h>)
#import <react_native_cloud_storage/react_native_cloud_storage-Swift.h>
#else
#error "Unable to locate Swift compatibility header for react-native-cloud-storage."
#endif

@interface RCTCloudStorageCloudKit : NativeCloudStorageCloudKitIOSSpecBase <NativeCloudStorageCloudKitIOSSpec>
@end

@implementation RCTCloudStorageCloudKit {
  CloudStorageCloudKit *_cloudStorageCloudKit;
  id<NSObject> _ubiquityIdentityObserver;
}

+ (NSString *)moduleName
{
  return @"CloudStorageCloudKit";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _cloudStorageCloudKit = [CloudStorageCloudKit new];

    __weak __typeof__(self) weakSelf = self;
    _ubiquityIdentityObserver = [[NSNotificationCenter defaultCenter]
        addObserverForName:NSUbiquityIdentityDidChangeNotification
                    object:nil
                     queue:nil
                usingBlock:^(__unused NSNotification *notification) {
                  __strong __typeof__(weakSelf) strongSelf = weakSelf;
                  [strongSelf emitCloudAvailabilityChanged];
                }];
  }

  return self;
}

- (void)dealloc
{
  if (_ubiquityIdentityObserver != nil) {
    [[NSNotificationCenter defaultCenter] removeObserver:_ubiquityIdentityObserver];
    _ubiquityIdentityObserver = nil;
  }
}

- (void)setEventEmitterCallback:(EventEmitterCallbackWrapper *)eventEmitterCallbackWrapper
{
  [super setEventEmitterCallback:eventEmitterCallbackWrapper];
  [self emitCloudAvailabilityChanged];
}

- (void)emitCloudAvailabilityChanged
{
  BOOL isCloudAvailable = [NSFileManager defaultManager].ubiquityIdentityToken != nil;
  [self emitOnCloudAvailabilityChanged:@{ @"available" : @(isCloudAvailable) }];
}

- (void)fileExists:(NSString *)path
             scope:(NSString *)scope
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit fileExists:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)appendToFile:(NSString *)path
                data:(NSString *)data
               scope:(NSString *)scope
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit appendToFile:path withData:data withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)createFile:(NSString *)path
              data:(NSString *)data
             scope:(NSString *)scope
         overwrite:(BOOL)overwrite
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit
      createFile:path
         withData:data
        withScope:scope
    withOverwrite:overwrite
      withResolver:resolve
      withRejecter:reject];
}

- (void)createDirectory:(NSString *)path
                  scope:(NSString *)scope
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit createDirectory:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)listFiles:(NSString *)path
            scope:(NSString *)scope
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit listFiles:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)readFile:(NSString *)path
           scope:(NSString *)scope
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit readFile:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)triggerSync:(NSString *)path
              scope:(NSString *)scope
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit triggerSync:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)deleteFile:(NSString *)path
             scope:(NSString *)scope
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit deleteFile:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)deleteDirectory:(NSString *)path
              recursive:(BOOL)recursive
                  scope:(NSString *)scope
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit
      deleteDirectory:path
         withRecursive:recursive
             withScope:scope
          withResolver:resolve
          withRejecter:reject];
}

- (void)statFile:(NSString *)path
           scope:(NSString *)scope
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit statFile:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)downloadFile:(NSString *)remotePath
           localPath:(NSString *)localPath
               scope:(NSString *)scope
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit
      downloadFile:remotePath
     withLocalPath:localPath
         withScope:scope
      withResolver:resolve
      withRejecter:reject];
}

- (void)uploadFile:(NSString *)remotePath
         localPath:(NSString *)localPath
          mimeType:(NSString *)mimeType
             scope:(NSString *)scope
         overwrite:(BOOL)overwrite
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit
      uploadFile:remotePath
       withLocalPath:localPath
       withMimeType:mimeType
         withScope:scope
     withOverwrite:overwrite
      withResolver:resolve
      withRejecter:reject];
}

- (void)isCloudAvailable:(RCTPromiseResolveBlock)resolve
                  reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageCloudKit isCloudAvailable:resolve withRejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeCloudStorageCloudKitIOSSpecJSI>(params);
}

@end
