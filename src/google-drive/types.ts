export type GoogleDriveFileSpace = 'appDataFolder' | 'drive';
export interface GoogleDriveFile {
  id: string;
  kind: 'drive#file';
  mimeType: string;
  name: string;
  parents: string[];
  spaces: GoogleDriveFileSpace[];
  createdTime: string;
  modifiedTime: string;
  size?: number;
}

export interface GoogleDriveListOperationQueryParameters {
  corpora?: 'user' | 'drive' | 'domain' | 'allDrives';
  driveId?: string;
  fields?: string;
  includeItemsFromAllDrives?: boolean;
  includePermissionsForView?: 'published';
  // comma-separated list of 'createdTime' | 'folder' | 'modifiedByMeTime' | 'modifiedTime' | 'name' | 'name_natural' | 'quotaBytesUsed' | 'recency' | 'sharedWithMeTime' | 'starred' | 'viewedByMeTime'
  orderBy?: string;
  pageSize?: number;
  pageToken?: string;
  q?: string;
  // comma-separated list of 'appDataFolder' | 'drive' | 'photos'
  spaces?: string;
  supportsAllDrives?: boolean;
}

export interface GoogleDriveListOperationResponse {
  files: GoogleDriveFile[];
  incompleteSearch: boolean;
  kind: 'drive#fileList';
  nextPageToken: string;
}

export interface GoogleDriveDeleteOperationQueryParameters {
  supportsAllDrives?: boolean;
}

export interface GoogleDriveGetOperationQueryParameters {
  acknowledgeAbuse?: boolean;
  fields?: string;
  includeLabels?: string;
  includePermissionsForView?: 'published';
  supportsAllDrives?: boolean;
  alt?: 'media';
}

export interface GoogleDriveCreateOperationRequestBody {
  name?: string;
  mimeType?: string;
  parents?: string[];
}

export interface GoogleDriveCreateOperationQueryParameters {
  uploadType: 'media' | 'multipart' | 'resumable';
  ignoreDefaultVisibility?: boolean;
  includeLabels?: string;
  includePermissionsForView?: 'published';
  keepRevisionForever?: boolean;
  ocrLanguage?: string;
  supportsAllDrives?: boolean;
  useContentAsIndexableText?: boolean;
}
