import useSignIn from '@/hooks/useSignIn';
import useSignUp from '@/hooks/useSignUp';
import { theme } from '@/lib/theme';
import { View, Button } from 'react-native';

export default function SignIn() {
  const { signIn } = useSignIn();
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
          await signIn();
        }}
        title="Sign in"
        color={theme.primary}
      ></Button>
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
