import { afterEach, expect, it, vi } from 'vitest';
import GoogleDrive from '../storages/google-drive';
import { MimeTypes } from '../storages/google-drive/types';
import { DEFAULT_PROVIDER_OPTIONS } from '../utils/constants';

const options = { ...DEFAULT_PROVIDER_OPTIONS.googledrive, accessToken: 'token' };
const response = (body: unknown): Response =>
  ({ ok: true, status: 200, json: async () => body, text: async () => String(body) }) as Response;

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('selects the lowest file ID across all result pages', async () => {
  const fetchMock = vi
    .fn()
    .mockResolvedValueOnce(response({ files: [{ id: 'a', mimeType: MimeTypes.TEXT }], nextPageToken: 'next' }))
    .mockResolvedValueOnce(response({ files: [{ id: 'Z', mimeType: MimeTypes.TEXT }] }))
    .mockResolvedValueOnce(response('selected'));
  vi.stubGlobal('fetch', fetchMock);

  await expect(new GoogleDrive(options).readFile('/data.json', 'app_data')).resolves.toBe('selected');

  expect(new URL(fetchMock.mock.calls[1]![0]).searchParams.get('pageToken')).toBe('next');
  expect(String(fetchMock.mock.calls[2]![0])).toContain('/files/Z?alt=media');
  expect(fetchMock).toHaveBeenCalledTimes(3);
});
