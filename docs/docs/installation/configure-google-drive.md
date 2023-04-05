---
sidebar_position: 3
---

# Configure Google Drive API

While iCloud for iOS devices works out of the box, Google Drive support requires some additional setup. Specifically, you will need to get and provide an access token for the Google Drive API. This module does **not** provide any way of acquiring such a token from the user, as it is out of scope.

You therefore need to acquire the token with another library. Popular choices are [`@react-native-google-signin/google-signin`](https://github.com/react-native-google-signin/google-signin) and [`expo-auth-session`](https://docs.expo.dev/guides/google-authentication/). Whatever you do, you will also need a Google OAuth client ID in order to make authentication requests. When creating this client ID, make sure to request the following scopes:

- `https://www.googleapis.com/auth/drive`
- `https://www.googleapis.com/auth/drive.appdata`

Once you have acquired an access token from the user, you will need to provide it to the library:

```ts
import RNCloudStorage from 'react-native-cloud-storage';
RNCloudStorage.setGoogleDriveAccessToken(accessToken);
```

The access token is stored globally / statically so that it is valid across the project.

Below is a more practical example of how this could look in action using the Expo AuthSession API:

```tsx
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button, Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import RNCloudStorage, { StorageScope } from 'react-native-cloud-storage';

WebBrowser.maybeCompleteAuthSession();

const App: React.FC = () => {
  const [accessToken, setAccessToken] = useState('');

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setAccessToken(response.authentication.accessToken);
    }

    RNCloudStorage.setGoogleDriveAccessToken(accessToken);
  }, [response, accessToken]);

  const writeFileAsync = () => {
    return RNCloudStorage.writeFile('test.txt', 'Hello World', RNCloudStorage.AppData);
  };

  return (
    <View style={styles.container}>
      {Platform.OS === 'android' && accessToken === null ? (
        <Button
          title="Sign in with Google"
          disabled={!request}
          onPress={() => {
            promptAsync();
          }}
        />
      ) : (
        <Button
          title="Write Hello World to test.txt"
          onPress={() => {
            writeFileAsync();
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
```

In the end, you are responsible for acquiring and potentially refreshing the access token. Do note however, that this process does not need to be done for iOS as iOS will not use the Google Drive REST API but instead fully rely on CloudKit / iCloud.
