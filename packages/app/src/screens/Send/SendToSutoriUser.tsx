import useSend from '@/hooks/useSend';
import { useMutation } from '@tanstack/react-query';
import { Pressable, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { parseUnits } from 'viem';
import { trpc } from '@/lib/trpc';
import StyledTextInput from '@/components/StyledTextInput';
import StyledButton from '@/components/StyledButton';
import AntDesign from '@expo/vector-icons/AntDesign';
import { RouterOutput } from '@/types';
import FastAvatar from '@/components/FastAvatar';
import { FontAwesome } from '@expo/vector-icons';

interface UserListItemProps {
  user: RouterOutput['getUsers'][number];
}

const UserListItem = (props: UserListItemProps) => {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        columnGap: 8,
      }}
    >
      <FontAwesome name="user-circle-o" size={40} color="black" />
      <Text
        style={{
          fontSize: 16,
        }}
      >
        {props.user.name}
      </Text>
    </View>
  );
};

const FloatingScanButton = () => {
  return (
    <Pressable
      style={{
        position: 'absolute',
        bottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AntDesign name="scan1" size={24} />
      <Text>Scan QR</Text>
    </Pressable>
  );
};

const SendToSutoriUser = () => {
  const { mutateAsync: send } = useSend();
  const [recipientAddress, setRecipientAddress] = useState('');
  const { data: users } = trpc.getUsers.useQuery();
  const [username, setUsername] = useState('');

  // Search user and generate a new stealth address for them

  const onUserClick = useCallback(
    async (user: RouterOutput['getUsers'][number]) => {
      /*
      await send({
        recipient: user.publicKey,
        amount: parseUnits('0.01', 'ether'),
      });
      */
    },
    [send]
  );

  return (
    <View
      style={{
        flex: 1,
        position: 'relative',
        alignItems: 'center',
      }}
    >
      <StyledTextInput
        value={username}
        placeholder="Search by username"
        style={{
          width: 300,
        }}
        onChangeText={setUsername}
      ></StyledTextInput>
      <View
        style={{
          flexDirection: 'column',
          width: 300,
        }}
      >
        {users
          ?.filter(user => user.name.includes(username))
          .map(user => <UserListItem key={user.id} user={user} />)}
      </View>
      <FloatingScanButton></FloatingScanButton>
    </View>
  );
};

export default SendToSutoriUser;
