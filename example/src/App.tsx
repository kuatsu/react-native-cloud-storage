import React, { useState, useEffect } from 'react';

import { StyleSheet, View, Text, Button, TextInput, Dimensions } from 'react-native';
import RNCloudStorage, { StorageScope } from 'react-native-cloud-storage';

const App = () => {
  const [exists, setExists] = useState(false);
  const [input, setInput] = useState('');
  const [accessToken, setAccessToken] = useState('');

  useEffect(() => {
    readFile();
  }, []);

  useEffect(() => {
    RNCloudStorage.setGoogleDriveAccessToken(accessToken);
  }, [accessToken]);

  const readFile = async () => {
    try {
      if (await RNCloudStorage.exists('test.txt', StorageScope.Documents)) {
        setExists(true);
        setInput(await RNCloudStorage.readFile('test.txt', StorageScope.Documents));
      } else {
        setExists(false);
        setInput('');
      }
    } catch (e) {
      console.log(e);
    }
  };

  const handleCreate = async () => {
    await RNCloudStorage.writeFile('test.txt', input, StorageScope.Documents);
    readFile();
  };

  const handleRead = readFile;

  const handleDelete = async () => {
    await RNCloudStorage.unlink('test.txt', StorageScope.Documents);
    readFile();
  };

  return (
    <View style={styles.container}>
      <Text>Test file exists: {exists ? 'yes' : 'no'}</Text>
      <TextInput placeholder="File contents (read/write)" value={input} onChangeText={setInput} style={styles.input} />
      <Button title="Create file" onPress={handleCreate} />
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
