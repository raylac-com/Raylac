import { theme } from '@/lib/theme';
import { Linking, Text } from 'react-native';

interface LinkTextProps {
  url: string;
  text: string;
}

const LinkText = (props: LinkTextProps) => {
  const { url } = props;
  return (
    <Text
      style={{
        color: theme.primary,
        textDecorationLine: 'underline',
      }}
      onPress={() => {
        // Navigate to the explorer page for the address
        Linking.openURL(url);
      }}
    >
      {props.text}
    </Text>
  );
};

export default LinkText;
