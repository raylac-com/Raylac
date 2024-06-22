import useSignUp from '@/hooks/useSignUp';
import { theme } from '@/lib/theme';
import { View, Button } from 'react-native';

export default function SignUp() {
  const { signUp } = useSignUp();

  return (
    <View
      style={{
        backgroundColor: theme.background,
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
      }}
    >
      <Button
        onPress={async () => {
          await signUp();
        }}
        title="Sign up"
        color={theme.secondary}
      ></Button>
    </View>
  );
}
