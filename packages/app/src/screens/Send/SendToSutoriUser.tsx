import useSend from '@/hooks/useSend';
import { Pressable, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { trpc } from '@/lib/trpc';
import StyledTextInput from '@/components/StyledTextInput';
import AntDesign from '@expo/vector-icons/AntDesign';
import { RouterOutput } from '@/types';
import { FontAwesome } from '@expo/vector-icons';
import { theme } from '@/lib/theme';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import useSignedInUser from '@/hooks/useSignedInUser';

interface UserListItemProps {
  user: RouterOutput['getUsers'][number];
  onPress: () => void;
}

const UserListItem = (props: UserListItemProps) => {
  return (
    <Pressable
      onPress={props.onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        columnGap: 8,
      }}
    >
      <FontAwesome name="user-circle-o" size={40} color={theme.primary} />
      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: theme.text,
        }}
      >
        {props.user.name}
      </Text>
    </Pressable>
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

type Props = NativeStackScreenProps<RootStackParamsList, 'SendToSutoriUser'>;

const SendToSutoriUser = ({ navigation }: Props) => {
  const { mutateAsync: send } = useSend();
  const { data: users } = trpc.getUsers.useQuery();
  const [username, setUsername] = useState('');
  const { data: signedInUser } = useSignedInUser();

  // Search user and generate a new stealth address for them

  const onUserClick = useCallback(
    async (user: RouterOutput['getUsers'][number]) => {
      navigation.navigate("EnterSendAmount", {
        recipientUserOrAddress: user,
      });
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
          .filter(user => user.id !== signedInUser?.id)
          .map(user => (
            <UserListItem
              onPress={() => {
                onUserClick(user);
              }}
              key={user.id}
              user={user}
            />
          ))}
      </View>
      <FloatingScanButton></FloatingScanButton>
    </View>
  );
};

export default SendToSutoriUser;
