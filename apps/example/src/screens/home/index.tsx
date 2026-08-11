import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  CloudKVStorage,
  CloudStorage,
  CloudStorageProvider,
  CloudStorageScope,
  useIsCloudAvailable,
} from 'react-native-cloud-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import HomeConfigurationCard from './home-configuration-card';
import HomeFileOperationsCard from './home-file-operations-card';
import HomeKVOperationsCard from './home-kv-operations-card';
import HomeWorkingDirectoryCard from './home-working-directory-card';

const HomeView = () => {
  const [provider, setProvider] = useState(CloudStorage.getDefaultProvider());
  const [scope, setScope] = useState(CloudStorageScope.AppData);
  const [parentDirectory, setParentDirectory] = useState('/');
  const [directoryRevision, setDirectoryRevision] = useState(0);
  const [accessToken, setAccessToken] = useState('');
  const [loading, setLoading] = useState(false);

  const cloudStorage = useMemo(() => {
    return new CloudStorage(
      provider,
      provider === CloudStorageProvider.GoogleDrive ? { strictFilenames: true } : undefined
    );
  }, [provider]);
  const cloudKVStorage = useMemo(() => {
    return new CloudKVStorage(
      provider,
      provider === CloudStorageProvider.GoogleDrive
        ? { accessToken: accessToken.length > 0 ? accessToken : null, kvPollInterval: 5000 }
        : undefined
    );
  }, [accessToken, provider]);

  const cloudAvailable = useIsCloudAvailable(cloudStorage);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    console.log(cloudAvailable ? 'Cloud storage available' : 'Cloud storage not available');
  }, [cloudAvailable]);

  useEffect(() => {
    if (cloudStorage.getProvider() !== CloudStorageProvider.GoogleDrive) return;
    cloudStorage.setProviderOptions({ accessToken: accessToken.length > 0 ? accessToken : null });
  }, [accessToken, cloudStorage]);

  useEffect(() => {
    cloudStorage.setProviderOptions({ scope });
  }, [scope, cloudStorage]);

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator />
        </View>
      )}
      <Text style={styles.title}>RNCloudStorage{`\n`}Example App</Text>
      <HomeConfigurationCard
        accessToken={accessToken}
        cloudAvailable={cloudAvailable}
        provider={provider}
        scope={scope}
        onAccessTokenChange={setAccessToken}
        onProviderChange={setProvider}
        onScopeChange={setScope}
      />
      <HomeWorkingDirectoryCard
        cloudStorage={cloudStorage}
        parentDirectory={parentDirectory}
        onDirectoryDeleted={() => setDirectoryRevision((revision) => revision + 1)}
        onLoadingChange={setLoading}
        onParentDirectoryChange={setParentDirectory}
      />
      <HomeFileOperationsCard
        cloudStorage={cloudStorage}
        directoryRevision={directoryRevision}
        parentDirectory={parentDirectory}
        scope={scope}
        onLoadingChange={setLoading}
      />
      <HomeKVOperationsCard
        enabled={provider !== CloudStorageProvider.GoogleDrive || accessToken.length > 0}
        provider={provider}
        storage={cloudKVStorage}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5FCFF',
    paddingHorizontal: 20,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    margin: 10,
    textAlign: 'center',
  },
});

export default HomeView;
