import { GDrive, HttpError, MimeTypes } from 'react-native-google-drive-api-wrapper-js';
import type NativeRNCloudStorage from '../types/native';
import {
  CloudStorageErrorCode,
  type NativeRNCloudCloudStorageFileStat,
  type NativeRNCloudCloudStorageScope,
} from '../types/native';
import CloudStorageError from '../utils/CloudStorageError';
import type { GoogleDriveFile, GoogleDriveFileSpace } from './types';
import { DeviceEventEmitter } from 'react-native';
import GoogleDriveApiClient from './client';

// TODO: replace legacyDrive fully with new drive implementation
/**
 * A proxy class that wraps the Google Drive API client implementation to match the native iOS interface.
 */
export default class GoogleDrive implements NativeRNCloudStorage {
  private static drive: GoogleDriveApiClient = new GoogleDriveApiClient();
  private static legacyDrive: GDrive = new GDrive();
  public static throwOnFilesWithSameName = false;
  public filesWithSameNameSubscribers: (({ path, fileIds }: { path: string; fileIds: string[] }) => void)[];

  constructor() {
    this.filesWithSameNameSubscribers = [];
    GoogleDrive.legacyDrive.fetchTimeout = 3000;
    return new Proxy(this, {
      // before calling any function, check if the access token is set
      get(target: GoogleDrive, prop: keyof GoogleDrive) {
        const allowedFunctions = ['isCloudAvailable', 'subscribeToFilesWithSameName'];
        if (typeof target[prop] === 'function' && !allowedFunctions.includes(prop.toString())) {
          if (!GoogleDrive.drive.accessToken.length) {
            throw new CloudStorageError(
              `Google Drive access token is not set, cannot call function ${prop.toString()}`,
              CloudStorageErrorCode.GOOGLE_DRIVE_ACCESS_TOKEN_MISSING
            );
          }
        }

        return target[prop];
      },
    });
  }

  // when setting accessToken, set it on the GDrive instance
  public static set accessToken(accessToken: string | undefined) {
    GoogleDrive.legacyDrive.accessToken = accessToken;
    GoogleDrive.drive.accessToken = accessToken ?? '';

    // emit an event for the useIsCloudAvailable hook
    DeviceEventEmitter.emit('RNCloudStorage.cloud.availability-changed', {
      available: !!accessToken?.length,
    });
  }

  public static get accessToken(): string | null {
    return GoogleDrive.drive.accessToken.length ? GoogleDrive.drive.accessToken : null;
  }

  public subscribeToFilesWithSameName(subscriber: ({ path, fileIds }: { path: string; fileIds: string[] }) => void): {
    remove: () => void;
  } {
    this.filesWithSameNameSubscribers.push(subscriber);

    return {
      remove: () => {
        this.filesWithSameNameSubscribers = this.filesWithSameNameSubscribers.filter((s) => s !== subscriber);
      },
    };
  }

  public isCloudAvailable: () => Promise<boolean> = async () => !!GoogleDrive.drive.accessToken.length;

  private getRootDirectory(scope: NativeRNCloudCloudStorageScope): GoogleDriveFileSpace {
    switch (scope) {
      case 'documents':
        return 'drive';
      case 'app_data':
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
      throw new CloudStorageError(
        `Could not find top directory with name ${directoryTree[0]}`,
        CloudStorageErrorCode.DIRECTORY_NOT_FOUND
      );
    }

    // now, we traverse the directories array and get the id of the last directory from the files array
    let currentDirectoryId = topDirectoryId;
    for (let i = 1; i < directoryTree.length; i++) {
      const currentDirectory = files.find((f) => f.id === currentDirectoryId);
      if (!currentDirectory)
        throw new CloudStorageError(
          `Could not find directory with id ${currentDirectoryId}`,
          CloudStorageErrorCode.DIRECTORY_NOT_FOUND
        );
      const nextDirectory = files.find((f) => f.name === directoryTree[i] && f.parents![0] === currentDirectoryId);
      if (!nextDirectory)
        throw new CloudStorageError(
          `Could not find directory with name ${directoryTree[i]}`,
          CloudStorageErrorCode.DIRECTORY_NOT_FOUND
        );
      currentDirectoryId = nextDirectory.id;
    }

    return currentDirectoryId;
  }

  /**
   * Gets the Google Drive ID of the root directory for the given scope.
   * @param scope The scope to get the root directory for.
   * @returns A promise that resolves to the ID of the root directory or null if it could not be found.
   */
  private async getRootDirectoryId(scope: NativeRNCloudCloudStorageScope): Promise<string | null> {
    const files = await GoogleDrive.drive.listFiles(this.getRootDirectory(scope));
    for (const file of files) {
      if (!files.find((f) => f.id === file.parents![0])) return file.parents![0] ?? null;
    }

    return null;
  }

  private checkIfMultipleFilesWithSameName(
    path: string,
    files: GoogleDriveFile[],
    filename: string,
    parentDirectoryId: string | null
  ) {
    let possibleFiles: GoogleDriveFile[];
    if (parentDirectoryId) {
      possibleFiles = files.filter((f) => f.name === filename && f.parents![0] === parentDirectoryId);
    } else {
      possibleFiles = files.filter((f) => f.name === filename && !files.find((f2) => f2.id === f.parents![0]));
    }

    if (possibleFiles.length <= 1) return;

    if (GoogleDrive.throwOnFilesWithSameName) {
      throw new CloudStorageError(
        `Multiple files with the same name found at path ${path}: ${possibleFiles.map((f) => f.id).join(', ')}`,
        CloudStorageErrorCode.MULTIPLE_FILES_SAME_NAME
      );
    } else {
      this.filesWithSameNameSubscribers.forEach((s) => s({ path, fileIds: possibleFiles.map((f) => f.id) }));
    }
  }

  private async getFileId(
    path: string,
    scope: NativeRNCloudCloudStorageScope,
    throwIfDirectory = true
  ): Promise<string> {
    try {
      const files = await GoogleDrive.drive.listFiles(this.getRootDirectory(scope));

      if (path === '' || path === '/') {
        const rootDirectoryId = await this.getRootDirectoryId(scope);
        if (!rootDirectoryId)
          throw new CloudStorageError(
            `Root directory in scope ${scope} not found`,
            CloudStorageErrorCode.DIRECTORY_NOT_FOUND
          );
        return rootDirectoryId;
      }

      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = this.findParentDirectoryId(files, directories);
      let file: GoogleDriveFile | undefined;
      if (parentDirectoryId === null) {
        this.checkIfMultipleFilesWithSameName(path, files, filename, null);
        /* when the file is supposed to be in the root directory, we need to get the file where the name is the filename
        and the first parent has an id which does not exist in the files array */
        file = files.find((f) => f.name === filename && !files.find((f2) => f2.id === f.parents![0]));
      } else {
        this.checkIfMultipleFilesWithSameName(path, files, filename, parentDirectoryId);
        file = files.find((f) => f.name === filename && f.parents![0] === parentDirectoryId);
      }
      if (!file) throw new CloudStorageError(`File not found`, CloudStorageErrorCode.FILE_NOT_FOUND);
      if (file.mimeType === MimeTypes.FOLDER && throwIfDirectory) {
        throw new CloudStorageError(`Path ${path} is a directory`, CloudStorageErrorCode.PATH_IS_DIRECTORY);
      }
      return file.id;
    } catch (e: unknown) {
      if (e instanceof HttpError && e.json?.error?.status === 'UNAUTHENTICATED') {
        throw new CloudStorageError(
          `Could not authenticate with Google Drive`,
          CloudStorageErrorCode.AUTHENTICATION_FAILED,
          e.json
        );
      } else {
        if (e instanceof CloudStorageError) throw e;
        throw new CloudStorageError(`Could not get file id for path ${path}`, CloudStorageErrorCode.UNKNOWN, e);
      }
    }
  }

  async fileExists(path: string, scope: NativeRNCloudCloudStorageScope): Promise<boolean> {
    try {
      await this.getFileId(path, scope, false);
      return true;
    } catch (e: any) {
      if (e instanceof CloudStorageError && e.code === CloudStorageErrorCode.FILE_NOT_FOUND) return false;
      else throw e;
    }
  }

  async appendToFile(path: string, data: string, scope: NativeRNCloudCloudStorageScope): Promise<void> {
    let fileId: string | undefined;
    let prevContent = '';
    try {
      fileId = await this.getFileId(path, scope);
      prevContent = await GoogleDrive.drive.getFileText(fileId);
    } catch (e: any) {
      if (e instanceof CloudStorageError && e.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
        /* do nothing, simply create the file */
      } else {
        throw e;
      }
    }

    const uploader = GoogleDrive.legacyDrive.files.newMultipartUploader().setData(prevContent + data, MimeTypes.TEXT);
    if (fileId) uploader.setIdOfFileToUpdate(fileId);
    else {
      const files = await GoogleDrive.drive.listFiles(this.getRootDirectory(scope));
      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = this.findParentDirectoryId(files, directories);
      uploader.setRequestBody({
        name: filename,
        parents: parentDirectoryId
          ? [parentDirectoryId]
          : scope === 'app_data'
          ? [this.getRootDirectory(scope)]
          : undefined,
      });
    }
    await uploader.execute();
  }

  async createFile(
    path: string,
    data: string,
    scope: NativeRNCloudCloudStorageScope,
    overwrite: boolean
  ): Promise<void> {
    let fileId: string | undefined;
    if (overwrite) {
      try {
        fileId = await this.getFileId(path, scope);
      } catch (e: any) {
        if (e instanceof CloudStorageError && e.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
          /* do nothing, simply create the file */
        } else {
          throw e;
        }
      }
    } else {
      try {
        await this.getFileId(path, scope);
        throw new CloudStorageError(`File ${path} already exists`, CloudStorageErrorCode.FILE_ALREADY_EXISTS);
      } catch (e: any) {
        if (e instanceof CloudStorageError && e.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
          /* do nothing, simply create the file */
        } else {
          throw e;
        }
      }
    }

    const uploader = GoogleDrive.legacyDrive.files.newMultipartUploader().setData(data, MimeTypes.TEXT);
    if (fileId) uploader.setIdOfFileToUpdate(fileId);
    else {
      const files = await GoogleDrive.drive.listFiles(this.getRootDirectory(scope));
      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = this.findParentDirectoryId(files, directories);
      uploader.setRequestBody({
        name: filename,
        parents: parentDirectoryId
          ? [parentDirectoryId]
          : scope === 'app_data'
          ? [this.getRootDirectory(scope)]
          : undefined,
      });
    }
    await uploader.execute();
  }

  async listFiles(path: string, scope: NativeRNCloudCloudStorageScope): Promise<string[]> {
    const allFiles = await GoogleDrive.drive.listFiles(this.getRootDirectory(scope));
    if (path !== '') {
      const fileId = await this.getFileId(path, scope, false);
      const files = allFiles.filter((f) => (f.parents ?? [])[0] === fileId);

      return Array.from(new Set(files.map((f) => f.name)));
    } else {
      const rootDirectoryId = await this.getRootDirectoryId(scope);
      return Array.from(new Set(allFiles.filter((f) => (f.parents ?? [])[0] === rootDirectoryId).map((f) => f.name)));
    }
  }

  async createDirectory(path: string, scope: NativeRNCloudCloudStorageScope): Promise<void> {
    try {
      await this.getFileId(path, scope);
      throw new CloudStorageError(`File ${path} already exists`, CloudStorageErrorCode.FILE_ALREADY_EXISTS);
    } catch (e: any) {
      if (e instanceof CloudStorageError && e.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
        /* do nothing, simply create the file */
      } else if (e instanceof CloudStorageError && e.code === CloudStorageErrorCode.PATH_IS_DIRECTORY) {
        throw new CloudStorageError(`Directory ${path} already exists`, CloudStorageErrorCode.FILE_ALREADY_EXISTS);
      } else {
        throw e;
      }
    }

    const uploader = GoogleDrive.legacyDrive.files.newMetadataOnlyUploader();
    const files = await GoogleDrive.drive.listFiles(this.getRootDirectory(scope));
    const { directories, filename } = this.resolvePathToDirectories(path);
    const parentDirectoryId = this.findParentDirectoryId(files, directories);
    uploader.setRequestBody({
      name: filename,
      mimeType: MimeTypes.FOLDER,
      parents: parentDirectoryId
        ? [parentDirectoryId]
        : scope === 'app_data'
        ? [this.getRootDirectory(scope)]
        : undefined,
    });
    await uploader.execute();
  }

  async readFile(path: string, scope: NativeRNCloudCloudStorageScope): Promise<string> {
    const fileId = await this.getFileId(path, scope);
    const content = await GoogleDrive.drive.getFileText(fileId);
    return content;
  }

  async downloadFile(_path: string, _scope: NativeRNCloudCloudStorageScope): Promise<void> {
    // Not doing anything here, just a placeholder to conform to the interface so it doesn't fail on Android
    return;
  }

  async deleteFile(path: string, scope: NativeRNCloudCloudStorageScope): Promise<void> {
    const fileId = await this.getFileId(path, scope);
    await GoogleDrive.drive.deleteFile(fileId);
  }

  async statFile(path: string, scope: NativeRNCloudCloudStorageScope): Promise<NativeRNCloudCloudStorageFileStat> {
    const fileId = await this.getFileId(path, scope, false);
    const file = await GoogleDrive.drive.getFile(fileId!);

    return {
      size: file.size ?? 0,
      birthtimeMs: new Date(file.createdTime!).getTime(),
      mtimeMs: new Date(file.modifiedTime!).getTime(),
      isDirectory: file.mimeType === MimeTypes.FOLDER,
      isFile: file.mimeType !== MimeTypes.FOLDER,
    };
  }
}
