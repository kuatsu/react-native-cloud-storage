import { GDrive, MimeTypes } from '@robinbobin/react-native-google-drive-api-wrapper';
import type NativeRNCloudStorage from '../types/native';
import type { NativeRNCloudStorageScope } from '../types/native';
import type { GoogleDriveFile, GoogleDriveListOperationResponse } from './types';

class GoogleDriveApiClient implements NativeRNCloudStorage {
  private static drive: GDrive = new GDrive();

  constructor() {
    GoogleDriveApiClient.drive.fetchTimeout = 3000;
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

  private getRootDirectory(scope: NativeRNCloudStorageScope): 'drive' | 'appDataFolder' {
    switch (scope) {
      case 'documents':
        return 'drive';
      case 'hidden':
        return 'appDataFolder';
    }
  }

  private resolvePathToDirectories(path: string): { directories: string[]; filename: string } {
    if (path.startsWith('/')) path = path.slice(1);
    if (path.endsWith('/')) path = path.slice(0, -1);
    const directories = path.split('/');
    const actualFilename = directories.pop() ?? '';
    return { directories, filename: actualFilename };
  }

  private findParentDirectoryId(files: GoogleDriveFile[], directoryTree: string[]): string | null {
    const possibleTopDirectories = files
      .filter((f) => f.mimeType === MimeTypes.FOLDER)
      .filter((f) => f.name === directoryTree[0]);

    let topDirectoryId: string | undefined;
    if (possibleTopDirectories.length === 0) return null;
    else if (possibleTopDirectories.length === 1) {
      topDirectoryId = possibleTopDirectories[0]!.id;
    } else {
      /* when multiple directories carry the same name, we need to check every one of them if their parent id exists in
      the files array - if it does not, it means that the directory is a child of the root directory and the one we're
      looking for */
      for (const possibleTopDirectory of possibleTopDirectories) {
        if (!files.find((f) => f.id === possibleTopDirectory!.parents![0] && f.mimeType === MimeTypes.FOLDER)) {
          topDirectoryId = possibleTopDirectory!.id;
          break;
        }
      }
    }

    if (!topDirectoryId) {
      throw new Error(`Could not find top directory with name ${directoryTree[0]}`);
    }

    // now, we traverse the directories array and get the id of the last directory from the files array
    let currentDirectoryId = topDirectoryId;
    for (let i = 1; i < directoryTree.length; i++) {
      const currentDirectory = files.find((f) => f.id === currentDirectoryId);
      if (!currentDirectory) throw new Error(`Could not find directory with id ${currentDirectoryId}`);
      const nextDirectory = files.find((f) => f.name === directoryTree[i] && f.parents![0] === currentDirectoryId);
      if (!nextDirectory) throw new Error(`Could not find directory with name ${directoryTree[i]}`);
      currentDirectoryId = nextDirectory.id;
    }

    return currentDirectoryId;
  }

  private async listFiles(scope: NativeRNCloudStorageScope): Promise<GoogleDriveFile[]> {
    const files: GoogleDriveListOperationResponse = await GoogleDriveApiClient.drive.files.list({
      spaces: [this.getRootDirectory(scope)],
      fields: 'files(id,kind,mimeType,name,parents,spaces)',
    });

    return files.files;
  }

  private async getFileId(path: string, scope: NativeRNCloudStorageScope): Promise<string> {
    const files = await this.listFiles(scope);
    const { directories, filename } = this.resolvePathToDirectories(path);
    const parentDirectoryId = this.findParentDirectoryId(files, directories);
    let file: GoogleDriveFile | undefined;
    if (parentDirectoryId === null) {
      /* when the file is supposes to be in the root directory, we need to get the file where the name is the filename
      and the first parent has an id which does not exist in the files array */
      file = files.find((f) => f.name === filename && !files.find((f2) => f2.id === f.parents![0]));
    } else {
      file = files.find((f) => f.name === filename && f.parents![0] === parentDirectoryId);
    }
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
    else {
      const files = await this.listFiles(scope);
      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = this.findParentDirectoryId(files, directories);
      uploader.setRequestBody({
        name: filename,
        parents: parentDirectoryId
          ? [parentDirectoryId]
          : scope === 'hidden'
          ? [this.getRootDirectory(scope)]
          : undefined,
      });
    }
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
