import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type RNCloudKVStorage from '../../cloud-kv-storage';
import { useCloudKV } from '../use-cloud-kv';
import { CloudKVChangeReason, type CloudKVExternalChangeEvent } from '../../types/main';

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

afterEach(cleanup);

describe('useCloudKV', () => {
  it('ignores a stale read that finishes after a newer read', async () => {
    const firstRead = deferred<string | null>();
    const secondRead = deferred<string | null>();
    let externalChangeListener: ((event: CloudKVExternalChangeEvent) => void) | undefined;
    const instance = {
      getItem: vi.fn().mockReturnValueOnce(firstRead.promise).mockReturnValueOnce(secondRead.promise),
      subscribeToExternalChanges: vi.fn((listener) => {
        externalChangeListener = listener;
      }),
      unsubscribeFromExternalChanges: vi.fn(),
    } as unknown as RNCloudKVStorage;
    const { result } = renderHook(() => useCloudKV('key', { instance }));

    await act(async () => {
      externalChangeListener?.({ reason: CloudKVChangeReason.ServerChange, changedKeys: ['key'] });
    });
    await act(async () => secondRead.resolve('new'));
    expect(result.current.value).toBe('new');
    expect(result.current.loading).toBe(false);

    await act(async () => firstRead.resolve('old'));
    expect(result.current.value).toBe('new');
    expect(result.current.loading).toBe(false);
  });
});
