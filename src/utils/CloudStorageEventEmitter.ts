import { DeviceEventEmitter, NativeModules, NativeEventEmitter, Platform } from 'react-native';

export const cloudStorageEventEmitter: NativeEventEmitter | typeof DeviceEventEmitter =
  Platform.OS === 'ios' ? new NativeEventEmitter(NativeModules.CloudStorageEventEmitter) : DeviceEventEmitter;
