import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TextInput, ActivityIndicator, ScrollView, Alert, Platform } from 'react-native';
import {
  CloudStorage,
  CloudStorageError,
  CloudStorageErrorCode,
  type CloudStorageFileStat,
  CloudStorageProvider,
  CloudStorageScope,
  useIsCloudAvailable,
} from 'react-native-cloud-storage';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as Crypto from 'expo-crypto';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/card';
import Button from '../components/button';

const HomeView = () => {
  const [provider, setProvider] = useState(CloudStorage.getDefaultProvider());
  const [scope, setScope] = useState(CloudStorageScope.AppData);
  const [parentDirectory, setParentDirectory] = useState('/');
  const [filename, setFilename] = useState('test.txt');
  const [stats, setStats] = useState<CloudStorageFileStat | null>(null);
  const [input, setInput] = useState('');
  const [appendInput, setAppendInput] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  const cloudStorage = useMemo(() => {
    return new CloudStorage(
      provider,
      provider === CloudStorageProvider.GoogleDrive ? { strictFilenames: true } : undefined
    );
  }, [provider]);

  const cloudAvailable = useIsCloudAvailable(cloudStorage);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log(cloudAvailable ? 'Cloud storage available' : 'Cloud storage not available');
  }, [cloudAvailable]);

  useEffect(() => {
    if (cloudStorage.getProvider() !== CloudStorageProvider.GoogleDrive) return;

    cloudStorage.setProviderOptions({
      accessToken: accessToken.length > 0 ? accessToken : null,
    });
  }, [accessToken, cloudStorage]);

  useEffect(() => {
    cloudStorage.setProviderOptions({ scope });
  }, [scope, cloudStorage]);

  useEffect(() => {
    setStats(null);
    setInput('');
  }, [parentDirectory, filename, scope]);

  const handleCheckDirectoryExists = async () => {
    setLoading(true);
    try {
      const exists = await cloudStorage.exists(parentDirectory);
      Alert.alert(
        parentDirectory === '/' || parentDirectory.length === 0
          ? 'Root Directory exists?'
          : `Directory ${parentDirectory} exists?`,
        exists ? '✅ Yes' : '❌ No'
      );
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectory = async () => {
    setLoading(true);
    try {
      await cloudStorage.mkdir(parentDirectory);
      readFile();
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleListContents = async () => {
    setLoading(true);
    try {
      const contents = await cloudStorage.readdir(parentDirectory);
      Alert.alert('Directory contents', contents.map((c) => `• ${c}`).join('\n'));
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const readFile = async () => {
    setLoading(true);
    try {
      const newStats = await cloudStorage.stat(parentDirectory + '/' + filename);
      setStats(newStats);
      console.log('File stats', newStats);
      if (newStats.isDirectory()) return;
      setInput(await cloudStorage.readFile(parentDirectory + '/' + filename));
    } catch (error) {
      if (error instanceof CloudStorageError) {
        if (error.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
          setStats(null);
          setInput('');
        } else {
          console.warn('Native storage error', error.code, error.message);
        }
      } else console.warn('Unknown error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFile = async () => {
    setLoading(true);
    try {
      await cloudStorage.writeFile(parentDirectory + '/' + filename, input);
      readFile();
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppend = async () => {
    setLoading(true);
    try {
      await cloudStorage.appendFile(parentDirectory + '/' + filename, appendInput);
      readFile();
      setAppendInput('');
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      base64: false,
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      setLoading(true);
      try {
        const file = result.assets[0];
        await cloudStorage.uploadFile(parentDirectory + '/' + filename, file.uri.replace(/^file:\/\//, ''), {
          mimeType: file.mimeType ?? 'application/octet-stream',
        });
        Alert.alert('File uploaded', 'File uploaded successfully.');
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadFile = async () => {
    setLoading(true);
    try {
      const directory = FileSystem.cacheDirectory;
      if (!directory) throw new Error('Could not get cache directory');
      const newFilename = directory.replace(/^file:\/\//, '') + (await Crypto.randomUUID());
      await cloudStorage.downloadFile(parentDirectory + '/' + filename, newFilename);
      Alert.alert('File downloaded', `File downloaded to ${newFilename}`);
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = readFile;

  const handleStatFile = async () => {
    setLoading(true);
    try {
      const stats = await cloudStorage.stat(parentDirectory + '/' + filename);
      Alert.alert('File stats', JSON.stringify(stats, null, 2));
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFile = async () => {
    setLoading(true);
    try {
      await cloudStorage.unlink(parentDirectory + '/' + filename);
      readFile();
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDirectory = async (recursive?: boolean) => {
    if (recursive === undefined) {
      Alert.alert('Delete directory', 'Do you want to delete the directory and all its contents (recursively)?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Directory only', onPress: () => handleDeleteDirectory(false) },
        { text: 'Recursively', onPress: () => handleDeleteDirectory(true) },
      ]);
    } else {
      setLoading(true);
      try {
        await cloudStorage.rmdir(parentDirectory, { recursive });
        setStats(null);
        setInput('');
      } catch (error) {
        console.warn(error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      await cloudStorage.triggerSync(parentDirectory + '/' + filename);
      Alert.alert('File download', 'File downloaded successfully.');
    } catch (error) {
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
      <Text style={styles.title}>RNCloudStorage{'\n'}Example App</Text>
      <Card title="Configuration">
        <Text>
          <Text style={{ fontWeight: 'bold' }}>Cloud storage available:</Text> {cloudAvailable ? '✅ Yes' : '❌ No'}
        </Text>
        <Text style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>Provider:</Text>{' '}
          {provider === CloudStorageProvider.ICloud ? 'iCloud' : 'Google Drive'}
        </Text>
        {Platform.OS === 'ios' && (
          <Button
            title={`Switch to ${provider === CloudStorageProvider.ICloud ? 'Google Drive' : 'iCloud'} provider`}
            onPress={() =>
              setProvider(
                provider === CloudStorageProvider.ICloud
                  ? CloudStorageProvider.GoogleDrive
                  : CloudStorageProvider.ICloud
              )
            }
          />
        )}
        <Text style={{ marginTop: 10 }}>
          <Text style={{ fontWeight: 'bold' }}>Directory Scope</Text>:{' '}
          {scope === CloudStorageScope.Documents ? 'Documents' : 'App Data'}
        </Text>
        <Button
          title={`Switch to ${scope === CloudStorageScope.Documents ? 'App Data' : 'Documents'} scope`}
          onPress={() =>
            setScope(scope === CloudStorageScope.Documents ? CloudStorageScope.AppData : CloudStorageScope.Documents)
          }
        />
        {provider === CloudStorageProvider.GoogleDrive && (
          <>
            <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Access Token</Text>
            <TextInput
              placeholder="Google Drive access token"
              value={accessToken}
              onChangeText={setAccessToken}
              style={styles.input}
            />
          </>
        )}
      </Card>
      <Card title="Working Directory">
        <Text style={{ fontWeight: 'bold', marginTop: 10 }}>Parent directory</Text>
        <TextInput
          placeholder="Parent directory"
          value={parentDirectory}
          onChangeText={setParentDirectory}
          style={styles.input}
        />
        <Button title="Check if exists" onPress={handleCheckDirectoryExists} />
        <Button title="Create this directory" onPress={handleCreateDirectory} />
        <Text style={styles.smallText}>Before performing any file operations, the parent directory must exist.</Text>
        <Button title="List contents of directory" onPress={handleListContents} />
        <Button title="Delete directory" onPress={() => handleDeleteDirectory()} />
      </Card>
      <Card title="File Operations">
        <Text style={{ fontWeight: 'bold' }}>Filename of working file</Text>
        <TextInput placeholder="Filename" value={filename} onChangeText={setFilename} style={styles.input} />
        {provider === CloudStorageProvider.ICloud && <Button title="Trigger sync" onPress={handleDownload} />}
        <Button title="Read file" onPress={handleRead} />
        <Button title="Stat file" onPress={handleStatFile} />
        <Button title="Delete file" onPress={handleDeleteFile} />
        <TextInput
          placeholder="File contents (read/write)"
          value={input}
          onChangeText={setInput}
          style={styles.input}
        />
        <Button title="Write to file" onPress={handleCreateFile} />
        <TextInput
          placeholder="File contents to append"
          value={appendInput}
          onChangeText={setAppendInput}
          style={styles.input}
        />
        <Button title="Append to file" onPress={handleAppend} />
        <Button title="Choose file to upload" onPress={handleUploadFile} />
        <Button title="Download file to cache directory" onPress={handleDownloadFile} />
        <Text style={styles.smallText}>
          The filename will be prefixed with the parent directory. If the file does not exist, it will be created. If it
          does exist, it will be overwritten.
        </Text>
        <Text style={{ alignSelf: 'flex-end' }}>
          <Text style={{ fontWeight: 'bold' }}>Test file exists</Text>:{' '}
          {stats ? (stats.isDirectory() ? '❌ No (is directory)' : '✅ Yes') : '❌ No'}
        </Text>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5FCFF',
    paddingHorizontal: 20,
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
  loadingContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 10,
  },
  scrollView: {
    backgroundColor: '#F5FCFF',
  },
  smallText: {
    fontSize: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 10,
    textAlign: 'center',
  },
});

export default HomeView;
