import {
  NativeCloudStorageErrorCode,
  NativeStorage,
  type NativeStorageFileStat,
  type NativeStorageScope,
} from '../../types/native';
import CloudStorageError from '../../utils/cloud-storage-error';
import { MimeTypes, type GoogleDriveFile, type GoogleDriveFileSpace } from './types';
import GoogleDriveApiClient, { GoogleDriveHttpError } from './client';
import { type CloudStorageProviderOptions, type DeepRequired } from '../../types/main';

/**
 * A JavaScript-based implementation of the Google Drive API that implements the cloud storage interface.
 */
export default class GoogleDrive implements NativeStorage {
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
              NativeCloudStorageErrorCode.ACCESS_TOKEN_MISSING
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

  private getRootDirectory(scope: NativeStorageScope): GoogleDriveFileSpace {
    switch (scope) {
      case 'documents': {
        return 'drive';
      }
      case 'documents_legacy': {
        return 'drive';
      }
      case 'app_data': {
        return 'appDataFolder';
      }
    }
  }

  private isRootPath(path: string): boolean {
    return path === '' || path === '/';
  }

  private resolvePathToDirectories(path: string): {
    directories: string[];
    filename: string;
  } {
    if (path.startsWith('/')) path = path.slice(1);
    if (path.endsWith('/')) path = path.slice(0, -1);
    const directories = path.split('/');
    const actualFilename = directories.pop() ?? '';
    return { directories, filename: actualFilename };
  }

  private escapeDriveQueryValue(value: string): string {
    return value.replaceAll('\\', String.raw`\\`).replaceAll("'", String.raw`\'`);
  }

  private async getQueryRootParentId(scope: NativeStorageScope): Promise<string> {
    if (scope === 'app_data') {
      return this.getRootDirectory(scope);
    }

    return this.getRootDirectoryId(scope);
  }

  private async findDirectoryByNameAndParent(
    name: string,
    parentId: string,
    scope: NativeStorageScope
  ): Promise<GoogleDriveFile[]> {
    const escapedName = this.escapeDriveQueryValue(name);
    const escapedParentId = this.escapeDriveQueryValue(parentId);
    const query = `name = '${escapedName}' and '${escapedParentId}' in parents and mimeType = '${MimeTypes.FOLDER}' and trashed = false`;
    return this.drive.listFiles(this.getRootDirectory(scope), query);
  }

  private async findFilesByNameAndParent(
    name: string,
    parentId: string,
    scope: NativeStorageScope
  ): Promise<GoogleDriveFile[]> {
    const escapedName = this.escapeDriveQueryValue(name);
    const escapedParentId = this.escapeDriveQueryValue(parentId);
    const query = `name = '${escapedName}' and '${escapedParentId}' in parents and trashed = false`;
    return this.drive.listFiles(this.getRootDirectory(scope), query);
  }

  private async findFilesByParent(parentId: string, scope: NativeStorageScope): Promise<GoogleDriveFile[]> {
    const escapedParentId = this.escapeDriveQueryValue(parentId);
    const query = `'${escapedParentId}' in parents and trashed = false`;
    return this.drive.listFiles(this.getRootDirectory(scope), query);
  }

  private async findParentDirectoryId(directoryTree: string[], scope: NativeStorageScope): Promise<string | null> {
    let parentDirectoryId = await this.getQueryRootParentId(scope);

    for (const directoryName of directoryTree) {
      const directories = await this.findDirectoryByNameAndParent(directoryName, parentDirectoryId, scope);
      if (directories.length === 0) {
        return null;
      }

      parentDirectoryId = directories[0]!.id;
    }

    return parentDirectoryId;
  }

  /**
   * Gets the Google Drive ID of the root directory for the given scope.
   * @param scope The scope to get the root directory for.
   * @returns A promise that resolves to the ID of the root directory.
   */
  private async getRootDirectoryId(scope: NativeStorageScope): Promise<string> {
    if (scope !== 'app_data') {
      return 'root';
    }

    const files = await this.drive.listFiles(this.getRootDirectory(scope));
    for (const file of files) {
      const parentId = file.parents?.[0];
      if (parentId && !files.some((candidate) => candidate.id === parentId)) {
        return parentId;
      }
    }

    return this.getRootDirectory(scope);
  }

  private checkIfMultipleFilesWithSameName(path: string, files: GoogleDriveFile[]) {
    const { strictFilenames } = this.options;

    if (files.length <= 1) return;

    if (strictFilenames) {
      throw new CloudStorageError(
        `Multiple files with the same name found at path ${path}: ${files.map((f) => f.id).join(', ')}`,
        NativeCloudStorageErrorCode.MULTIPLE_FILES_SAME_NAME
      );
    }
  }

  private async getFileId(
    path: string,
    scope: NativeStorageScope,
    throwIf: 'directory' | 'file' | false = false
  ): Promise<string> {
    try {
      if (this.isRootPath(path)) {
        if (throwIf === 'directory') {
          throw new CloudStorageError(`Path ${path} is a directory`, NativeCloudStorageErrorCode.PATH_IS_DIRECTORY);
        }

        const rootDirectoryId = await this.getRootDirectoryId(scope);
        if (scope !== 'app_data') {
          await this.drive.getFile(rootDirectoryId);
        }

        return rootDirectoryId;
      }

      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = await this.findParentDirectoryId(directories, scope);
      if (parentDirectoryId === null) {
        throw new CloudStorageError(`File not found`, NativeCloudStorageErrorCode.FILE_NOT_FOUND);
      }

      const files = await this.findFilesByNameAndParent(filename, parentDirectoryId, scope);
      this.checkIfMultipleFilesWithSameName(path, files);

      const file = files[0];
      if (!file) throw new CloudStorageError(`File not found`, NativeCloudStorageErrorCode.FILE_NOT_FOUND);
      if (file.mimeType === MimeTypes.FOLDER && throwIf === 'directory') {
        throw new CloudStorageError(`Path ${path} is a directory`, NativeCloudStorageErrorCode.PATH_IS_DIRECTORY);
      } else if (file.mimeType !== MimeTypes.FOLDER && throwIf === 'file') {
        throw new CloudStorageError(`Path ${path} is a file`, NativeCloudStorageErrorCode.FILE_NOT_FOUND);
      }
      return file.id;
    } catch (error: unknown) {
      if (error instanceof GoogleDriveHttpError && error.json?.error?.status === 'UNAUTHENTICATED') {
        throw new CloudStorageError(
          `Could not authenticate with Google Drive`,
          NativeCloudStorageErrorCode.AUTHENTICATION_FAILED,
          error.json
        );
      } else {
        if (error instanceof CloudStorageError) throw error;
        throw new CloudStorageError(
          `Could not get file id for path ${path}`,
          NativeCloudStorageErrorCode.UNKNOWN,
          error
        );
      }
    }
  }

  async fileExists(path: string, scope: NativeStorageScope): Promise<boolean> {
    try {
      await this.getFileId(path, scope);
      return true;
    } catch (error: unknown) {
      if (error instanceof CloudStorageError && error.code === NativeCloudStorageErrorCode.FILE_NOT_FOUND) return false;
      else throw error;
    }
  }

  async appendToFile(path: string, data: string, scope: NativeStorageScope): Promise<void> {
    let fileId: string | undefined;
    let previousContent = '';
    try {
      fileId = await this.getFileId(path, scope, 'directory');
      previousContent = await this.drive.getFileText(fileId);
    } catch (error: unknown) {
      if (error instanceof CloudStorageError && error.code === NativeCloudStorageErrorCode.FILE_NOT_FOUND) {
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
      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = await this.findParentDirectoryId(directories, scope);
      if (parentDirectoryId === null) {
        throw new CloudStorageError(`Directory not found`, NativeCloudStorageErrorCode.DIRECTORY_NOT_FOUND);
      }

      await this.drive.createFile(
        {
          name: filename,
          parents: [parentDirectoryId],
        },
        {
          body: data,
          mimeType: MimeTypes.TEXT,
        }
      );
    }
  }

  async createFile(path: string, data: string, scope: NativeStorageScope, overwrite: boolean): Promise<void> {
    let fileId: string | undefined;
    if (overwrite) {
      try {
        fileId = await this.getFileId(path, scope, 'directory');
      } catch (error: unknown) {
        if (error instanceof CloudStorageError && error.code === NativeCloudStorageErrorCode.FILE_NOT_FOUND) {
          /* do nothing, simply create the file */
        } else {
          throw error;
        }
      }
    } else {
      try {
        await this.getFileId(path, scope, 'directory');
        throw new CloudStorageError(`File ${path} already exists`, NativeCloudStorageErrorCode.FILE_ALREADY_EXISTS);
      } catch (error: unknown) {
        if (error instanceof CloudStorageError && error.code === NativeCloudStorageErrorCode.FILE_NOT_FOUND) {
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
      const { directories, filename } = this.resolvePathToDirectories(path);
      const parentDirectoryId = await this.findParentDirectoryId(directories, scope);
      if (parentDirectoryId === null) {
        throw new CloudStorageError(`Directory not found`, NativeCloudStorageErrorCode.DIRECTORY_NOT_FOUND);
      }

      await this.drive.createFile(
        {
          name: filename,
          parents: [parentDirectoryId],
        },
        {
          body: data,
          mimeType: MimeTypes.TEXT,
        }
      );
    }
  }

  async listFiles(path: string, scope: NativeStorageScope): Promise<string[]> {
    const parentDirectoryId = this.isRootPath(path)
      ? await this.getQueryRootParentId(scope)
      : await this.getFileId(path, scope);

    const files = await this.findFilesByParent(parentDirectoryId, scope);
    return [...new Set(files.map((f) => f.name))];
  }

  async createDirectory(path: string, scope: NativeStorageScope): Promise<void> {
    if (this.isRootPath(path)) {
      throw new CloudStorageError(`Directory ${path} already exists`, NativeCloudStorageErrorCode.FILE_ALREADY_EXISTS);
    }

    try {
      await this.getFileId(path, scope);
      throw new CloudStorageError(`File ${path} already exists`, NativeCloudStorageErrorCode.FILE_ALREADY_EXISTS);
    } catch (error: unknown) {
      if (error instanceof CloudStorageError && error.code === NativeCloudStorageErrorCode.FILE_NOT_FOUND) {
        /* do nothing, simply create the directory */
      } else if (error instanceof CloudStorageError && error.code === NativeCloudStorageErrorCode.PATH_IS_DIRECTORY) {
        throw new CloudStorageError(
          `Directory ${path} already exists`,
          NativeCloudStorageErrorCode.FILE_ALREADY_EXISTS
        );
      } else {
        throw error;
      }
    }

    const { directories, filename } = this.resolvePathToDirectories(path);
    const parentDirectoryId = await this.findParentDirectoryId(directories, scope);
    if (parentDirectoryId === null) {
      throw new CloudStorageError(`Directory not found`, NativeCloudStorageErrorCode.DIRECTORY_NOT_FOUND);
    }

    await this.drive.createDirectory({
      name: filename,
      parents: [parentDirectoryId],
    });
  }

  async readFile(path: string, scope: NativeStorageScope): Promise<string> {
    const fileId = await this.getFileId(path, scope, 'directory');
    const content = await this.drive.getFileText(fileId);
    return content;
  }

  async triggerSync(_path: string, _scope: NativeStorageScope): Promise<void> {
    // Triggering file synchronization in Google Drive is not necessary / possible, as they need to be downloaded on every read operation via the API anyway
    return;
  }

  async deleteFile(path: string, scope: NativeStorageScope): Promise<void> {
    // if trying to pass a directory, throw an error
    const fileId = await this.getFileId(path, scope, 'directory');
    await this.drive.deleteFile(fileId);
  }

  async deleteDirectory(path: string, recursive: boolean, scope: NativeStorageScope): Promise<void> {
    // if trying to pass a file, throw an error
    const fileId = await this.getFileId(path, scope, 'file');

    if (!recursive) {
      // check if the directory is empty
      const filesInDirectory = await this.findFilesByParent(fileId, scope);
      if (filesInDirectory.length > 0) {
        throw new CloudStorageError(
          `Directory ${path} is not empty`,
          NativeCloudStorageErrorCode.DELETE_ERROR,
          filesInDirectory
        );
      }
    }

    await this.drive.deleteFile(fileId);
  }

  async statFile(path: string, scope: NativeStorageScope): Promise<NativeStorageFileStat> {
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

  async downloadFile(remotePath: string, localPath: string, scope: NativeStorageScope): Promise<void> {
    const fileId = await this.getFileId(remotePath, scope, 'directory');

    try {
      await this.drive.downloadFile(fileId, localPath);
    } catch (error: unknown) {
      if (error instanceof CloudStorageError) throw error;

      throw new CloudStorageError(
        `Could not download file ${remotePath} to ${localPath}`,
        NativeCloudStorageErrorCode.UNKNOWN,
        error
      );
    }
  }

  async uploadFile(
    remotePath: string,
    localPath: string,
    mimeType: string,
    scope: NativeStorageScope,
    overwrite: boolean
  ): Promise<void> {
    let fileId: string | undefined;

    if (overwrite) {
      try {
        fileId = await this.getFileId(remotePath, scope, 'directory');
      } catch (error: unknown) {
        if (error instanceof CloudStorageError && error.code === NativeCloudStorageErrorCode.FILE_NOT_FOUND) {
          /* File doesn't exist -> we'll create it below */
        } else {
          throw error;
        }
      }
    } else {
      try {
        await this.getFileId(remotePath, scope, 'directory');
        throw new CloudStorageError(
          `File ${remotePath} already exists`,
          NativeCloudStorageErrorCode.FILE_ALREADY_EXISTS
        );
      } catch (error: unknown) {
        if (error instanceof CloudStorageError && error.code === NativeCloudStorageErrorCode.FILE_NOT_FOUND) {
          /* not found -> ok, we'll create */
        } else if (error instanceof CloudStorageError) {
          throw error;
        } else {
          throw error;
        }
      }
    }

    if (fileId) {
      // Overwrite existing file
      await this.drive.updateFile(fileId, {
        mimeType,
        localPath,
      });
    } else {
      // Need to create a new file first
      const { directories, filename } = this.resolvePathToDirectories(remotePath);
      const parentDirectoryId = await this.findParentDirectoryId(directories, scope);
      if (parentDirectoryId === null) {
        throw new CloudStorageError(`Directory not found`, NativeCloudStorageErrorCode.DIRECTORY_NOT_FOUND);
      }

      await this.drive.createFile(
        {
          name: filename,
          parents: [parentDirectoryId],
        },
        {
          mimeType,
          localPath,
        }
      );
    }
  }
}
