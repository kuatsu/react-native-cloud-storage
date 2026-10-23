import NativeCloudStorageICloudDriveIOS, {
  type Spec as NativeCloudStorageICloudDriveTurboModule,
} from '../specs/NativeCloudStorageICloudDriveIOS';
import { NativeStorage } from '../types/native';
import { createProxiedNativeModule } from '../utils/native';

interface BinaryModule {
  readBytes(path: string, scope: string): Promise<ArrayBuffer>;
  writeBytes(
    path: string,
    buffer: ArrayBufferLike,
    offset: number,
    length: number,
    scope: string,
    overwrite: boolean
  ): Promise<void>;
}

// Objective-C Codegen cannot declare a Promise<ArrayBuffer>, so we have to use custom JSI magic to prevent having to encode binary data
export const NativeICloudDriveModule = NativeCloudStorageICloudDriveIOS as
  | (NativeCloudStorageICloudDriveTurboModule & BinaryModule)
  | null;

const storage = createProxiedNativeModule(NativeICloudDriveModule);

export const NativeICloudDrive = storage
  ? (new Proxy(storage, {
      get(target, property, receiver) {
        if (property === 'createFile') {
          return (path: string, data: string | Uint8Array, scope: string, overwrite: boolean) =>
            typeof data === 'string'
              ? target.createFile(path, data, scope, overwrite)
              : target.writeBytes(path, data.buffer, data.byteOffset, data.byteLength, scope, overwrite);
        }
        if (property === 'readFile') {
          return async (path: string, scope: string, format?: 'text' | 'bytes') => {
            return format === 'bytes'
              ? new Uint8Array(await target.readBytes(path, scope))
              : target.readFile(path, scope);
          };
        }
        return Reflect.get(target, property, receiver);
      },
    }) as unknown as NativeStorage)
  : null;

export type { NativeCloudStorageICloudDriveTurboModule };
