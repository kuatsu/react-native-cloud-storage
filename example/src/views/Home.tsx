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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Card from '../components/Card';
import Button from '../components/Button';

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
      accessToken: accessToken.length ? accessToken : null,
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
        parentDirectory === '/' || !parentDirectory.length
          ? 'Root Directory exists?'
          : `Directory ${parentDirectory} exists?`,
        exists ? '✅ Yes' : '❌ No'
      );
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDirectory = async () => {
    setLoading(true);
    try {
      await cloudStorage.mkdir(parentDirectory);
      readFile();
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleListContents = async () => {
    setLoading(true);
    try {
      const contents = await cloudStorage.readdir(parentDirectory);
      Alert.alert('Directory contents', contents.map((c) => `• ${c}`).join('\n'));
    } catch (e) {
      console.warn(e);
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
    } catch (e) {
      if (e instanceof CloudStorageError) {
        if (e.code === CloudStorageErrorCode.FILE_NOT_FOUND) {
          setStats(null);
          setInput('');
        } else {
          console.warn('Native storage error', e.code, e.message);
        }
      } else console.warn('Unknown error', e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFile = async () => {
    setLoading(true);
    try {
      await cloudStorage.writeFile(parentDirectory + '/' + filename, input);
      readFile();
    } catch (e) {
      console.warn(e);
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
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleRead = readFile;

  const handleDeleteFile = async () => {
    setLoading(true);
    try {
      await cloudStorage.unlink(parentDirectory + '/' + filename);
      readFile();
    } catch (e) {
      console.warn(e);
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
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      await cloudStorage.downloadFile(parentDirectory + '/' + filename);
      Alert.alert('File download', 'File downloaded successfully.');
    } catch (e) {
      console.warn(e);
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
        {provider === CloudStorageProvider.ICloud && <Button title="Download file" onPress={handleDownload} />}
        <Button title="Read file" onPress={handleRead} />
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 10,
  },
  scrollView: {
    backgroundColor: '#F5FCFF',
  },
  container: {
    backgroundColor: '#F5FCFF',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    margin: 10,
    fontWeight: 'bold',
  },
  smallText: {
    fontSize: 10,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    paddingHorizontal: 10,
    marginVertical: 5,
  },
});

export default HomeView;
