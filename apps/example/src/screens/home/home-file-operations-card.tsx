import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
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
  const filePath = `${parentDirectory}/${filename}`;

  useEffect(() => {
    setStats(null);
    setInput('');
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

    onLoadingChange(true);
    try {
      const file = result.assets[0];
      await cloudStorage.uploadFile(filePath, file.uri.replace(/^file:\/\//, ''), {
        mimeType: file.mimeType ?? 'application/octet-stream',
      });
      Alert.alert('File uploaded', 'File uploaded successfully.');
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const downloadFile = async () => {
    onLoadingChange(true);
    try {
      const directory = FileSystem.cacheDirectory;
      if (!directory) throw new Error('Could not get cache directory');
      const newFilename = directory.replace(/^file:\/\//, '') + Crypto.randomUUID();
      await cloudStorage.downloadFile(filePath, newFilename);
      Alert.alert('File downloaded', `File downloaded to ${newFilename}`);
    } catch (error) {
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
      Alert.alert('File download', 'File downloaded successfully.');
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
      <Button title="Choose file to upload" onPress={() => void uploadFile()} />
      <Button title="Download file to cache directory" onPress={() => void downloadFile()} />
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
  smallText: {
    fontSize: 10,
  },
});

export default HomeFileOperationsCard;
