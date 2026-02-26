import NativeCloudStorageCloudKitIOS, {
  type Spec as NativeCloudStorageCloudKitTurboModule,
} from '../specs/NativeCloudStorageCloudKitIOS';
import { NativeStorage } from '../types/native';
import { createProxiedNativeModule } from '../utils/native';

export const NativeCloudKitModule = NativeCloudStorageCloudKitIOS;

export const NativeCloudKit = createProxiedNativeModule<NativeStorage>(
  NativeCloudStorageCloudKitIOS as unknown as NativeStorage | null
);

export type { NativeCloudStorageCloudKitTurboModule };
