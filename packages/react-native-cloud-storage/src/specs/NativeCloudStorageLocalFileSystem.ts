import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type LocalFileSystemConstants = {
  temporaryDirectory: string;
};

export type LocalFileSystemDownloadOptions = {
  headers?: CodegenTypes.UnsafeObject;
};

export type LocalFileSystemUploadOptions = {
  headers?: CodegenTypes.UnsafeObject;
  method?: string;
  uploadType?: string;
  fieldName?: string;
  parameters?: CodegenTypes.UnsafeObject;
};

export interface Spec extends TurboModule {
  getConstants(): LocalFileSystemConstants;
  createFile(path: string, data: string): Promise<string>;
  readFile(path: string): Promise<string>;
  downloadFile(remoteUri: string, localPath: string, options?: LocalFileSystemDownloadOptions): Promise<void>;
  uploadFile(localPath: string, remoteUri: string, options: LocalFileSystemUploadOptions): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CloudStorageLocalFileSystem');
