import { NativeModules } from 'react-native';
import { NativeStorage } from '../types/native';
import { createProxiedNativeModule } from '../utils/native';

export const NativeCloudKit = createProxiedNativeModule<NativeStorage>(NativeModules.CloudStorageCloudKit);
