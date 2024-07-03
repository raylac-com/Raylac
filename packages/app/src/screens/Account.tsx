import useSignedInUser from '@/hooks/useSignInUser';
import { Text, View } from 'react-native';

const Account = () => {
  const { data: user } = useSignedInUser();

  if (!user) {
    return null;
  }

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: 24,
      }}
    >
      <Text
        style={{
          fontSize: 24,
        }}
      >
        {user.name}
      </Text>
      <Text
        style={{
          marginTop: 8,
          opacity: 0.5,
        }}
      >
        @{user.username}
      </Text>
    </View>
  );
};

export default Account;
