import { afterEach, expect, it, vi } from 'vitest';
import GoogleDriveApiClient from '../client';
import { DEFAULT_PROVIDER_OPTIONS } from '../../../utils/constants';

const client = () => new GoogleDriveApiClient({ ...DEFAULT_PROVIDER_OPTIONS.googledrive, accessToken: 'token' });

afterEach(() => vi.unstubAllGlobals());

it.each([0, 256])('uploads %i bytes with metadata and preserves array slice boundaries', async (length) => {
  const bytes = Uint8Array.from({ length: length + 2 }, (_, index) => index % 256).subarray(1, length + 1);
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({ id: 'file' }) });
  vi.stubGlobal('fetch', fetchMock);

  await client().createFile(
    { name: 'é.zip', parents: ['appDataFolder'] },
    { mimeType: 'application/zip', body: bytes }
  );

  const [url, options] = fetchMock.mock.calls[0]!;
  expect(url).toContain('/upload/drive/v3/files?uploadType=multipart');
  expect(options.headers).not.toHaveProperty('Content-Length');
  const boundary = options.headers['Content-Type'].split('boundary=')[1];
  const prefix = new TextEncoder().encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify({ name: 'é.zip', parents: ['appDataFolder'] })}\r\n` +
      `--${boundary}\r\nContent-Type: application/zip\r\n\r\n`
  );
  const body = options.body as Uint8Array;
  expect(Array.from(body.subarray(0, prefix.length))).toEqual(Array.from(prefix));
  expect(body.subarray(prefix.length, prefix.length + length)).toEqual(bytes);
  expect(new TextDecoder().decode(body.subarray(prefix.length + length))).toBe(`\r\n--${boundary}--`);
});

it('overwrites a file with the exact supplied bytes', async () => {
  const bytes = new Uint8Array([9, 0, 128, 255, 9]).subarray(1, 4);
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
  vi.stubGlobal('fetch', fetchMock);

  await client().updateFile('file', { mimeType: 'application/octet-stream', body: bytes });

  expect(fetchMock.mock.calls[0]![0]).toContain('/files/file?uploadType=media');
  expect(fetchMock.mock.calls[0]![1]).toMatchObject({ method: 'PATCH', body: bytes });
  expect(fetchMock.mock.calls[0]![1].body.buffer.byteLength).toBe(bytes.length);
});

it.each([
  [0, 200],
  [0, 204],
  [256, 200],
])('reads %i bytes with status %i without text decoding', async (length, status) => {
  const bytes = Uint8Array.from({ length }, (_, index) => index);
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, status, arrayBuffer: async () => bytes.buffer });
  vi.stubGlobal('fetch', fetchMock);

  await expect(client().getFileBytes('file')).resolves.toEqual(bytes);
  expect(fetchMock.mock.calls[0]![0]).toContain('/files/file?alt=media');
});

it('normalizes errors for binary responses', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({
      ok: false,
      status: 403,
      text: async () =>
        JSON.stringify({ error: { message: 'Quota exceeded', errors: [{ reason: 'storageQuotaExceeded' }] } }),
      headers: new Headers(),
    })
  );

  await expect(client().getFileBytes('file')).rejects.toMatchObject({ code: 'ERR_QUOTA_EXCEEDED' });
});
