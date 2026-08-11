import { useCallback, useEffect, useMemo, useState } from 'react';
import RNCloudKVStorage from '../cloud-kv-storage';

/** Converts a typed value to and from the string format used by CloudKVStorage. */
export interface CloudKVSerializer<T> {
  /** Converts a stored string into the value exposed by the hook. */
  parse: (raw: string) => T;
  /** Converts a value into the string saved by CloudKVStorage. */
  stringify: (value: T) => string;
}

/** Configures a useCloudKV hook. */
export interface UseCloudKVOptions<T> {
  /** A standalone CloudKVStorage instance. The shared default instance is used when omitted. */
  instance?: RNCloudKVStorage;
  /** A serializer for non-string values. Strings use an identity serializer when omitted. */
  serializer?: CloudKVSerializer<T>;
}

/** The state and operations returned by useCloudKV. */
export interface UseCloudKVResult<T> {
  /** The stored value, or null when the key does not exist. */
  value: T | null;
  /** Whether the hook is reading the current value. */
  loading: boolean;
  /** Saves a value and then refreshes the hook state. */
  setValue: (value: T) => Promise<void>;
  /** Removes the value and then refreshes the hook state. */
  removeValue: () => Promise<void>;
  /** Synchronizes the provider and then refreshes the hook state. */
  sync: () => Promise<void>;
}

/**
 * Reads and writes one cloud key-value entry and refreshes it after relevant external changes.
 * @param key The key to read and write.
 * @param options An optional storage instance and serializer.
 * @returns The current value, loading state, and mutation functions.
 */
export const useCloudKV = <T = string>(key: string, options?: UseCloudKVOptions<T>): UseCloudKVResult<T> => {
  const [value, setValueState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const instance = options?.instance ?? RNCloudKVStorage.getDefaultInstance();
  const serializer = useMemo<CloudKVSerializer<T>>(
    () =>
      options?.serializer ?? {
        parse: (raw) => raw as T,
        stringify: (nextValue) => {
          if (typeof nextValue !== 'string') throw new Error('A serializer is required for non-string values.');
          return nextValue;
        },
      },
    [options?.serializer]
  );

  const read = useCallback(async () => {
    setLoading(true);
    try {
      const raw = await instance.getItem(key);
      setValueState(raw === null ? null : serializer.parse(raw));
    } finally {
      setLoading(false);
    }
  }, [instance, key, serializer]);

  useEffect(() => {
    void read();
  }, [read]);

  useEffect(() => {
    const handleExternalChange = (event: { changedKeys: string[] }) => {
      if (event.changedKeys.length === 0 || event.changedKeys.includes(key)) void read();
    };
    instance.subscribeToExternalChanges(handleExternalChange);
    return () => instance.unsubscribeFromExternalChanges(handleExternalChange);
  }, [instance, key, read]);

  const setValue = useCallback(
    async (nextValue: T) => {
      await instance.setItem(key, serializer.stringify(nextValue));
      await read();
    },
    [instance, key, read, serializer]
  );

  const removeValue = useCallback(async () => {
    await instance.removeItem(key);
    await read();
  }, [instance, key, read]);

  const sync = useCallback(async () => {
    await instance.sync();
    await read();
  }, [instance, read]);

  return { value, loading, setValue, removeValue, sync };
};
