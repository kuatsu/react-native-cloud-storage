import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  type CloudKVExternalChangeEvent,
  CloudKVStorage,
  CloudStorageError,
  CloudStorageProvider,
} from 'react-native-cloud-storage';
import Button from '../../components/button';
import Card from '../../components/card';

interface HomeKVOperationsCardProps {
  storage: CloudKVStorage;
  provider: CloudStorageProvider;
  enabled: boolean;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof CloudStorageError) return `${error.code}: ${error.message}`;
  return error instanceof Error ? error.message : String(error);
};

const HomeKVOperationsCard: React.FC<HomeKVOperationsCardProps> = ({ storage, provider, enabled }) => {
  const [key, setKey] = useState('example.message');
  const [draftValue, setDraftValue] = useState('Hello from CloudKVStorage!');
  const [storedValue, setStoredValue] = useState<string | null>(null);
  const [_lastExternalChange, setLastExternalChange] = useState<CloudKVExternalChangeEvent | null>(null);
  const [_status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const readValue = useCallback(
    async (showStatus = true) => {
      if (!enabled) return;
      setLoading(true);
      setError('');
      try {
        const value = await storage.getItem(key);
        setStoredValue(value);
        if (showStatus) setStatus(value === null ? 'Key not found.' : 'Value read successfully.');
      } catch (readError) {
        setError(getErrorMessage(readError));
      } finally {
        setLoading(false);
      }
    },
    [enabled, key, storage]
  );

  useEffect(() => {
    setStoredValue(null);
    setStatus('');
    setError('');
    void readValue(false);
  }, [readValue]);

  useEffect(() => {
    if (!enabled) return;

    const handleExternalChange = (event: CloudKVExternalChangeEvent) => {
      setLastExternalChange(event);
      if (event.changedKeys.length === 0 || event.changedKeys.includes(key)) void readValue(false);
    };
    storage.subscribeToExternalChanges(handleExternalChange);
    return () => storage.unsubscribeFromExternalChanges(handleExternalChange);
  }, [enabled, key, readValue, storage]);

  const writeValue = async () => {
    setLoading(true);
    setError('');
    try {
      await storage.setItem(key, draftValue);
      setStoredValue(await storage.getItem(key));
      setStatus('Value written successfully.');
    } catch (writeError) {
      setError(getErrorMessage(writeError));
    } finally {
      setLoading(false);
    }
  };

  const removeValue = async () => {
    setLoading(true);
    setError('');
    try {
      await storage.removeItem(key);
      setStoredValue(null);
      setStatus('Value removed successfully.');
    } catch (removeError) {
      setError(getErrorMessage(removeError));
    } finally {
      setLoading(false);
    }
  };

  const synchronize = async () => {
    setLoading(true);
    setError('');
    try {
      const synchronized = await storage.sync();
      setStoredValue(await storage.getItem(key));
      setStatus(synchronized ? 'Synchronization requested successfully.' : 'Synchronization was not requested.');
    } catch (syncError) {
      setError(getErrorMessage(syncError));
    } finally {
      setLoading(false);
    }
  };

  const clearValues = async () => {
    setLoading(true);
    setError('');
    try {
      await storage.clear();
      setStoredValue(null);
      setStatus('Key-value store cleared.');
    } catch (clearError) {
      setError(getErrorMessage(clearError));
    } finally {
      setLoading(false);
    }
  };

  const confirmClear = () => {
    Alert.alert('Clear key-value store', 'Remove all values for this provider?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => void clearValues() },
    ]);
  };

  const controlsDisabled = !enabled || loading;

  return (
    <Card title="Key-Value Operations">
      <Text>
        <Text style={styles.label}>Implementation:</Text>{' '}
        {provider === CloudStorageProvider.ICloud ? 'Native' : 'Emulated'}
      </Text>
      {provider === CloudStorageProvider.GoogleDrive && (
        <Text style={styles.smallText}>External changes are polled every 5 seconds while this card is active.</Text>
      )}
      {!enabled && (
        <Text style={styles.warning}>Enter a Google Drive access token above to enable key-value operations.</Text>
      )}

      <Text style={styles.label}>Key</Text>
      <TextInput editable={!loading} placeholder="Key" value={key} onChangeText={setKey} style={styles.input} />
      <Text style={styles.label}>Value</Text>
      <TextInput
        editable={!loading}
        multiline
        placeholder="String value"
        value={draftValue}
        onChangeText={setDraftValue}
        style={[styles.input, styles.valueInput]}
      />

      <View style={styles.valueContainer}>
        <Text style={styles.label}>Stored value:</Text>
        <Text selectable>{storedValue ?? 'null'}</Text>
      </View>

      <Button disabled={controlsDisabled} title="Read value" onPress={() => void readValue()} />
      <Button disabled={controlsDisabled} title="Write value" onPress={() => void writeValue()} />
      <Button disabled={controlsDisabled} title="Remove value" onPress={() => void removeValue()} />
      <Button disabled={controlsDisabled} title="Synchronize store" onPress={() => void synchronize()} />
      <Button disabled={controlsDisabled} title="Clear store" onPress={confirmClear} />

      {loading && <ActivityIndicator style={styles.activityIndicator} />}
      {error.length > 0 && <Text style={styles.error}>{error}</Text>}
    </Card>
  );
};

const styles = StyleSheet.create({
  activityIndicator: {
    marginTop: 10,
  },
  error: {
    color: '#b00020',
    marginTop: 10,
  },
  input: {
    borderColor: 'gray',
    borderRadius: 4,
    borderWidth: 1,
    height: 40,
    marginVertical: 5,
    paddingHorizontal: 10,
    width: '100%',
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  smallText: {
    fontSize: 10,
    marginTop: 5,
  },
  status: {
    color: '#176b2c',
    marginTop: 10,
  },
  valueContainer: {
    backgroundColor: '#f1f5f7',
    borderRadius: 4,
    marginVertical: 5,
    padding: 10,
  },
  valueInput: {
    height: 80,
    paddingVertical: 10,
    textAlignVertical: 'top',
  },
  warning: {
    color: '#8a4b00',
    marginTop: 10,
  },
});

export default HomeKVOperationsCard;
