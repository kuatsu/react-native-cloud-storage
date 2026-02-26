import type { CodegenTypes, TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export type CloudStorageFileStat = {
  size: number;
  birthtimeMs: number;
  mtimeMs: number;
  isDirectory: boolean;
  isFile: boolean;
};

export type CloudAvailabilityChangedEvent = {
  available: boolean;
};

export interface Spec extends TurboModule {
  fileExists(path: string, scope: string): Promise<boolean>;
  appendToFile(path: string, data: string, scope: string): Promise<void>;
  createFile(path: string, data: string, scope: string, overwrite: boolean): Promise<void>;
  createDirectory(path: string, scope: string): Promise<void>;
  listFiles(path: string, scope: string): Promise<Array<string>>;
  readFile(path: string, scope: string): Promise<string>;
  triggerSync(path: string, scope: string): Promise<void>;
  deleteFile(path: string, scope: string): Promise<void>;
  deleteDirectory(path: string, recursive: boolean, scope: string): Promise<void>;
  statFile(path: string, scope: string): Promise<CloudStorageFileStat>;
  downloadFile(remotePath: string, localPath: string, scope: string): Promise<void>;
  uploadFile(remotePath: string, localPath: string, mimeType: string, scope: string, overwrite: boolean): Promise<void>;
  isCloudAvailable(): Promise<boolean>;
  readonly onCloudAvailabilityChanged: CodegenTypes.EventEmitter<CloudAvailabilityChangedEvent>;
}

export default TurboModuleRegistry.get<Spec>('CloudStorageCloudKit');
