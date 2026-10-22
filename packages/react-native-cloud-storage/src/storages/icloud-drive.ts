import NativeCloudStorageICloudDriveIOS, {
  type Spec as NativeCloudStorageICloudDriveTurboModule,
} from '../specs/NativeCloudStorageICloudDriveIOS';
import { NativeStorage } from '../types/native';
import { createProxiedNativeModule } from '../utils/native';

export const NativeICloudDriveModule = NativeCloudStorageICloudDriveIOS;

export const NativeICloudDrive = createProxiedNativeModule<NativeStorage>(
  NativeCloudStorageICloudDriveIOS as unknown as NativeStorage | null
);

export type { NativeCloudStorageICloudDriveTurboModule };
