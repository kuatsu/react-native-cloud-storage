#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CloudStorageLocalFileSystem, NSObject)

RCT_EXTERN_METHOD(readFile:(NSString *)path withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(createFile:(NSString *)path withData:(NSString *)data withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(downloadFile:(NSString *)remoteUri withLocalPath:(NSString *)localPath withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(uploadFile:(NSString *)localPath withRemoteUri:(NSString *)remoteUri withOptions:(NSDictionary *)options withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
