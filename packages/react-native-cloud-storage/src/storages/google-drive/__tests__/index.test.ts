import { afterEach, expect, it, vi } from 'vitest';
import GoogleDrive from '../index';
import { MimeTypes } from '../types';
import { DEFAULT_PROVIDER_OPTIONS } from '../../../utils/constants';

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

it.each([MimeTypes.FOLDER, MimeTypes.TEXT])(
  'rejects ambiguous parent directories with a %s match',
  async (mimeType) => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ files: [{ id: 'outer', mimeType: MimeTypes.FOLDER }] }))
      .mockResolvedValueOnce(
        response({
          files: [
            { id: 'first', mimeType: MimeTypes.FOLDER },
            { id: 'second', mimeType },
          ],
        })
      );
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      new GoogleDrive({ ...options, strictFilenames: true }).readFile('/outer/backups/data.json', 'app_data')
    ).rejects.toMatchObject({
      code: 'ERR_MULTIPLE_FILES_SAME_NAME',
      message: expect.stringContaining('/outer/backups'),
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const query = new URL(fetchMock.mock.calls[1]![0]).searchParams.get('q');
    expect(query).toContain("'outer' in parents");
    expect(query).not.toContain('mimeType');
  }
);
