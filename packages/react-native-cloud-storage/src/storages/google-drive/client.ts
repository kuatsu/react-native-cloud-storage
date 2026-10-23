import { type CloudStorageProviderOptions, type DeepRequired } from '../../types/main';
import {
  MimeTypes,
  type GoogleDriveFile,
  type GoogleDriveFileSpace,
  type GoogleDriveListOperationQueryParameters,
  type GoogleDriveListOperationResponse,
} from './types';
import { localFileSystem } from '../../utils/local-fs';
import { NativeCloudStorageErrorCode } from '../../types/native';
import CloudStorageError from '../../utils/cloud-storage-error';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const BASE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';

export default class GoogleDriveApiClient {
  private options: DeepRequired<CloudStorageProviderOptions['googledrive']>;

  constructor(options: DeepRequired<CloudStorageProviderOptions['googledrive']>) {
    this.options = options;
  }

  public async getAccessToken(): Promise<string> {
    let token;
    try {
      const { accessToken } = this.options;
      token = typeof accessToken === 'function' ? await accessToken() : accessToken;
    } catch (error) {
      if (error instanceof CloudStorageError) throw error;
      throw new CloudStorageError(
        'Could not obtain a Google Drive access token',
        NativeCloudStorageErrorCode.AUTHENTICATION_FAILED,
        error
      );
    }
    if (!token?.length) {
      throw new CloudStorageError(
        'Google Drive access token is not set',
        NativeCloudStorageErrorCode.ACCESS_TOKEN_MISSING
      );
    }
    return token;
  }

  private buildQueryString(query: object): string {
    let result = Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'boolean') return `${encodeURIComponent(key)}=${value ? 'true' : 'false'}`;
        return `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`;
      })
      .join('&');

    if (result) {
      result = `?${result}`;
    }
    return result;
  }

  private async request<T extends object | string | void = void>(
    operation: `/${string}`,
    {
      queryParameters,
      baseUrl,
      errorCode,
      responseType,
      ...options
    }: RequestInit & {
      queryParameters?: object;
      baseUrl?: string;
      errorCode?: NativeCloudStorageErrorCode;
      responseType?: 'bytes';
    } = {}
  ): Promise<T> {
    const { timeout } = this.options;
    const accessToken = await this.getAccessToken();

    const failureCode =
      errorCode ??
      (options.method === 'DELETE'
        ? NativeCloudStorageErrorCode.DELETE_ERROR
        : options.method === 'POST' || options.method === 'PATCH'
          ? NativeCloudStorageErrorCode.WRITE_ERROR
          : NativeCloudStorageErrorCode.READ_ERROR);
    const abortController = new AbortController();
    const timer = setTimeout(() => abortController.abort(), timeout);
    try {
      let path = `${baseUrl ?? BASE_URL}${operation}`;
      if (queryParameters) path += this.buildQueryString(queryParameters);
      const response = await fetch(path, {
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${accessToken}` },
        signal: abortController.signal,
      });
      if (!response.ok) {
        const text = await response.text();
        let body;
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
        const reason = body?.error?.errors?.[0]?.reason;
        let code = failureCode;
        if (response.status === 401) code = NativeCloudStorageErrorCode.AUTHENTICATION_FAILED;
        else if (response.status === 404) code = NativeCloudStorageErrorCode.FILE_NOT_FOUND;
        else if (response.status === 429 || ['rateLimitExceeded', 'userRateLimitExceeded'].includes(reason)) {
          code = NativeCloudStorageErrorCode.RATE_LIMITED;
        } else if (['storageQuotaExceeded', 'dailyLimitExceeded'].includes(reason)) {
          code = NativeCloudStorageErrorCode.QUOTA_EXCEEDED;
        } else if (reason === 'fileNotDownloadable') code = NativeCloudStorageErrorCode.FILE_NOT_DOWNLOADABLE;
        throw new CloudStorageError(
          typeof body?.error?.message === 'string'
            ? body.error.message
            : `Request failed with status ${response.status}`,
          code,
          { status: response.status, body, retryAfter: response.headers.get('Retry-After') }
        );
      }
      if (responseType === 'bytes') return new Uint8Array(await response.arrayBuffer()) as T;
      if (response.status === 204) return undefined as T;
      if (options.headers && 'Accept' in options.headers && options.headers.Accept !== 'application/json') {
        return (await response.text()) as T;
      }
      return await response.json();
    } catch (error) {
      if (error instanceof CloudStorageError) throw error;
      throw new CloudStorageError(
        abortController.signal.aborted
          ? `Google Drive request timed out after ${timeout} ms`
          : error instanceof Error
            ? error.message
            : 'Google Drive request failed',
        error instanceof SyntaxError ? failureCode : NativeCloudStorageErrorCode.NETWORK_ERROR,
        error
      );
    } finally {
      clearTimeout(timer);
    }
  }

  private buildMultiPartBody(
    metadata: object,
    media: { mimeType: string; body: string | Uint8Array },
    boundary: string
  ): string | Uint8Array<ArrayBuffer> {
    const prefix = [
      `--${boundary}\r\n`,
      `Content-Type: ${MimeTypes.JSON}; charset=UTF-8\r\n\r\n`,
      `${JSON.stringify(metadata)}\r\n`,
      `--${boundary}\r\n`,
      `Content-Type: ${media.mimeType}\r\n\r\n`,
    ].join('');
    const suffix = `\r\n--${boundary}--`;
    if (typeof media.body === 'string') return prefix + media.body + suffix;

    const encoder = new TextEncoder();
    const start = encoder.encode(prefix);
    const end = encoder.encode(suffix);
    const body = new Uint8Array(start.length + media.body.length + end.length);
    body.set(start);
    body.set(media.body, start.length);
    body.set(end, start.length + media.body.length);
    return body;
  }

  public async listFiles(space: GoogleDriveFileSpace, query?: string): Promise<GoogleDriveFile[]> {
    const files: GoogleDriveFile[] = [];
    let pageToken: string | undefined;
    const fields = ['id', 'kind', 'mimeType', 'name', 'parents', 'spaces', 'size', 'createdTime', 'modifiedTime'];
    do {
      const queryParameters: GoogleDriveListOperationQueryParameters = {
        fields: `files(${fields.join(',')}),nextPageToken`,
        spaces: space,
        pageToken,
        q: query,
      };
      const response = await this.request<GoogleDriveListOperationResponse>(`/files`, {
        queryParameters,
      });

      files.push(...response.files);
      pageToken = response.nextPageToken ?? undefined;
    } while (pageToken);

    return files.sort((first, second) => (first.id < second.id ? -1 : first.id > second.id ? 1 : 0));
  }

  public async getFile(fileId: string): Promise<GoogleDriveFile> {
    const queryParameters: GoogleDriveListOperationQueryParameters = {
      fields: ['id', 'kind', 'mimeType', 'name', 'parents', 'spaces', 'size', 'createdTime', 'modifiedTime'].join(','),
    };
    return this.request<GoogleDriveFile>(`/files/${fileId}`, {
      queryParameters,
      errorCode: NativeCloudStorageErrorCode.STAT_ERROR,
    });
  }

  public async getFileText(fileId: string): Promise<string> {
    return this.request<string>(`/files/${fileId}`, {
      queryParameters: { alt: 'media' },
      headers: { Accept: 'text/plain' },
    });
  }

  public async getFileBytes(fileId: string): Promise<Uint8Array> {
    return this.request<Uint8Array>(`/files/${fileId}`, {
      queryParameters: { alt: 'media' },
      responseType: 'bytes',
    });
  }

  public async deleteFile(fileId: string): Promise<void> {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  public async createContentFile(
    metadata: { name: string; parents?: string[] },
    media: { mimeType: string; body: string | Uint8Array }
  ): Promise<string> {
    const boundary = `cloud-storage-${Math.random().toString(36).slice(2)}`;
    const multipartRequestBody = this.buildMultiPartBody(metadata, media, boundary);
    const file = await this.request<{ id: string }>(`/files`, {
      queryParameters: { uploadType: 'multipart', fields: 'id' },
      method: 'POST',
      headers: {
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
      baseUrl: BASE_UPLOAD_URL,
    });
    return file.id;
  }

  public async createFile(
    metadata: { name: string; parents?: string[] },
    media: { mimeType: string; body: string | Uint8Array } | { mimeType: string; localPath: string }
  ): Promise<void> {
    if ('body' in media) {
      await this.createContentFile(metadata, media);
    } else {
      // First, create an empty file with the required metadata
      const file = await this.request<{ id: string }>(`/files`, {
        method: 'POST',
        headers: {
          'Content-Type': MimeTypes.JSON,
        },
        body: JSON.stringify({ ...metadata, mimeType: media.mimeType }),
      });

      // Then, upload the binary content via the native helper module
      const remoteUri = `${BASE_UPLOAD_URL}/files/${file.id}?uploadType=media`;
      await localFileSystem.uploadFile(media.localPath, remoteUri, {
        method: 'PATCH',
        uploadType: 'binary',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': media.mimeType,
        },
      });
    }
  }

  public async createDirectory(metadata: { name: string; parents?: string[] }): Promise<void> {
    await this.request(`/files`, {
      method: 'POST',
      headers: {
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({ ...metadata, mimeType: MimeTypes.FOLDER }),
    });
  }

  public async updateFile(
    fileId: string,
    media: { mimeType: string; body: string | Uint8Array } | { mimeType: string; localPath: string }
  ): Promise<void> {
    if ('body' in media) {
      await this.request(`/files/${fileId}`, {
        queryParameters: { uploadType: 'media' },
        method: 'PATCH',
        headers: {
          'Content-Type': media.mimeType,
        },
        body: typeof media.body === 'string' ? media.body : new Uint8Array(media.body),
        baseUrl: BASE_UPLOAD_URL,
      });
    } else {
      const remoteUri = `${BASE_UPLOAD_URL}/files/${fileId}?uploadType=media`;
      await localFileSystem.uploadFile(media.localPath, remoteUri, {
        method: 'PATCH',
        uploadType: 'binary',
        headers: {
          'Authorization': `Bearer ${await this.getAccessToken()}`,
          'Content-Type': media.mimeType,
        },
      });
    }
  }

  public async downloadFile(fileId: string, localPath: string): Promise<void> {
    const remoteUri = `${BASE_URL}/files/${fileId}?alt=media`;
    await localFileSystem.downloadFile(remoteUri, localPath, {
      headers: {
        Authorization: `Bearer ${await this.getAccessToken()}`,
      },
    });
  }
}
