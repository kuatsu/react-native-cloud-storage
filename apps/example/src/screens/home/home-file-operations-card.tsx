import React, { useEffect, useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import {
  CloudStorage,
  CloudStorageError,
  CloudStorageErrorCode,
  type CloudStorageFileStat,
  CloudStorageProvider,
  CloudStorageScope,
} from 'react-native-cloud-storage';
import * as Crypto from 'expo-crypto';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { File } from 'expo-file-system';
import Button from '../../components/button';
import Card from '../../components/card';

interface HomeFileOperationsCardProps {
  cloudStorage: CloudStorage;
  directoryRevision: number;
  parentDirectory: string;
  scope: CloudStorageScope;
  onLoadingChange: (loading: boolean) => void;
}

const HomeFileOperationsCard: React.FC<HomeFileOperationsCardProps> = ({
  cloudStorage,
  directoryRevision,
  parentDirectory,
  scope,
  onLoadingChange,
}) => {
  const [filename, setFilename] = useState('test.txt');
  const [stats, setStats] = useState<CloudStorageFileStat | null>(null);
  const [input, setInput] = useState('');
  const [appendInput, setAppendInput] = useState('');
  const [useBytes, setUseBytes] = useState(Platform.OS === 'web');
  const [transferResult, setTransferResult] = useState('');
  const filePath = `${parentDirectory.replace(/\/+$/, '')}/${filename}`;

  useEffect(() => {
    setStats(null);
    setInput('');
    setTransferResult('');
  }, [cloudStorage, directoryRevision, filePath, scope]);

  const readFile = async () => {
    onLoadingChange(true);
    try {
      const newStats = await cloudStorage.stat(filePath);
      setStats(newStats);
      console.log('File stats', newStats);
      if (newStats.isDirectory()) return;
      setInput(await cloudStorage.readFile(filePath));
    } catch (error) {
      if (error instanceof CloudStorageError) {
        if (error.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
          setStats(null);
          setInput('');
        } else {
          console.warn('Native storage error', error.code, error.message);
        }
      } else {
        console.warn('Unknown error', error);
      }
    } finally {
      onLoadingChange(false);
    }
  };

  const writeFile = async () => {
    onLoadingChange(true);
    try {
      await cloudStorage.writeFile(filePath, input);
      await readFile();
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const appendToFile = async () => {
    onLoadingChange(true);
    try {
      await cloudStorage.appendFile(filePath, appendInput);
      await readFile();
      setAppendInput('');
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const uploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      base64: false,
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) return;
    const file = result.assets[0];

    onLoadingChange(true);
    setTransferResult('');
    try {
      const options = { mimeType: file.mimeType || 'application/octet-stream' };
      if (useBytes) {
        const bytes = file.file ? new Uint8Array(await file.file.arrayBuffer()) : await new File(file.uri).bytes();
        await cloudStorage.writeFile(filePath, bytes, options);
      } else {
        await cloudStorage.uploadFile(filePath, decodeURIComponent(file.uri.replace(/^file:\/\//, '')), options);
      }
      setStats(await cloudStorage.stat(filePath));
      setTransferResult('File saved.');
      Alert.alert('File saved', 'File saved. On iCloud, iOS uploads the local container copy asynchronously.');
    } catch (error) {
      setTransferResult(String(error));
      console.warn(error);
    } finally {
      if (Platform.OS === 'web') URL.revokeObjectURL(file.uri);
      onLoadingChange(false);
    }
  };

  const downloadFile = async () => {
    onLoadingChange(true);
    setTransferResult('');
    try {
      if (useBytes) {
        const bytes = await cloudStorage.readFile(filePath, { format: 'bytes' });
        const preview = Array.from(bytes.subarray(0, 16), (byte) => byte.toString(16).padStart(2, '0')).join(' ');
        setTransferResult(`Read ${bytes.byteLength} bytes${preview ? `\n${preview}` : ''}`);
        return;
      }
      const directory = FileSystem.cacheDirectory;
      if (!directory) throw new Error('Could not get cache directory');
      const newFilename = decodeURIComponent(directory.replace(/^file:\/\//, '')) + Crypto.randomUUID();
      await cloudStorage.downloadFile(filePath, newFilename);
      setTransferResult(`File downloaded to ${newFilename}`);
      Alert.alert('File downloaded', `File downloaded to ${newFilename}`);
    } catch (error) {
      setTransferResult(String(error));
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const statFile = async () => {
    onLoadingChange(true);
    try {
      const fileStats = await cloudStorage.stat(filePath);
      Alert.alert('File stats', JSON.stringify(fileStats, null, 2));
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const deleteFile = async () => {
    onLoadingChange(true);
    try {
      await cloudStorage.unlink(filePath);
      await readFile();
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const triggerSync = async () => {
    onLoadingChange(true);
    try {
      await cloudStorage.triggerSync(filePath);
      Alert.alert('Download requested', 'iOS received the download request. This does not confirm completion.');
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  return (
    <Card title="File Operations">
      <Text style={styles.label}>Filename of working file</Text>
      <TextInput placeholder="Filename" value={filename} onChangeText={setFilename} style={styles.input} />
      {cloudStorage.getProvider() === CloudStorageProvider.ICloud && (
        <Button title="Trigger sync" onPress={() => void triggerSync()} />
      )}
      <Button title="Read file" onPress={() => void readFile()} />
      <Button title="Stat file" onPress={() => void statFile()} />
      <Button title="Delete file" onPress={() => void deleteFile()} />
      <TextInput placeholder="File contents (read/write)" value={input} onChangeText={setInput} style={styles.input} />
      <Button title="Write to file" onPress={() => void writeFile()} />
      <TextInput
        placeholder="File contents to append"
        value={appendInput}
        onChangeText={setAppendInput}
        style={styles.input}
      />
      <Button title="Append to file" onPress={() => void appendToFile()} />
      <Text style={styles.label}>Binary transfers</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel="Binary transfer mode" style={styles.transferModes}>
        {[false, true].map((byteMode) => {
          const selected = useBytes === byteMode;
          const disabled = !byteMode && Platform.OS === 'web';
          return (
            <TouchableOpacity
              key={byteMode ? 'bytes' : 'files'}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled }}
              disabled={disabled}
              onPress={() => {
                setUseBytes(byteMode);
                setTransferResult('');
              }}
              style={[
                styles.transferMode,
                selected && styles.selectedTransferMode,
                disabled && styles.disabledTransferMode,
              ]}>
              <Text style={[styles.transferModeText, selected && styles.selectedTransferModeText]}>
                {byteMode ? 'Bytes' : 'Files'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Button title="Choose file to upload" onPress={() => void uploadFile()} />
      <Button
        title={useBytes ? 'Read file as bytes' : 'Download file to cache directory'}
        onPress={() => void downloadFile()}
      />
      {transferResult !== '' && <Text>{transferResult}</Text>}
      <Text style={styles.smallText}>
        The filename will be prefixed with the parent directory. If the file does not exist, it will be created. If it
        does exist, it will be overwritten.
      </Text>
      <Text style={styles.existsText}>
        <Text style={styles.label}>Test file exists:</Text>{' '}
        {stats ? (stats.isDirectory() ? '❌ No (is directory)' : '✅ Yes') : '❌ No'}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  disabledTransferMode: {
    opacity: 0.4,
  },
  existsText: {
    alignSelf: 'flex-end',
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
  },
  selectedTransferMode: {
    backgroundColor: '#3e86d3',
  },
  selectedTransferModeText: {
    color: 'white',
  },
  smallText: {
    fontSize: 10,
  },
  transferMode: {
    borderRadius: 999,
    flex: 1,
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: 10,
  },
  transferModes: {
    backgroundColor: '#edf3f9',
    borderRadius: 999,
    flexDirection: 'row',
    marginVertical: 5,
    padding: 4,
    width: '100%',
  },
  transferModeText: {
    color: '#29435a',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default HomeFileOperationsCard;
