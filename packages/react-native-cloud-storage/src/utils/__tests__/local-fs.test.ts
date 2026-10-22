import { expect, it } from 'vitest';
import { localFileSystem } from '../local-fs';

it('rejects binary transfers on web', () => {
  expect(() => localFileSystem.uploadFile).toThrowError(expect.objectContaining({ code: 'ERR_UNSUPPORTED_PLATFORM' }));
});
