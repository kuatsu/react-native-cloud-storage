import React from 'react';
import { Platform, StyleSheet, Text, TextInput } from 'react-native';
import { CloudStorageProvider, CloudStorageScope } from 'react-native-cloud-storage';
import Button from '../../components/button';
import Card from '../../components/card';

interface HomeConfigurationCardProps {
  accessToken: string;
  cloudAvailable: boolean;
  provider: CloudStorageProvider;
  scope: CloudStorageScope;
  onAccessTokenChange: (accessToken: string) => void;
  onProviderChange: (provider: CloudStorageProvider) => void;
  onScopeChange: (scope: CloudStorageScope) => void;
}

const HomeConfigurationCard: React.FC<HomeConfigurationCardProps> = ({
  accessToken,
  cloudAvailable,
  provider,
  scope,
  onAccessTokenChange,
  onProviderChange,
  onScopeChange,
}) => {
  return (
    <Card title="Configuration">
      <Text>
        <Text style={styles.label}>Cloud storage available:</Text> {cloudAvailable ? '✅ Yes' : '❌ No'}
      </Text>
      <Text style={styles.row}>
        <Text style={styles.label}>Provider:</Text>{' '}
        {provider === CloudStorageProvider.ICloud ? 'iCloud' : 'Google Drive'}
      </Text>
      {Platform.OS === 'ios' && (
        <Button
          title={`Switch to ${provider === CloudStorageProvider.ICloud ? 'Google Drive' : 'iCloud'} provider`}
          onPress={() =>
            onProviderChange(
              provider === CloudStorageProvider.ICloud ? CloudStorageProvider.GoogleDrive : CloudStorageProvider.ICloud
            )
          }
        />
      )}
      <Text style={styles.row}>
        <Text style={styles.label}>Directory Scope:</Text>{' '}
        {scope === CloudStorageScope.Documents ? 'Documents' : 'App Data'}
      </Text>
      <Button
        title={`Switch to ${scope === CloudStorageScope.Documents ? 'App Data' : 'Documents'} scope`}
        onPress={() =>
          onScopeChange(scope === CloudStorageScope.Documents ? CloudStorageScope.AppData : CloudStorageScope.Documents)
        }
      />
      {provider === CloudStorageProvider.GoogleDrive && (
        <>
          <Text style={[styles.label, styles.row]}>Access Token</Text>
          <TextInput
            placeholder="Google Drive access token"
            value={accessToken}
            onChangeText={onAccessTokenChange}
            style={styles.input}
          />
        </>
      )}
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
  },
  row: {
    marginTop: 10,
  },
});

export default HomeConfigurationCard;
