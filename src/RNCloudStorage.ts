import createRNCloudStorage from './createRNCloudStorage';
import type { StorageScope } from './types/main';
import type NativeRNCloudStorage from './types/native';

export default class RNCloudStorage {
  private nativeInstance: NativeRNCloudStorage;

  constructor() {
    this.nativeInstance = createRNCloudStorage();
  }

  fileExists(path: string, scope: StorageScope): Promise<boolean> {
    return this.nativeInstance.fileExists(path, scope);
  }

  createFile(path: string, data: string, scope: StorageScope, overwrite?: boolean): Promise<void> {
    return this.nativeInstance.createFile(path, data, scope, overwrite || false);
  }

  readFile(path: string, scope: StorageScope): Promise<string> {
    return this.nativeInstance.readFile(path, scope);
  }
}
