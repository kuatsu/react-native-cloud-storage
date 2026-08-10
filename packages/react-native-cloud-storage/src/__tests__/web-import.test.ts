import { describe, expect, it } from 'vitest';

describe('web (react-native-web) compatibility', () => {
  it('imports without throwing', async () => {
    const module_ = await import('../index');
    expect(module_.CloudStorage).toBeDefined();
  });

  it('defaults to the Google Drive provider', async () => {
    const { CloudStorage, CloudStorageProvider } = await import('../index');
    expect(CloudStorage.getDefaultProvider()).toBe(CloudStorageProvider.GoogleDrive);
  });

  it('binary transfer helper throws ERR_UNSUPPORTED_PLATFORM', async () => {
    const { localFileSystem } = await import('../utils/local-fs');
    const { default: CloudStorageError } = await import('../utils/cloud-storage-error');
    try {
      // property access alone must throw — the proxy traps `get`
      localFileSystem.uploadFile;
      expect.unreachable('expected property access to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(CloudStorageError);
      expect((error as { code: string }).code).toBe('ERR_UNSUPPORTED_PLATFORM');
    }
  });
});
