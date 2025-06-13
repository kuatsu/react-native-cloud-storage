#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CloudStorageCloudKit, NSObject)

RCT_EXTERN_METHOD(fileExists:(NSString *)path withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(appendToFile:(NSString *)path withData:(NSString *)data withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(createFile:(NSString *)path withData:(NSString *)data withScope:(NSString *)scope withOverwrite:(BOOL)overwrite withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(createDirectory:(NSString *)path withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(listFiles:(NSString *)path withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(readFile:(NSString *)path withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(downloadFile:(NSString *)path withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(deleteFile:(NSString *)path withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(deleteDirectory:(NSString *)path withRecursive:(BOOL)recursive withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(statFile:(NSString *)path withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(downloadFile:(NSString *)remotePath withLocalPath:(NSString *)localPath withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(uploadFile:(NSString *)localPath withRemotePath:(NSString *)remotePath withScope:(NSString *)scope withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(isCloudAvailable:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
