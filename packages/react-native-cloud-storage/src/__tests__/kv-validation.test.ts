import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const nativeEvents = vi.hoisted(() => ({
  listener: undefined as ((event: { reason: string; changedKeys: string[] }) => void) | undefined,
}));

const backend = vi.hoisted(() => ({
  kvGetItem: vi.fn(async () => null),
  kvSetItem: vi.fn(async () => {}),
  kvRemoveItem: vi.fn(async () => {}),
  kvGetAllKeys: vi.fn(async () => []),
  kvGetAllItems: vi.fn<() => Promise<Array<{ key: string; value: string }>>>(async () => []),
  kvClear: vi.fn(async () => {}),
  kvSync: vi.fn(async () => true),
  fetchEntries: vi.fn(async () => ({})),
}));

vi.mock('../storages/ubiquitous-kv', () => ({
  NativeKVStoreModule: {
    onKVStoreChangedExternally: vi.fn((listener: (event: { reason: string; changedKeys: string[] }) => void) => {
      nativeEvents.listener = listener;
      return { remove: vi.fn() };
    }),
  },
  NativeUbiquitousKV: backend,
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
import { CloudKVSupportLevel, CloudStorageProvider } from '../types/main';
import { KV_LIMITS } from '../utils/constants';

const storage = () => new RNCloudKVStorage(CloudStorageProvider.GoogleDrive, { accessToken: 'token' });

const iCloudStorage = () => {
  vi.spyOn(RNCloudKVStorage, 'getSupportLevel').mockReturnValue(CloudKVSupportLevel.Native);
  return new RNCloudKVStorage(CloudStorageProvider.ICloud);
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.useRealTimers();
});

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

  it('rejects unsupported iCloud storage off iOS', () => {
    expect(() => new RNCloudKVStorage(CloudStorageProvider.ICloud)).toThrowError(
      expect.objectContaining({ code: 'ERR_KV_NOT_SUPPORTED' })
    );
  });

  it('rejects an iCloud write over quota', async () => {
    backend.kvGetAllItems.mockResolvedValueOnce([{ key: 'existing', value: 'x'.repeat(KV_LIMITS.maxTotalBytes) }]);

    await expect(iCloudStorage().setItem('new', 'value')).rejects.toMatchObject({ code: 'ERR_KV_QUOTA_EXCEEDED' });
    expect(backend.kvSetItem).not.toHaveBeenCalled();
  });

  it('reuses the iCloud quota snapshot for sequential writes', async () => {
    backend.kvGetAllItems.mockResolvedValueOnce([]);
    const instance = iCloudStorage();

    await instance.setItem('first', 'one');
    await instance.setItem('second', 'two');

    expect(backend.kvGetAllItems).toHaveBeenCalledOnce();
    expect(backend.kvSetItem).toHaveBeenCalledTimes(2);
  });

  it('delivers external changes after a listener throws', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const instance = iCloudStorage();
    const failingListener = vi.fn(() => {
      throw new Error('Listener failed');
    });
    const succeedingListener = vi.fn();
    instance.subscribeToExternalChanges(failingListener);
    instance.subscribeToExternalChanges(succeedingListener);

    nativeEvents.listener?.({ reason: 'server_change', changedKeys: ['remote'] });

    expect(failingListener).toHaveBeenCalledOnce();
    expect(succeedingListener).toHaveBeenCalledOnce();
    expect(consoleError).toHaveBeenCalledOnce();
    instance.unsubscribeFromExternalChanges(failingListener);
    instance.unsubscribeFromExternalChanges(succeedingListener);
  });

  it('invalidates the iCloud quota snapshot after an external change', async () => {
    backend.kvGetAllItems.mockResolvedValue([]);
    const instance = iCloudStorage();
    const listener = vi.fn();
    instance.subscribeToExternalChanges(listener);

    await instance.setItem('first', 'one');
    nativeEvents.listener?.({ reason: 'server_change', changedKeys: ['remote'] });
    await instance.setItem('second', 'two');

    expect(backend.kvGetAllItems).toHaveBeenCalledTimes(2);
    instance.unsubscribeFromExternalChanges(listener);
  });

  it('invalidates the iCloud quota snapshot on sync', async () => {
    backend.kvGetAllItems.mockResolvedValue([]);
    const instance = iCloudStorage();

    await instance.setItem('first', 'one');
    await instance.sync();
    await instance.setItem('second', 'two');

    expect(backend.kvGetAllItems).toHaveBeenCalledTimes(2);
  });

  it('validates an iCloud multiSet quota with one store read', async () => {
    backend.kvGetAllItems.mockResolvedValueOnce([]);
    const instance = iCloudStorage();

    await instance.multiSet([
      ['first', 'one'],
      ['second', 'two'],
    ]);

    expect(backend.kvGetAllItems).toHaveBeenCalledOnce();
    expect(backend.kvSetItem).toHaveBeenCalledTimes(2);
  });

  it('reads Google Drive once for multiGet', async () => {
    backend.kvGetAllItems.mockResolvedValueOnce([{ key: 'first', value: 'one' }]);

    await expect(storage().multiGet(['first', 'missing'])).resolves.toEqual([
      ['first', 'one'],
      ['missing', null],
    ]);
    expect(backend.kvGetAllItems).toHaveBeenCalledOnce();
    expect(backend.kvGetItem).not.toHaveBeenCalled();
  });
});

describe('CloudKVStorage polling', () => {
  beforeEach(() => vi.clearAllMocks());

  it.each([null, undefined, 0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'does not poll for interval %s',
    (kvPollInterval) => {
      vi.useFakeTimers();
      const intervalSpy = vi.spyOn(globalThis, 'setInterval');
      const instance = new RNCloudKVStorage(CloudStorageProvider.GoogleDrive, {
        accessToken: 'token',
        kvPollInterval,
      });
      const listener = vi.fn();

      instance.subscribeToExternalChanges(listener);

      expect(intervalSpy).not.toHaveBeenCalled();
      instance.unsubscribeFromExternalChanges(listener);
    }
  );

  it('polls for a finite positive interval', () => {
    vi.useFakeTimers();
    const intervalSpy = vi.spyOn(globalThis, 'setInterval');
    const instance = new RNCloudKVStorage(CloudStorageProvider.GoogleDrive, {
      accessToken: 'token',
      kvPollInterval: 1000,
    });
    const listener = vi.fn();

    instance.subscribeToExternalChanges(listener);

    expect(intervalSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    instance.unsubscribeFromExternalChanges(listener);
  });
});
