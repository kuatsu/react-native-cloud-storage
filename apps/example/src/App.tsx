import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import HomeView from './views/Home';

const App = () => {
  return (
    <SafeAreaProvider>
      <HomeView />
    </SafeAreaProvider>
  );
};

export default App;
