import React, { useState, useEffect } from 'react';

import { StyleSheet, View, Text, Button, TextInput, Dimensions, ActivityIndicator } from 'react-native';
import RNCloudStorage, { StorageScope } from 'react-native-cloud-storage';

const App = () => {
  const [filename, setFilename] = useState('test.txt');
  const [scope, setScope] = useState(StorageScope.Documents);
  const [exists, setExists] = useState(false);
  const [input, setInput] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    RNCloudStorage.setGoogleDriveAccessToken(accessToken);
  }, [accessToken]);

  useEffect(() => {
    setExists(false);
    setInput('');
  }, [filename, scope]);

  const readFile = async () => {
    setLoading(true);
    try {
      if (await RNCloudStorage.exists(filename, scope)) {
        setExists(true);
        setInput(await RNCloudStorage.readFile(filename, scope));
      } else {
        setExists(false);
        setInput('');
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setLoading(true);
    await RNCloudStorage.writeFile(filename, input, scope).catch(() => setLoading(false));
    readFile();
  };

  const handleRead = readFile;

  const handleDelete = async () => {
    setLoading(true);
    await RNCloudStorage.unlink(filename, scope).catch(() => setLoading(false));
    readFile();
  };

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
      <TextInput placeholder="Filename" value={filename} onChangeText={setFilename} style={styles.input} />
      <Button
        title={`Switch to ${scope === StorageScope.Documents ? 'App Data' : 'Documents'}`}
        onPress={() => setScope(scope === StorageScope.Documents ? StorageScope.Hidden : StorageScope.Documents)}
      />
      <Text>Test file exists: {exists ? 'yes' : 'no'}</Text>
      <TextInput placeholder="File contents (read/write)" value={input} onChangeText={setInput} style={styles.input} />
      <Button title="Write file" onPress={handleCreate} />
      <Button title="Read file" onPress={handleRead} />
      <Button title="Delete file" onPress={handleDelete} />
      <TextInput
        placeholder="Google Drive access token"
        value={accessToken}
        onChangeText={setAccessToken}
        style={styles.input}
      />
    </View>
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
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: 60,
    height: 60,
    marginVertical: 20,
  },
  input: {
    width: Dimensions.get('window').width - 40,
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    marginVertical: 20,
    paddingHorizontal: 10,
  },
});

export default App;
