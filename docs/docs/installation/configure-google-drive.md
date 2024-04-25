---
sidebar_position: 3
---

# Configure Google Drive API

:::caution

Please note that filenames are not unique in Google Drive. There can be multiple files with the same name within the same directory (even files and directories sharing the same name). By default, the library will not throw any errors when there are multiple files with the same name detected, but instead default to the first file found. However, this might be problematic when working with the [`CloudStorageScope.Documents` scope](../api/enums/CloudStorageScope). Please [see here](../guides/google-drive-files-same-name) for more info.

:::

:::info

Be aware that all file operations on Google Drive will take severely more time than on iCloud. This is because iCloud is implemented using a direct native API (CloudKit) while Google Drive is implemented using the HTTP REST API. A file read operation that might only take a split second on iCloud might take several seconds on Google Drive.

:::

While iCloud for iOS devices works out of the box, Google Drive support requires some additional setup. Specifically, you will need to get and provide an access token for the Google Drive API. This module does **not** provide any way of acquiring such a token from the user, as it is out of scope.

You therefore need to acquire the token with another library. Popular choices are [`@react-native-google-signin/google-signin`](https://github.com/react-native-google-signin/google-signin) and [`expo-auth-session`](https://docs.expo.dev/guides/google-authentication/). Whatever you do, you will also need a Google OAuth client ID in order to make authentication requests. The linked Expo module has good documentation on this topic. When creating this client ID, make sure to request at least the `https://www.googleapis.com/auth/drive.appdata` scope. This will allow you to use the [`CloudStorageScope.AppData`](../api/enums/CloudStorageScope) scope of this library. If you also want to access `CloudStorageScope.Documents`, you will also require the `https://www.googleapis.com/auth/drive` scope, which is a restricted Google API scope. This means your app needs to be audited in order to use it. For more documentation on this matter, consult the [Google documentation](https://developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification).

Once you have acquired an access token from the user, you will need to provide it to the library:

```ts
import { CloudStorage, CloudStorageProvider } from 'react-native-cloud-storage';
CloudStorage.setProviderOptions(CloudStorageProvider.GoogleDrive, { accessToken: 'some_access_token' });
```

Below is a more practical example of how this could look in action using the Expo AuthSession API:

```tsx
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { CloudStorage, CloudStorageProvider, CloudStorageScope } from 'react-native-cloud-storage';

WebBrowser.maybeCompleteAuthSession();

const App: React.FC = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    // if you're also deploying to web, uncomment the next line
    // webClientId: 'GOOGLE_GUID.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.appdata'],
  });

  useEffect(() => {
    if (response?.type === 'success') {
      setAccessToken(response.authentication.accessToken);
    }

    if (accessToken) {
      CloudStorage.setProviderOptions(CloudStorageProvider.GoogleDrive, { accessToken });
    }
  }, [response, accessToken]);

  const writeFileAsync = () => {
    return CloudStorage.writeFile('test.txt', 'Hello World', CloudStorageScope.AppData);
  };

  return (
    <View style={styles.container}>
      {CloudStorage.getProvider() === CloudStorageProvider.GoogleDrive && accessToken === null ? (
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
});
```

Ultimately, you are responsible for acquiring and potentially refreshing the access token. Do note however, that this process only needs to be done when Google Drive is used and is not required on other providers such as iCloud.
