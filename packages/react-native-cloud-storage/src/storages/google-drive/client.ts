import { type CloudStorageProviderOptions, type DeepRequired } from '../../types/main';
import {
  MimeTypes,
  type GoogleDriveFile,
  type GoogleDriveFileSpace,
  type GoogleDriveListOperationQueryParameters,
  type GoogleDriveListOperationResponse,
} from './types';
import { localFileSystem } from '../../utils/local-fs';

const BASE_URL = 'https://www.googleapis.com/drive/v3';
const BASE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3';
const MULTIPART_BOUNDARY = 'foo_bar_baz';

export class GoogleDriveHttpError extends Error {
  public status: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public json: any;

  constructor(message: string, status: number, json: unknown) {
    super(message);
    this.status = status;
    this.json = json;
  }
}

// TODO: properly handle errors
export default class GoogleDriveApiClient {
  private _fetchTimeout: NodeJS.Timeout | null = null;
  private options: DeepRequired<CloudStorageProviderOptions['googledrive']>;

  constructor(options: DeepRequired<CloudStorageProviderOptions['googledrive']>) {
    this.options = options;
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
    { queryParameters, baseUrl, ...options }: RequestInit & { queryParameters?: object; baseUrl?: string } = {}
  ): Promise<T> {
    const { timeout, accessToken } = this.options;

    let path = `${baseUrl ?? BASE_URL}${operation}`;
    if (queryParameters) {
      path += this.buildQueryString(queryParameters);
    }
    if (this._fetchTimeout !== null) clearTimeout(this._fetchTimeout);
    const abortController: AbortController = new AbortController();
    this._fetchTimeout = setTimeout(() => {
      abortController.abort();
    }, timeout);
    const response = await fetch(path, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${accessToken}`,
      },
      signal: abortController.signal,
    });
    if (!response.ok) {
      let errorMessage: string;
      let json: unknown = null;
      try {
        json = await response.json();
        errorMessage =
          typeof json === 'object' &&
          json !== null &&
          'error' in json &&
          typeof json.error === 'object' &&
          json.error !== null &&
          'message' in json.error &&
          typeof json.error.message === 'string'
            ? json.error.message
            : `Request failed with status ${response.status}`;
      } catch {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new GoogleDriveHttpError(errorMessage, response.status, json);
    }

    if (response.status === 204) {
      return undefined as unknown as T;
    }
    if (options?.headers && 'Accept' in options.headers && options.headers.Accept !== 'application/json') {
      return response.text() as unknown as Promise<T>;
    }
    return response.json();
  }

  private buildMultiPartBody(metadata: object, media: { mimeType: string; body: string }): string {
    const body: string[] = [];
    body.push(
      `--${MULTIPART_BOUNDARY}\r\n`,
      `Content-Type: ${MimeTypes.JSON}; charset=UTF-8\r\n\r\n`,
      `${JSON.stringify(metadata)}\r\n`,
      `--${MULTIPART_BOUNDARY}\r\n`,
      `Content-Type: ${media.mimeType}\r\n\r\n`,
      `${media.body}\r\n`,
      `--${MULTIPART_BOUNDARY}--`
    );

    return body.join('');
  }

  public async listFiles(space: GoogleDriveFileSpace): Promise<GoogleDriveFile[]> {
    const files: GoogleDriveFile[] = [];
    let pageToken: string | undefined;
    const fields = ['id', 'kind', 'mimeType', 'name', 'parents', 'spaces', 'size', 'createdTime', 'modifiedTime'];
    do {
      const queryParameters: GoogleDriveListOperationQueryParameters = {
        fields: `files(${fields.join(',')}),nextPageToken`,
        spaces: space,
        pageToken,
      };
      const response = await this.request<GoogleDriveListOperationResponse>(`/files`, {
        queryParameters,
      });

      files.push(...response.files);
      pageToken = response.nextPageToken ?? undefined;
    } while (pageToken);

    return files;
  }

  public async getFile(fileId: string): Promise<GoogleDriveFile> {
    const queryParameters: GoogleDriveListOperationQueryParameters = {
      fields: ['id', 'kind', 'mimeType', 'name', 'parents', 'spaces', 'size', 'createdTime', 'modifiedTime'].join(','),
    };
    return this.request<GoogleDriveFile>(`/files/${fileId}`, {
      queryParameters,
    });
  }

  public async getFileText(fileId: string): Promise<string> {
    return this.request<string>(`/files/${fileId}`, {
      queryParameters: { alt: 'media' },
      headers: { Accept: 'text/plain' },
    });
  }

  public async deleteFile(fileId: string): Promise<void> {
    return this.request(`/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  public async createFile(
    metadata: { name: string; parents?: string[] },
    media: { mimeType: string; body: string } | { mimeType: string; localPath: string }
  ): Promise<void> {
    if ('body' in media) {
      const multipartRequestBody = this.buildMultiPartBody(metadata, media);

      await this.request(`/files`, {
        queryParameters: { uploadType: 'multipart' },
        method: 'POST',
        headers: {
          'Content-Type': `multipart/related; boundary=${MULTIPART_BOUNDARY}`,
          'Content-Length': multipartRequestBody.length.toString(),
        },
        body: multipartRequestBody,
        baseUrl: BASE_UPLOAD_URL,
      });
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
          'Authorization': `Bearer ${this.options.accessToken}`,
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
    media: { mimeType: string; body: string } | { mimeType: string; localPath: string }
  ): Promise<void> {
    if ('body' in media) {
      await this.request(`/files/${fileId}`, {
        queryParameters: { uploadType: 'media' },
        method: 'PATCH',
        headers: {
          'Content-Type': media.mimeType,
          'Content-Length': media.body.length.toString(),
        },
        body: media.body,
        baseUrl: BASE_UPLOAD_URL,
      });
    } else {
      const remoteUri = `${BASE_UPLOAD_URL}/files/${fileId}?uploadType=media`;
      await localFileSystem.uploadFile(media.localPath, remoteUri, {
        method: 'PATCH',
        uploadType: 'binary',
        headers: {
          'Authorization': `Bearer ${this.options.accessToken}`,
          'Content-Type': media.mimeType,
        },
      });
    }
  }

  public async downloadFile(_fileId: string, _localPath: string): Promise<void> {
    // TODO: implement
  }
}
