import * as React from 'react';

import { StyleSheet, View, Text, Button, TextInput } from 'react-native';
import RNCloudStorage, { StorageScope } from 'react-native-cloud-storage';

const cloudStorage = new RNCloudStorage();

export default function App() {
  const [exists, setExists] = React.useState(false);
  const [input, setInput] = React.useState('');

  React.useEffect(() => {
    cloudStorage.fileExists('test.txt', StorageScope.Visible).then(setExists);
  }, []);

  const handleCreate = () => {
    cloudStorage.createFile('test.txt', input, StorageScope.Visible, true).then(() => {
      setInput('');
      cloudStorage.fileExists('test.txt', StorageScope.Visible).then(setExists);
    });
  };

  const handleRead = () => {
    cloudStorage.readFile('test.txt', StorageScope.Visible).then(setInput);
  };

  return (
    <View style={styles.container}>
      <Text>Test file exists: {exists ? 'yes' : 'no'}</Text>
      <TextInput value={input} onChangeText={setInput} style={styles.input} />
      <Button title="Create file" onPress={handleCreate} />
      <Button title="Read file" onPress={handleRead} />
    </View>
  );
}

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
    width: 200,
    height: 40,
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 4,
    marginVertical: 20,
    paddingHorizontal: 10,
  },
});
