import type {
  GoogleDriveFile,
  GoogleDriveFileSpace,
  GoogleDriveListOperationQueryParameters,
  GoogleDriveListOperationResponse,
} from './types';

const BASE_URL = 'https://www.googleapis.com/drive/v3';

// TODO: fetch timeout
// TODO: properly handle errors
// TODO: read file
// TODO: write file
// TODO: delete file
export default class GoogleDriveApiClient {
  public accessToken: string;

  constructor(accessToken: string = '') {
    this.accessToken = accessToken;
  }

  private buildQueryString(query: object): string {
    let res = Object.entries(query)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => {
        if (typeof value === 'boolean') return `${encodeURIComponent(key)}=${value ? 'true' : 'false'}`;
        return `${encodeURIComponent(key)}=${encodeURIComponent(value!)}`;
      })
      .join('&');

    if (res) {
      res = `?${res}`;
    }
    return res;
  }

  private async request<T extends Record<string, any> | string | void = void>(
    operation: `/${string}`,
    { queryParameters, ...options }: RequestInit & { queryParameters?: object } = {}
  ): Promise<T> {
    let path = `${BASE_URL}${operation}`;
    if (queryParameters) {
      path += this.buildQueryString(queryParameters);
    }

    const response = await fetch(path, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      // TODO: handle different errors
      // console.log((await response.json()).error.errors);
      let errorMessage: string;
      try {
        errorMessage =
          (await response.json()).error?.errors?.[0]?.message ?? `Request failed with status ${response.status}`;
      } catch (e) {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    if (options?.headers && 'Accept' in options.headers && options.headers.Accept !== 'application/json') {
      return response.text() as unknown as Promise<T>;
    }
    return response.json();
  }

  public async listFiles(space: GoogleDriveFileSpace): Promise<GoogleDriveFile[]> {
    const files: GoogleDriveFile[] = [];
    let pageToken: string | undefined;
    const fields = ['id', 'kind', 'mimeType', 'name', 'parents', 'spaces', 'size', 'createdTime', 'modifiedTime'];
    do {
      const queryParameters: GoogleDriveListOperationQueryParameters = {
        fields: `files(${fields.join(',')}),nextPageToken`,
        spaces: space,
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
}
