import { theme } from '@/lib/theme';
import { View } from 'react-native';

export default function Home() {
  return (
    <View
      style={{
        backgroundColor: theme.background,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
      }}
    ></View>
  );
}
