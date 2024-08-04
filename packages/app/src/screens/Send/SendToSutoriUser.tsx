import useSend from '@/hooks/useSend';
import { FlatList, Pressable, Text, View } from 'react-native';
import { useCallback, useState } from 'react';
import { trpc } from '@/lib/trpc';
import StyledTextInput from '@/components/StyledTextInput';
import AntDesign from '@expo/vector-icons/AntDesign';
import { RouterOutput } from '@/types';
import { theme } from '@/lib/theme';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import useSignedInUser from '@/hooks/useSignedInUser';
import FastAvatar from '@/components/FastAvatar';
import { publicKeyToAddress } from 'viem/accounts';
import { Hex } from 'viem';
import { useTranslation } from 'react-i18next';

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
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        columnGap: 12,
        marginBottom: 16,
      }}
    >
      <FastAvatar
        address={publicKeyToAddress(props.user.spendingPubKey as Hex)}
        size={36}
      ></FastAvatar>
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'flex-end',
          columnGap: 4,
        }}
      >
        <Text
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.text,
          }}
        >
          {props.user.name}
        </Text>
        <Text
          style={{
            fontSize: 14,
            opacity: 0.6,
            color: theme.text,
          }}
        >
          @{props.user.username}
        </Text>
      </View>
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
  const { t } = useTranslation('SendToSutoriUser');
  const { mutateAsync: send } = useSend();
  const { data: users } = trpc.getUsers.useQuery();
  const [username, setUsername] = useState('');
  const { data: signedInUser } = useSignedInUser();

  // Search user and generate a new stealth address for them

  const onUserClick = useCallback(
    async (user: RouterOutput['getUsers'][number]) => {
      navigation.navigate('EnterSendAmount', {
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
        width: '100%',
      }}
    >
      <StyledTextInput
        value={username}
        placeholder={t('searchUser')}
        containerStyle={{
          marginTop: 12,
          width: '80%',
        }}
        onChangeText={setUsername}
      ></StyledTextInput>
      <FlatList
        style={{
          marginTop: 24,
          width: '80%',
        }}
        data={users
          ?.filter(user => user.name.includes(username))
          .filter(user => user.id !== signedInUser?.id)}
        renderItem={({ item }) => (
          <UserListItem
            onPress={() => {
              onUserClick(item);
            }}
            key={item.id}
            user={item}
          />
        )}
      ></FlatList>
      <FloatingScanButton></FloatingScanButton>
    </View>
  );
};

export default SendToSutoriUser;
