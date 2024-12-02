import { TextInput, View } from 'react-native';

const Swap = () => {
  return (
    <View style={{ flex: 1, flexDirection: 'column' }}>
      <TextInput placeholder="Enter amount" />
      <TextInput placeholder="Enter amount" />
    </View>
  );
};

export default Swap;
