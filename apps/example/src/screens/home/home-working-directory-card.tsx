import React from 'react';
import { Alert, StyleSheet, Text, TextInput } from 'react-native';
import { CloudStorage } from 'react-native-cloud-storage';
import Button from '../../components/button';
import Card from '../../components/card';

interface HomeWorkingDirectoryCardProps {
  cloudStorage: CloudStorage;
  parentDirectory: string;
  onDirectoryDeleted: () => void;
  onLoadingChange: (loading: boolean) => void;
  onParentDirectoryChange: (parentDirectory: string) => void;
}

const HomeWorkingDirectoryCard: React.FC<HomeWorkingDirectoryCardProps> = ({
  cloudStorage,
  parentDirectory,
  onDirectoryDeleted,
  onLoadingChange,
  onParentDirectoryChange,
}) => {
  const checkDirectoryExists = async () => {
    onLoadingChange(true);
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
      onLoadingChange(false);
    }
  };

  const createDirectory = async () => {
    onLoadingChange(true);
    try {
      await cloudStorage.mkdir(parentDirectory);
      Alert.alert('Directory created', `${parentDirectory} was created successfully.`);
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const listContents = async () => {
    onLoadingChange(true);
    try {
      const contents = await cloudStorage.readdir(parentDirectory);
      Alert.alert('Directory contents', contents.map((entry) => `• ${entry}`).join('\n'));
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const deleteDirectory = async (recursive: boolean) => {
    onLoadingChange(true);
    try {
      await cloudStorage.rmdir(parentDirectory, { recursive });
      onDirectoryDeleted();
    } catch (error) {
      console.warn(error);
    } finally {
      onLoadingChange(false);
    }
  };

  const confirmDeleteDirectory = () => {
    Alert.alert('Delete directory', 'Do you want to delete the directory and all its contents (recursively)?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Directory only', onPress: () => void deleteDirectory(false) },
      { text: 'Recursively', onPress: () => void deleteDirectory(true) },
    ]);
  };

  return (
    <Card title="Working Directory">
      <Text style={styles.label}>Parent directory</Text>
      <TextInput
        placeholder="Parent directory"
        value={parentDirectory}
        onChangeText={onParentDirectoryChange}
        style={styles.input}
      />
      <Button title="Check if exists" onPress={() => void checkDirectoryExists()} />
      <Button title="Create this directory" onPress={() => void createDirectory()} />
      <Text style={styles.smallText}>Before performing any file operations, the parent directory must exist.</Text>
      <Button title="List contents of directory" onPress={() => void listContents()} />
      <Button title="Delete directory" onPress={confirmDeleteDirectory} />
    </Card>
  );
};

const styles = StyleSheet.create({
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
  },
});

export default HomeWorkingDirectoryCard;
