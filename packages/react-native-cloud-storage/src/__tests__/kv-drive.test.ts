import { afterEach, describe, expect, it, vi } from 'vitest';
import GoogleDriveKV from '../storages/google-drive/kv';
import { CloudStorageProvider, type DeepRequired, type CloudStorageProviderOptions } from '../types/main';
import { DEFAULT_PROVIDER_OPTIONS } from '../utils/constants';

const options = (
  overrides: Partial<CloudStorageProviderOptions[CloudStorageProvider.GoogleDrive]> = {}
): DeepRequired<CloudStorageProviderOptions[CloudStorageProvider.GoogleDrive]> => ({
  ...DEFAULT_PROVIDER_OPTIONS[CloudStorageProvider.GoogleDrive],
  accessToken: 'token',
  timeout: 1_000_000,
  ...overrides,
});

const response = (body: unknown, text = false): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => body,
    text: async () => (text ? String(body) : JSON.stringify(body)),
  }) as Response;

const fileList = response({ files: [{ id: 'kv-file' }] });

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('Google Drive key-value emulation', () => {
  it('returns null when the document is missing', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ files: [] }))
    );

    await expect(new GoogleDriveKV(options()).kvGetItem('missing')).resolves.toBeNull();
  });

  it('reads, merges, and writes the document', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fileList)
      .mockResolvedValueOnce(response('{"version":1,"entries":{"kept":{"v":"yes","t":1}}}', true))
      .mockResolvedValueOnce(response({}));
    vi.stubGlobal('fetch', fetchMock);

    await new GoogleDriveKV(options()).kvSetItem('theme', 'dark');

    const upload = fetchMock.mock.calls[2]![1] as RequestInit;
    expect(upload.method).toBe('PATCH');
    expect(upload.body).toContain('"kept":{"v":"yes","t":1}');
    expect(upload.body).toContain('"theme":{"v":"dark"');
  });

  it('keeps a newer remote timestamp during merge', async () => {
    vi.spyOn(Date, 'now').mockReturnValue(150);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fileList)
      .mockResolvedValueOnce(response('{"version":1,"entries":{"shared":{"v":"old","t":100}}}', true))
      .mockResolvedValueOnce(
        response('{"version":1,"entries":{"shared":{"v":"remote","t":200},"added":{"v":"yes","t":200}}}', true)
      )
      .mockResolvedValueOnce(response({}));
    vi.stubGlobal('fetch', fetchMock);
    const storage = new GoogleDriveKV(options());

    await storage.kvGetItem('shared');
    await storage.kvSetItem('shared', 'local');

    const document = JSON.parse(fetchMock.mock.calls[3]![1]!.body as string);
    expect(document.entries.shared).toEqual({ v: 'remote', t: 200 });
    expect(document.entries.added).toEqual({ v: 'yes', t: 200 });
  });

  it('does not restore a remotely deleted cached key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(fileList)
      .mockResolvedValueOnce(response('{"version":1,"entries":{"deleted":{"v":"old","t":100}}}', true))
      .mockResolvedValueOnce(response('{"version":1,"entries":{}}', true))
      .mockResolvedValueOnce(response({}));
    vi.stubGlobal('fetch', fetchMock);
    const storage = new GoogleDriveKV(options());

    await storage.kvGetItem('deleted');
    await storage.kvSetItem('other', 'value');

    const document = JSON.parse(fetchMock.mock.calls[3]![1]!.body as string);
    expect(document.entries.deleted).toBeUndefined();
    expect(document.entries.other.v).toBe('value');
  });

  it('serializes initial writes and reuses the created document id', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ files: [] }))
      .mockResolvedValueOnce(response({ id: 'created-kv-file' }))
      .mockResolvedValueOnce(response('{"version":1,"entries":{"first":{"v":"one","t":1}}}', true))
      .mockResolvedValueOnce(response({}));
    vi.stubGlobal('fetch', fetchMock);
    const storage = new GoogleDriveKV(options());

    await Promise.all([storage.kvSetItem('first', 'one'), storage.kvSetItem('second', 'two')]);

    expect(fetchMock.mock.calls.filter(([url]) => String(url).includes('spaces=appDataFolder')).length).toBe(1);
    expect(String(fetchMock.mock.calls[2]![0])).toContain('/files/created-kv-file');
  });

  it('rejects duplicate documents in strict filename mode', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ files: [{ id: 'first' }, { id: 'second' }] }))
    );

    await expect(new GoogleDriveKV(options({ strictFilenames: true })).kvGetItem('key')).rejects.toMatchObject({
      code: 'ERR_MULTIPLE_FILES_SAME_NAME',
    });
  });

  it('allows key and value bytes up to the strict quota', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ files: [] }))
      .mockResolvedValueOnce(response({ id: 'created-kv-file' }));
    vi.stubGlobal('fetch', fetchMock);
    const storage = new GoogleDriveKV(options());

    await expect(storage.kvSetItem('k', 'x'.repeat(1024 * 1024 - 1))).resolves.toBeUndefined();
  });

  it('rejects documents over the strict quota', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => response({ files: [] }))
    );
    const storage = new GoogleDriveKV(options());

    await expect(storage.kvSetItem('large', 'x'.repeat(1024 * 1024))).rejects.toMatchObject({
      code: 'ERR_KV_QUOTA_EXCEEDED',
    });
  });

  it('rejects malformed remote documents', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(fileList).mockResolvedValueOnce(response('not-json', true));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new GoogleDriveKV(options()).kvGetAllItems()).rejects.toMatchObject({ code: 'ERR_READ_ERROR' });
  });
});
