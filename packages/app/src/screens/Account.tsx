import FastAvatar from '@/components/FastAvatar';
import useSignedInUser from '@/hooks/useSignInUser';
import { Text, View } from 'react-native';
import { Hex } from 'viem';
import { publicKeyToAddress } from 'viem/accounts';

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
      <FastAvatar
        address={publicKeyToAddress(user.spendingPubKey as Hex)}
        size={50}
      ></FastAvatar>
      <Text
        style={{
          fontSize: 24,
          marginTop: 12,
        }}
      >
        {user.name}
      </Text>
      <Text
        style={{
          marginTop: 4,
          opacity: 0.5,
        }}
      >
        @{user.username}
      </Text>
    </View>
  );
};

export default Account;
