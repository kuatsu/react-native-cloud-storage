#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(CloudStorageLocalFileSystem, NSObject)

RCT_EXTERN_METHOD(readFile:(NSString *)path withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(createTemporaryFile:(NSString *)filename withData:(NSString *)data withResolver:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

@end
