import type NativeproviderService from '../types/native';
import {
  CloudStorageErrorCode,
  type NativeRNCloudCloudStorageFileStat,
  type NativeRNCloudCloudStorageScope,
} from '../types/native';
import CloudStorageError from '../utils/cloud-storage-error';
import { MimeTypes, type GoogleDriveFile, type GoogleDriveFileSpace } from './types';
import GoogleDriveApiClient, { GoogleDriveHttpError } from './client';
import { type CloudStorageProviderOptions, type DeepRequired } from '../types/main';

/**
 * A proxy class that wraps the Google Drive API client implementation to match the native iOS interface.
 */
export default class GoogleDrive implements NativeproviderService {
  private drive: GoogleDriveApiClient;
  private options: DeepRequired<CloudStorageProviderOptions['googledrive']>;

  constructor(options: DeepRequired<CloudStorageProviderOptions['googledrive']>) {
    this.options = options;
    this.drive = new GoogleDriveApiClient(options);

    return new Proxy(this, {
      // before calling any function, check if the access token is set
      get(target: GoogleDrive, property: keyof GoogleDrive) {
        const allowedFunctions = ['isCloudAvailable'];
        if (typeof target[property] === 'function' && !allowedFunctions.includes(property.toString())) {
          const { accessToken } = options;
          if (!accessToken?.length) {
            throw new CloudStorageError(
              `Google Drive access token is not set, cannot call function ${property.toString()}`,
              CloudStorageErrorCode.ACCESS_TOKEN_MISSING
            );
          }
        }

        return target[property];
      },
    });
  }

  public isCloudAvailable: () => Promise<boolean> = async () => {
    const { accessToken } = this.options;
    return !!accessToken?.length;
  };

  private getRootDirectory(scope: NativeRNCloudCloudStorageScope): GoogleDriveFileSpace {
    switch (scope) {
      case 'documents': {
        return 'drive';
      }
      case 'app_data': {
        return 'appDataFolder';
      }
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
        if (!files.some((f) => f.id === possibleTopDirectory!.parents![0] && f.mimeType === MimeTypes.FOLDER)) {
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
    for (let index = 1; index < directoryTree.length; index++) {
      const currentDirectory = files.find((f) => f.id === currentDirectoryId);
      if (!currentDirectory)
        throw new CloudStorageError(
          `Could not find directory with id ${currentDirectoryId}`,
          CloudStorageErrorCode.DIRECTORY_NOT_FOUND
        );
      const nextDirectory = files.find((f) => f.name === directoryTree[index] && f.parents![0] === currentDirectoryId);
      if (!nextDirectory)
        throw new CloudStorageError(
          `Could not find directory with name ${directoryTree[index]}`,
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
    const files = await this.drive.listFiles(this.getRootDirectory(scope));
    for (const file of files) {
      if (!files.some((f) => f.id === file.parents![0])) return file.parents![0] ?? null;
    }

    return null;
  }

  private checkIfMultipleFilesWithSameName(
    path: string,
    files: GoogleDriveFile[],
    filename: string,
    parentDirectoryId: string | null
  ) {
    const { strictFilenames } = this.options;

    const possibleFiles: GoogleDriveFile[] = parentDirectoryId
      ? files.filter((f) => f.name === filename && f.parents![0] === parentDirectoryId)
      : files.filter((f) => f.name === filename && !files.some((f2) => f2.id === f.parents![0]));

    if (possibleFiles.length <= 1) return;

    if (strictFilenames) {
      throw new CloudStorageError(
        `Multiple files with the same name found at path ${path}: ${possibleFiles.map((f) => f.id).join(', ')}`,
        CloudStorageErrorCode.MULTIPLE_FILES_SAME_NAME
      );
    }
  }

  private async getFileId(
    path: string,
    scope: NativeRNCloudCloudStorageScope,
    throwIf: 'directory' | 'file' | false = false
  ): Promise<string> {
    try {
      const files = await this.drive.listFiles(this.getRootDirectory(scope));

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
        file = files.find((f) => f.name === filename && !files.some((f2) => f2.id === f.parents![0]));
      } else {
        this.checkIfMultipleFilesWithSameName(path, files, filename, parentDirectoryId);
        file = files.find((f) => f.name === filename && f.parents![0] === parentDirectoryId);
      }
      if (!file) throw new CloudStorageError(`File not found`, CloudStorageErrorCode.FILE_NOT_FOUND);
      if (file.mimeType === MimeTypes.FOLDER && throwIf === 'directory') {
        throw new CloudStorageError(`Path ${path} is a directory`, CloudStorageErrorCode.PATH_IS_DIRECTORY);
      } else if (file.mimeType !== MimeTypes.FOLDER && throwIf === 'file') {
        throw new CloudStorageError(`Path ${path} is a file`, CloudStorageErrorCode.FILE_NOT_FOUND);
      }
      return file.id;
    } catch (error: unknown) {
      if (error instanceof GoogleDriveHttpError && error.json?.error?.status === 'UNAUTHENTICATED') {
        throw new CloudStorageError(
          `Could not authenticate with Google Drive`,
          CloudStorageErrorCode.AUTHENTICATION_FAILED,
          error.json
        );
      } else {
        if (error instanceof CloudStorageError) throw error;
        throw new CloudStorageError(`Could not get file id for path ${path}`, CloudStorageErrorCode.UNKNOWN, error);
      }
    }
  }

  async fileExists(path: string, scope: NativeRNCloudCloudStorageScope): Promise<boolean> {
    try {
      await this.getFileId(path, scope);
      return true;
    } catch (error: unknown) {
      if (error instanceof CloudStorageError && error.code === CloudStorageErrorCode.FILE_NOT_FOUND) return false;
      else throw error;
    }
  }

  async appendToFile(path: string, data: string, scope: NativeRNCloudCloudStorageScope): Promise<void> {
    let fileId: string | undefined;
    let previousContent = '';
    try {
      fileId = await this.getFileId(path, scope);
      previousContent = await this.drive.getFileText(fileId);
    } catch (error: unknown) {
      if (error instanceof CloudStorageError && error.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
        /* do nothing, simply create the file */
      } else {
        throw error;
      }
    }

    if (fileId) {
      await this.drive.updateFile(fileId, {
        body: previousContent + data,
        mimeType: MimeTypes.TEXT,
      });
    } else {
      const files = await this.drive.listFiles(this.getRootDirectory(scope));
      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = this.findParentDirectoryId(files, directories);
      await this.drive.createFile(
        {
          name: filename,
          parents: parentDirectoryId
            ? [parentDirectoryId]
            : scope === 'app_data'
            ? [this.getRootDirectory(scope)]
            : undefined,
        },
        {
          body: data,
          mimeType: MimeTypes.TEXT,
        }
      );
    }
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
      } catch (error: unknown) {
        if (error instanceof CloudStorageError && error.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
          /* do nothing, simply create the file */
        } else {
          throw error;
        }
      }
    } else {
      try {
        await this.getFileId(path, scope);
        throw new CloudStorageError(`File ${path} already exists`, CloudStorageErrorCode.FILE_ALREADY_EXISTS);
      } catch (error: unknown) {
        if (error instanceof CloudStorageError && error.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
          /* do nothing, simply create the file */
        } else {
          throw error;
        }
      }
    }

    if (fileId) {
      await this.drive.updateFile(fileId, {
        body: data,
        mimeType: MimeTypes.TEXT,
      });
    } else {
      const files = await this.drive.listFiles(this.getRootDirectory(scope));
      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = this.findParentDirectoryId(files, directories);
      await this.drive.createFile(
        {
          name: filename,
          parents: parentDirectoryId
            ? [parentDirectoryId]
            : scope === 'app_data'
            ? [this.getRootDirectory(scope)]
            : undefined,
        },
        {
          body: data,
          mimeType: MimeTypes.TEXT,
        }
      );
    }
  }

  async listFiles(path: string, scope: NativeRNCloudCloudStorageScope): Promise<string[]> {
    const allFiles = await this.drive.listFiles(this.getRootDirectory(scope));
    if (path === '') {
      const rootDirectoryId = await this.getRootDirectoryId(scope);
      return [...new Set(allFiles.filter((f) => (f.parents ?? [])[0] === rootDirectoryId).map((f) => f.name))];
    } else {
      const fileId = await this.getFileId(path, scope);
      const files = allFiles.filter((f) => (f.parents ?? [])[0] === fileId);

      return [...new Set(files.map((f) => f.name))];
    }
  }

  async createDirectory(path: string, scope: NativeRNCloudCloudStorageScope): Promise<void> {
    try {
      await this.getFileId(path, scope);
      throw new CloudStorageError(`File ${path} already exists`, CloudStorageErrorCode.FILE_ALREADY_EXISTS);
    } catch (error: unknown) {
      if (error instanceof CloudStorageError && error.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
        /* do nothing, simply create the file */
      } else if (error instanceof CloudStorageError && error.code === CloudStorageErrorCode.PATH_IS_DIRECTORY) {
        throw new CloudStorageError(`Directory ${path} already exists`, CloudStorageErrorCode.FILE_ALREADY_EXISTS);
      } else {
        throw error;
      }
    }

    const files = await this.drive.listFiles(this.getRootDirectory(scope));
    const { directories, filename } = this.resolvePathToDirectories(path);
    const parentDirectoryId = this.findParentDirectoryId(files, directories);

    await this.drive.createDirectory({
      name: filename,
      parents: parentDirectoryId
        ? [parentDirectoryId]
        : scope === 'app_data'
        ? [this.getRootDirectory(scope)]
        : undefined,
    });
  }

  async readFile(path: string, scope: NativeRNCloudCloudStorageScope): Promise<string> {
    const fileId = await this.getFileId(path, scope);
    const content = await this.drive.getFileText(fileId);
    return content;
  }

  async downloadFile(_path: string, _scope: NativeRNCloudCloudStorageScope): Promise<void> {
    // Downloading files from Google Drive is not necessary / possible, as they need to be downloaded on every read operation via the API anyway
    return;
  }

  async deleteFile(path: string, scope: NativeRNCloudCloudStorageScope): Promise<void> {
    // if trying to pass a directory, throw an error
    const fileId = await this.getFileId(path, scope, 'directory');
    await this.drive.deleteFile(fileId);
  }

  async deleteDirectory(path: string, recursive: boolean, scope: NativeRNCloudCloudStorageScope): Promise<void> {
    // if trying to pass a file, throw an error
    const fileId = await this.getFileId(path, scope, 'file');

    if (!recursive) {
      // check if the directory is empty
      const files = await this.drive.listFiles(this.getRootDirectory(scope));
      const filesInDirectory = files.filter((f) => (f.parents ?? [])[0] === fileId);
      if (filesInDirectory.length > 0) {
        throw new CloudStorageError(
          `Directory ${path} is not empty`,
          CloudStorageErrorCode.DELETE_ERROR,
          filesInDirectory
        );
      }
    }

    await this.drive.deleteFile(fileId);
  }

  async statFile(path: string, scope: NativeRNCloudCloudStorageScope): Promise<NativeRNCloudCloudStorageFileStat> {
    const fileId = await this.getFileId(path, scope, false);
    const file = await this.drive.getFile(fileId!);

    return {
      size: file.size ?? 0,
      birthtimeMs: new Date(file.createdTime!).getTime(),
      mtimeMs: new Date(file.modifiedTime!).getTime(),
      isDirectory: file.mimeType === MimeTypes.FOLDER,
      isFile: file.mimeType !== MimeTypes.FOLDER,
    };
  }
}
