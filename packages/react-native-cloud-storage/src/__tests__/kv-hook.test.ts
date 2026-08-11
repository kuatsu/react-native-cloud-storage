import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type RNCloudKVStorage from '../cloud-kv-storage';
import { useCloudKV, type UseCloudKVResult } from '../hooks/use-cloud-kv';
import { CloudKVChangeReason, type CloudKVExternalChangeEvent } from '../types/main';

type RootContainer = Parameters<typeof createRoot>[0];
const testDocument = (
  globalThis as unknown as {
    document: {
      body: { innerHTML: string; append: (node: RootContainer) => void };
      createElement: (tagName: string) => RootContainer;
    };
  }
).document;

const deferred = <T>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
};

afterEach(() => {
  testDocument.body.innerHTML = '';
});

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
    let result: UseCloudKVResult<string> | undefined;

    const Harness = () => {
      result = useCloudKV('key', { instance });
      return null;
    };

    const container = testDocument.createElement('div');
    testDocument.body.append(container);
    const root = createRoot(container);
    await act(async () => root.render(React.createElement(Harness)));

    await act(async () => {
      externalChangeListener?.({ reason: CloudKVChangeReason.ServerChange, changedKeys: ['key'] });
    });
    await act(async () => secondRead.resolve('new'));
    expect(result?.value).toBe('new');
    expect(result?.loading).toBe(false);

    await act(async () => firstRead.resolve('old'));
    expect(result?.value).toBe('new');
    expect(result?.loading).toBe(false);

    await act(async () => root.unmount());
  });
});
