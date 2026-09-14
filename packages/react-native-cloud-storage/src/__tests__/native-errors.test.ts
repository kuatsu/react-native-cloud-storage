import { expect, it } from 'vitest';
import { createProxiedNativeModule } from '../utils/native';
import { NativeCloudStorageErrorCode } from '../types/native';

it('preserves native error details when normalizing known errors', async () => {
  const error = {
    code: NativeCloudStorageErrorCode.FILE_NOT_DOWNLOADABLE,
    message: 'Download failed: no permission',
    userInfo: { NSUnderlyingError: { domain: 'NSCocoaErrorDomain', code: 257 } },
  };
  const module = createProxiedNativeModule({
    async triggerSync() {
      throw error;
    },
  });
  await expect(module?.triggerSync()).rejects.toMatchObject({
    code: error.code,
    message: error.message,
    details: error,
  });
});
