import type { CloudStorageProviderOptions, DeepRequired } from '../../types/main';
import { NativeCloudStorageErrorCode, type NativeKVStorage } from '../../types/native';
import CloudStorageError from '../../utils/cloud-storage-error';
import { KV_LIMITS } from '../../utils/constants';
import { assertValidKVKey, getKVItemsByteLength } from '../../utils/kv';
import GoogleDriveApiClient from './client';
import { MimeTypes } from './types';

const DOCUMENT_NAME = '.rncs-kv.json';

type KVEntry = { v: string; t: number };
type KVEntries = Record<string, KVEntry>;
type KVDocument = { version: 1; entries: KVEntries };

/**
 * Emulates cloud key-value storage with one app-data document.
 * Read-merge-write reduces conflicts, but a read-to-write race remains.
 */
export default class GoogleDriveKV implements NativeKVStorage {
  private readonly drive: GoogleDriveApiClient;
  private readonly options: DeepRequired<CloudStorageProviderOptions['googledrive']>;
  private fileId: string | null | undefined;
  private mutationQueue: Promise<void> = Promise.resolve();

  constructor(options: DeepRequired<CloudStorageProviderOptions['googledrive']>) {
    this.options = options;
    this.drive = new GoogleDriveApiClient(options);
  }

  private assertAccessToken(): void {
    if (!this.options.accessToken?.length) {
      throw new CloudStorageError(
        'Google Drive access token is not set',
        NativeCloudStorageErrorCode.ACCESS_TOKEN_MISSING
      );
    }
  }

  private async resolveFileId(): Promise<string | null> {
    if (this.fileId !== undefined) return this.fileId;

    const files = await this.drive.listFiles(
      'appDataFolder',
      `name = '${DOCUMENT_NAME}' and 'appDataFolder' in parents and trashed = false`
    );
    if (files.length > 1 && this.options.strictFilenames) {
      throw new CloudStorageError(
        `Multiple key-value documents found: ${files.map((file) => file.id).join(', ')}`,
        NativeCloudStorageErrorCode.MULTIPLE_FILES_SAME_NAME
      );
    }
    this.fileId = files[0]?.id ?? null;
    return this.fileId;
  }

  private parseDocument(raw: string): KVDocument {
    try {
      const document = JSON.parse(raw) as KVDocument;
      if (
        document.version !== 1 ||
        typeof document.entries !== 'object' ||
        document.entries === null ||
        Array.isArray(document.entries)
      ) {
        throw new Error('Invalid document shape');
      }

      for (const entry of Object.values(document.entries)) {
        if (typeof entry?.v !== 'string' || typeof entry.t !== 'number' || !Number.isFinite(entry.t)) {
          throw new TypeError('Invalid entry');
        }
      }
      return document;
    } catch (error) {
      throw new CloudStorageError(`Could not parse ${DOCUMENT_NAME}`, NativeCloudStorageErrorCode.READ_ERROR, error);
    }
  }

  private async fetchDocument(): Promise<KVDocument> {
    this.assertAccessToken();
    const fileId = await this.resolveFileId();
    if (!fileId) return { version: 1, entries: {} };
    return this.parseDocument(await this.drive.getFileText(fileId));
  }

  private mergeEntries(...sources: KVEntries[]): KVEntries {
    const result: KVEntries = {};
    for (const source of sources) {
      for (const [key, entry] of Object.entries(source)) {
        if (!result[key] || entry.t >= result[key].t) result[key] = entry;
      }
    }
    return result;
  }

  private assertLimits(document: KVDocument): void {
    if (!this.options.kvStrictLimits) return;

    for (const key of Object.keys(document.entries)) assertValidKVKey(key);
    const items = Object.fromEntries(Object.entries(document.entries).map(([key, entry]) => [key, entry.v]));
    if (
      Object.keys(document.entries).length > KV_LIMITS.maxKeys ||
      getKVItemsByteLength(items) > KV_LIMITS.maxTotalBytes
    ) {
      throw new CloudStorageError('Key-value store quota exceeded', NativeCloudStorageErrorCode.KV_QUOTA_EXCEEDED);
    }
  }

  private async writeDocument(document: KVDocument): Promise<void> {
    this.assertLimits(document);
    const body = JSON.stringify(document);
    const fileId = await this.resolveFileId();

    if (fileId) {
      await this.drive.updateFile(fileId, { body, mimeType: MimeTypes.JSON });
    } else {
      this.fileId = await this.drive.createTextFile(
        { name: DOCUMENT_NAME, parents: ['appDataFolder'] },
        { body, mimeType: MimeTypes.JSON }
      );
    }
  }

  public async fetchEntries(): Promise<KVEntries> {
    const document = await this.fetchDocument();
    return Object.fromEntries(Object.entries(document.entries).map(([key, entry]) => [key, { ...entry }]));
  }

  private enqueueMutation(mutation: () => Promise<void>): Promise<void> {
    const result = this.mutationQueue.then(mutation, mutation);
    this.mutationQueue = result.catch(() => {});
    return result;
  }

  async kvGetItem(key: string): Promise<string | null> {
    assertValidKVKey(key);
    const entries = await this.fetchEntries();
    return entries[key]?.v ?? null;
  }

  kvSetItem(key: string, value: string): Promise<void> {
    assertValidKVKey(key);
    return this.enqueueMutation(async () => {
      const remoteDocument = await this.fetchDocument();
      const entries = this.mergeEntries(remoteDocument.entries, { [key]: { v: value, t: Date.now() } });
      await this.writeDocument({ version: 1, entries });
    });
  }

  kvRemoveItem(key: string): Promise<void> {
    assertValidKVKey(key);
    return this.enqueueMutation(async () => {
      const remoteDocument = await this.fetchDocument();
      const entries = { ...remoteDocument.entries };
      delete entries[key];
      await this.writeDocument({ version: 1, entries });
    });
  }

  async kvGetAllKeys(): Promise<string[]> {
    return Object.keys(await this.fetchEntries());
  }

  async kvGetAllItems(): Promise<Array<{ key: string; value: string }>> {
    return Object.entries(await this.fetchEntries()).map(([key, entry]) => ({ key, value: entry.v }));
  }

  kvClear(): Promise<void> {
    return this.enqueueMutation(async () => {
      await this.fetchDocument();
      await this.writeDocument({ version: 1, entries: {} });
    });
  }

  async kvSync(): Promise<boolean> {
    await this.fetchEntries();
    return true;
  }
}
