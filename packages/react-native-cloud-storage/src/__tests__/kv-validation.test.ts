import { beforeEach, describe, expect, it, vi } from 'vitest';

const backend = vi.hoisted(() => ({
  kvGetItem: vi.fn(async () => null),
  kvSetItem: vi.fn(async () => {}),
  kvRemoveItem: vi.fn(async () => {}),
  kvGetAllKeys: vi.fn(async () => []),
  kvGetAllItems: vi.fn(async () => []),
  kvClear: vi.fn(async () => {}),
  kvSync: vi.fn(async () => true),
  fetchEntries: vi.fn(async () => ({})),
}));

vi.mock('../storages/google-drive/kv', () => ({
  default: class {
    kvGetItem = backend.kvGetItem;
    kvSetItem = backend.kvSetItem;
    kvRemoveItem = backend.kvRemoveItem;
    kvGetAllKeys = backend.kvGetAllKeys;
    kvGetAllItems = backend.kvGetAllItems;
    kvClear = backend.kvClear;
    kvSync = backend.kvSync;
    fetchEntries = backend.fetchEntries;
  },
}));

import RNCloudKVStorage from '../cloud-kv-storage';
import RNCloudStorage from '../cloud-storage';
import { CloudStorageProvider } from '../types/main';

const storage = () => new RNCloudKVStorage(CloudStorageProvider.GoogleDrive, { accessToken: 'token' });

describe('CloudKVStorage shared default configuration', () => {
  beforeEach(() => {
    RNCloudStorage.setProvider(CloudStorageProvider.GoogleDrive);
  });

  it('configures shared defaults through the static KV API', () => {
    RNCloudKVStorage.setProvider(CloudStorageProvider.GoogleDrive);
    RNCloudKVStorage.setProviderOptions({ accessToken: 'shared-token', kvPollInterval: 5000 });

    expect(RNCloudStorage.getProvider()).toBe(CloudStorageProvider.GoogleDrive);
    expect(RNCloudStorage.getProviderOptions()).toMatchObject({
      accessToken: 'shared-token',
      kvPollInterval: 5000,
    });
    expect(RNCloudKVStorage.getProviderOptions()).toMatchObject({
      accessToken: 'shared-token',
      kvPollInterval: 5000,
    });
  });

  it('configures shared defaults through the default KV instance', () => {
    RNCloudKVStorage.getDefaultInstance().setProviderOptions({ accessToken: 'instance-token' });

    expect(RNCloudStorage.getProviderOptions()).toMatchObject({ accessToken: 'instance-token' });
  });

  it('keeps explicit instances independent', () => {
    const standalone = storage();
    RNCloudKVStorage.setProviderOptions({ accessToken: 'shared-token' });

    expect(standalone.getProviderOptions()).toMatchObject({ accessToken: 'token' });
  });
});

describe('CloudKVStorage key validation', () => {
  beforeEach(() => vi.clearAllMocks());

  it('rejects an empty key', async () => {
    await expect(storage().setItem('', 'value')).rejects.toMatchObject({ code: 'ERR_KV_INVALID_KEY' });
  });

  it('rejects a 65-byte UTF-8 key', async () => {
    await expect(storage().setItem('é'.repeat(32) + 'a', 'value')).rejects.toMatchObject({
      code: 'ERR_KV_INVALID_KEY',
    });
  });

  it('accepts a 64-byte UTF-8 key', async () => {
    await storage().setItem('é'.repeat(32), 'value');
    expect(backend.kvSetItem).toHaveBeenCalledOnce();
  });
});
