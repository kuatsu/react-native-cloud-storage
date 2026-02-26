#import <Foundation/Foundation.h>

#import <CloudStorageSpec/CloudStorageSpec.h>

#if __has_include("react_native_cloud_storage-Swift.h")
#import "react_native_cloud_storage-Swift.h"
#elif __has_include(<react_native_cloud_storage/react_native_cloud_storage-Swift.h>)
#import <react_native_cloud_storage/react_native_cloud_storage-Swift.h>
#else
#error "Unable to locate Swift compatibility header for react-native-cloud-storage."
#endif

@interface RCTCloudStorageLocalFileSystem : NSObject <NativeCloudStorageLocalFileSystemSpec>
@end

@implementation RCTCloudStorageLocalFileSystem {
  CloudStorageLocalFileSystem *_cloudStorageLocalFileSystem;
}

+ (NSString *)moduleName
{
  return @"CloudStorageLocalFileSystem";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _cloudStorageLocalFileSystem = [CloudStorageLocalFileSystem new];
  }

  return self;
}

- (NSDictionary<NSString *, id> *)serializeDownloadOptions:
    (JS::NativeCloudStorageLocalFileSystem::LocalFileSystemDownloadOptions &)options
{
  NSMutableDictionary<NSString *, id> *serializedOptions = [NSMutableDictionary new];

  id<NSObject> headers = options.headers();
  if (headers != nil) {
    serializedOptions[@"headers"] = headers;
  }

  return serializedOptions;
}

- (NSDictionary<NSString *, id> *)serializeUploadOptions:
    (JS::NativeCloudStorageLocalFileSystem::LocalFileSystemUploadOptions &)options
{
  NSMutableDictionary<NSString *, id> *serializedOptions = [NSMutableDictionary new];

  id<NSObject> headers = options.headers();
  if (headers != nil) {
    serializedOptions[@"headers"] = headers;
  }

  NSString *method = options.method();
  if (method != nil) {
    serializedOptions[@"method"] = method;
  }

  NSString *uploadType = options.uploadType();
  if (uploadType != nil) {
    serializedOptions[@"uploadType"] = uploadType;
  }

  NSString *fieldName = options.fieldName();
  if (fieldName != nil) {
    serializedOptions[@"fieldName"] = fieldName;
  }

  id<NSObject> parameters = options.parameters();
  if (parameters != nil) {
    serializedOptions[@"parameters"] = parameters;
  }

  return serializedOptions;
}

- (facebook::react::ModuleConstants<JS::NativeCloudStorageLocalFileSystem::Constants::Builder>)constantsToExport
{
  return (facebook::react::ModuleConstants<JS::NativeCloudStorageLocalFileSystem::Constants::Builder>)[self getConstants];
}

- (facebook::react::ModuleConstants<JS::NativeCloudStorageLocalFileSystem::Constants::Builder>)getConstants
{
  NSDictionary<NSString *, id> *constants = [_cloudStorageLocalFileSystem constantsToExport];
  NSString *temporaryDirectory = constants[@"temporaryDirectory"];

  return facebook::react::typedConstants<JS::NativeCloudStorageLocalFileSystem::Constants::Builder>({
      .temporaryDirectory = temporaryDirectory ?: NSTemporaryDirectory(),
  });
}

- (void)createFile:(NSString *)path
              data:(NSString *)data
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageLocalFileSystem createFile:path withData:data withResolver:resolve withRejecter:reject];
}

- (void)readFile:(NSString *)path
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageLocalFileSystem readFile:path withResolver:resolve withRejecter:reject];
}

- (void)downloadFile:(NSString *)remoteUri
           localPath:(NSString *)localPath
             options:(JS::NativeCloudStorageLocalFileSystem::LocalFileSystemDownloadOptions &)options
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageLocalFileSystem
      downloadFile:remoteUri
     withLocalPath:localPath
       withOptions:[self serializeDownloadOptions:options]
      withResolver:resolve
      withRejecter:reject];
}

- (void)uploadFile:(NSString *)localPath
         remoteUri:(NSString *)remoteUri
           options:(JS::NativeCloudStorageLocalFileSystem::LocalFileSystemUploadOptions &)options
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageLocalFileSystem
      uploadFile:localPath
     withRemoteUri:remoteUri
       withOptions:[self serializeUploadOptions:options]
      withResolver:resolve
      withRejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeCloudStorageLocalFileSystemSpecJSI>(params);
}

@end
