#import <Foundation/Foundation.h>

#import <CloudStorageSpec/CloudStorageSpec.h>
#import <React/RCTUtils.h>
#include <react/bridging/Function.h>
#include <cmath>

#if __has_include("react_native_cloud_storage-Swift.h")
#import "react_native_cloud_storage-Swift.h"
#elif __has_include(<react_native_cloud_storage/react_native_cloud_storage-Swift.h>)
#import <react_native_cloud_storage/react_native_cloud_storage-Swift.h>
#else
#error "Unable to locate Swift compatibility header for react-native-cloud-storage."
#endif

namespace {
namespace jsi = facebook::jsi;
namespace react = facebook::react;

class FileBuffer final : public jsi::MutableBuffer {
 public:
  explicit FileBuffer(NSMutableData *data) : data_(data) {}
  size_t size() const override { return data_.length; }
  uint8_t *data() override { return static_cast<uint8_t *>(data_.mutableBytes); }

 private:
  NSMutableData *data_;
};

static NSString *stringArgument(jsi::Runtime &runtime, const jsi::Value &value)
{
  auto string = value.asString(runtime).utf8(runtime);
  return [[NSString alloc] initWithBytes:string.data() length:string.size() encoding:NSUTF8StringEncoding];
}

static jsi::Value binaryPromise(
    jsi::Runtime &runtime,
    const std::shared_ptr<react::CallInvoker> &invoker,
    void (^operation)(RCTPromiseResolveBlock, RCTPromiseRejectBlock))
{
  auto executor = jsi::Function::createFromHostFunction(
      runtime, jsi::PropNameID::forAscii(runtime, "executor"), 2,
      [invoker, operation](jsi::Runtime &runtime, const jsi::Value &, const jsi::Value *arguments, size_t) {
        react::AsyncCallback<> resolve(runtime, arguments[0].asObject(runtime).asFunction(runtime), invoker);
        react::AsyncCallback<> reject(runtime, arguments[1].asObject(runtime).asFunction(runtime), invoker);
        operation(
            ^(id result) {
              resolve.call([result](jsi::Runtime &runtime, jsi::Function &callback) {
                if (result) {
                  auto buffer = std::make_shared<FileBuffer>((NSMutableData *)result);
                  callback.call(runtime, jsi::ArrayBuffer(runtime, std::move(buffer)));
                } else {
                  callback.call(runtime);
                }
              });
            },
            ^(NSString *code, NSString *message, NSError *cause) {
              NSDictionary *error = RCTJSErrorFromCodeMessageAndNSError(code, message, cause);
              reject.call([error](jsi::Runtime &runtime, jsi::Function &callback) {
                callback.call(runtime, react::TurboModuleConvertUtils::convertObjCObjectToJSIValue(runtime, error));
              });
            });
        return jsi::Value::undefined();
      });
  return runtime.global().getPropertyAsFunction(runtime, "Promise").callAsConstructor(runtime, executor);
}

class ICloudDriveTurboModule final : public react::NativeCloudStorageICloudDriveIOSSpecJSI {
 public:
  ICloudDriveTurboModule(const react::ObjCTurboModule::InitParams &params, CloudStorageICloudDrive *storage)
      : NativeCloudStorageICloudDriveIOSSpecJSI(params), storage_(storage)
  {
    methodMap_["readBytes"] = {2, [](jsi::Runtime &runtime, react::TurboModule &module, const jsi::Value *arguments, size_t count) {
      return static_cast<ICloudDriveTurboModule &>(module).readBytes(runtime, arguments, count);
    }};
    methodMap_["writeBytes"] = {6, [](jsi::Runtime &runtime, react::TurboModule &module, const jsi::Value *arguments, size_t count) {
      return static_cast<ICloudDriveTurboModule &>(module).writeBytes(runtime, arguments, count);
    }};
  }

 private:
  CloudStorageICloudDrive *storage_;

  jsi::Value readBytes(jsi::Runtime &runtime, const jsi::Value *arguments, size_t count)
  {
    if (count != 2) throw jsi::JSError(runtime, "readBytes expects a path and scope.");
    NSString *path = stringArgument(runtime, arguments[0]);
    NSString *scope = stringArgument(runtime, arguments[1]);
    CloudStorageICloudDrive *storage = storage_;
    return binaryPromise(runtime, jsInvoker_, ^(RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject) {
      [storage readBytes:path withScope:scope withResolver:resolve withRejecter:reject];
    });
  }

  jsi::Value writeBytes(jsi::Runtime &runtime, const jsi::Value *arguments, size_t count)
  {
    if (count != 6 || !arguments[2].isNumber() || !arguments[3].isNumber() || !arguments[5].isBool()) {
      throw jsi::JSError(runtime, "writeBytes expects a path, ArrayBuffer, offset, length, scope, and overwrite flag.");
    }
    NSString *path = stringArgument(runtime, arguments[0]);
    NSString *scope = stringArgument(runtime, arguments[4]);
    auto object = arguments[1].asObject(runtime);
    if (!object.isArrayBuffer(runtime)) throw jsi::JSError(runtime, "File data must be an ArrayBuffer.");
    auto buffer = object.getArrayBuffer(runtime);
    double offset = arguments[2].getNumber();
    double length = arguments[3].getNumber();
    size_t size = buffer.size(runtime);
    if (!(offset >= 0 && length >= 0 && offset <= size && length <= size - offset &&
          std::floor(offset) == offset && std::floor(length) == length)) {
      throw jsi::JSError(runtime, "File data is outside the ArrayBuffer bounds.");
    }
    // Snapshot before dispatch so JavaScript cannot change bytes during the write.
    const void *bytes = length ? buffer.data(runtime) + static_cast<size_t>(offset) : nullptr;
    NSData *data = [NSData dataWithBytes:bytes length:static_cast<NSUInteger>(length)];
    BOOL overwrite = arguments[5].getBool();
    CloudStorageICloudDrive *storage = storage_;
    return binaryPromise(runtime, jsInvoker_, ^(RCTPromiseResolveBlock resolve, RCTPromiseRejectBlock reject) {
      [storage writeBytes:path withData:data withScope:scope withOverwrite:overwrite withResolver:resolve withRejecter:reject];
    });
  }
};
}

@interface RCTCloudStorageICloudDrive : NativeCloudStorageICloudDriveIOSSpecBase <NativeCloudStorageICloudDriveIOSSpec>
@end

@implementation RCTCloudStorageICloudDrive {
  CloudStorageICloudDrive *_cloudStorageICloudDrive;
  id<NSObject> _ubiquityIdentityObserver;
}

+ (NSString *)moduleName
{
  return @"CloudStorageICloudDrive";
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

- (instancetype)init
{
  if (self = [super init]) {
    _cloudStorageICloudDrive = [CloudStorageICloudDrive new];
    // The ubiquity-identity observer is installed in -setEventEmitterCallback:
    // rather than here, so it can only fire after the codegen event emitter's
    // std::function has been bound. Otherwise a notification posted by iOS
    // between -init and -setEventEmitterCallback: would invoke an empty
    // std::function and crash the process with std::bad_function_call.
    // See: https://github.com/kuatsu/react-native-cloud-storage/issues/59
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

  if (_ubiquityIdentityObserver == nil) {
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
  [_cloudStorageICloudDrive fileExists:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)appendToFile:(NSString *)path
                data:(NSString *)data
               scope:(NSString *)scope
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageICloudDrive appendToFile:path withData:data withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)createFile:(NSString *)path
              data:(NSString *)data
             scope:(NSString *)scope
         overwrite:(BOOL)overwrite
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageICloudDrive
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
  [_cloudStorageICloudDrive createDirectory:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)listFiles:(NSString *)path
            scope:(NSString *)scope
          resolve:(RCTPromiseResolveBlock)resolve
           reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageICloudDrive listFiles:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)readFile:(NSString *)path
           scope:(NSString *)scope
         resolve:(RCTPromiseResolveBlock)resolve
          reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageICloudDrive readFile:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)triggerSync:(NSString *)path
              scope:(NSString *)scope
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageICloudDrive triggerSync:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)deleteFile:(NSString *)path
             scope:(NSString *)scope
           resolve:(RCTPromiseResolveBlock)resolve
            reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageICloudDrive deleteFile:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)deleteDirectory:(NSString *)path
              recursive:(BOOL)recursive
                  scope:(NSString *)scope
                resolve:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageICloudDrive
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
  [_cloudStorageICloudDrive statFile:path withScope:scope withResolver:resolve withRejecter:reject];
}

- (void)downloadFile:(NSString *)remotePath
           localPath:(NSString *)localPath
               scope:(NSString *)scope
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject
{
  [_cloudStorageICloudDrive
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
  [_cloudStorageICloudDrive
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
  [_cloudStorageICloudDrive isCloudAvailable:resolve withRejecter:reject];
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<ICloudDriveTurboModule>(params, _cloudStorageICloudDrive);
}

@end
