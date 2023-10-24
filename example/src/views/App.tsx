import React, { useState, useEffect } from 'react';
import { View, TextInput, Button } from 'react-native';
import { useCloudFile } from 'react-native-cloud-storage';

const App = () => {
  const { write, content } = useCloudFile('/backup.json');
  const [input, setInput] = useState(content ?? '');

  useEffect(() => {
    setInput(content ?? '');
  }, [content]);

  return (
    <View>
      <TextInput value={input} onChangeText={setInput} />
      <Button title="Write to file" onPress={() => write(input)} />
    </View>
  );
};

export default App;
