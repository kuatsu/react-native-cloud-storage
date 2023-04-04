import { GDrive, MimeTypes } from '@robinbobin/react-native-google-drive-api-wrapper';
import type NativeRNCloudStorage from '../types/native';
import type { NativeRNCloudStorageScope } from '../types/native';
import type { GoogleDriveListOperationResponse } from './types';

class GoogleDriveApiClient implements NativeRNCloudStorage {
  private static drive: GDrive = new GDrive();

  constructor() {
    return new Proxy(this, {
      // before calling any function, check if the access token is set
      get(target: GoogleDriveApiClient, prop: keyof GoogleDriveApiClient) {
        if (typeof target[prop] === 'function') {
          if (!GoogleDriveApiClient.drive.accessToken) {
            throw new Error(`Google Drive access token is not set, cannot call function ${prop.toString()}`);
          }
        }

        return target[prop];
      },
    });
  }

  // when setting accessToken, set it on the GDrive instance
  public static set accessToken(accessToken: string) {
    GoogleDriveApiClient.drive.accessToken = accessToken;
  }

  public static get accessToken(): string {
    return GoogleDriveApiClient.drive.accessToken;
  }

  private getParentFolder(scope: NativeRNCloudStorageScope): string {
    switch (scope) {
      case 'documents':
        return 'drive';
      case 'hidden':
        return 'appDataFolder';
    }
  }

  private async getFileId(path: string, scope: NativeRNCloudStorageScope): Promise<string> {
    const files: GoogleDriveListOperationResponse = await GoogleDriveApiClient.drive.files.list({
      spaces: [this.getParentFolder(scope)],
    });
    const file = files.files.find((f) => f.name === path);
    if (!file) throw new Error(`File not found`);
    return file.id;
  }

  async fileExists(path: string, scope: NativeRNCloudStorageScope): Promise<boolean> {
    try {
      await this.getFileId(path, scope);
      return true;
    } catch (e: any) {
      if (e.message === 'File not found') return false;
      else throw e;
    }
  }

  async createFile(path: string, data: string, scope: NativeRNCloudStorageScope, overwrite: boolean): Promise<void> {
    let fileId: string | undefined;
    if (overwrite) {
      try {
        fileId = await this.getFileId(path, scope);
      } catch (e: any) {
        /* do nothing, simply create the file */
      }
    }
    const uploader = GoogleDriveApiClient.drive.files.newMultipartUploader().setData(data, MimeTypes.TEXT);
    if (fileId) uploader.setIdOfFileToUpdate(fileId);
    else
      uploader.setRequestBody({
        name: path,
        parents: scope === 'hidden' ? this.getParentFolder(scope) : undefined,
      });
    await uploader.execute();
  }

  async readFile(path: string, scope: NativeRNCloudStorageScope): Promise<string> {
    const fileId = await this.getFileId(path, scope);
    const content = await GoogleDriveApiClient.drive.files.getText(fileId);
    return content;
  }

  async deleteFile(path: string, scope: NativeRNCloudStorageScope): Promise<void> {
    const fileId = await this.getFileId(path, scope);
    await GoogleDriveApiClient.drive.files.delete(fileId);
  }
}

export default GoogleDriveApiClient;
