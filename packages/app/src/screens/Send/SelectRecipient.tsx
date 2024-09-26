import { FlatList, Pressable, Text, View } from 'react-native';
import { useCallback, useEffect, useState } from 'react';
import { trpc } from '@/lib/trpc';
import StyledTextInput from '@/components/StyledTextInput';
import { RouterOutput } from '@/types';
import { theme } from '@/lib/theme';
import { RootStackParamsList } from '@/navigation/types';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import useSignedInUser from '@/hooks/useSignedInUser';
import FastAvatar from '@/components/FastAvatar';
import { publicKeyToAddress } from 'viem/accounts';
import { Hex, isAddress } from 'viem';
import { useTranslation } from 'react-i18next';
import { shortenAddress } from '@/lib/utils';
// import useEnsName from '@/hooks/useEnsName';

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
        imageUrl={props.user.profileImage}
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

interface AddressListItemProps {
  address: Hex;
  onPress: () => void;
}

const AddressListItem = (props: AddressListItemProps) => {
  const { onPress, address } = props;

  // const { data: ensName } = useEnsName(address);

  return (
    <Pressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.1)',
        columnGap: 12,
        marginBottom: 16,
      }}
    >
      <FastAvatar address={address} size={36}></FastAvatar>
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
          {shortenAddress(address)}
        </Text>
      </View>
    </Pressable>
  );
};

/*
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
*/

type Props = NativeStackScreenProps<RootStackParamsList, 'SelectRecipient'>;

const SelectRecipient = ({ navigation }: Props) => {
  const { t } = useTranslation('SelectRecipient');
  const { data: users } = trpc.getUsers.useQuery();
  const [searchInput, setSearchInput] = useState('');
  const { data: signedInUser } = useSignedInUser();

  const [inputAddress, setInputAddress] = useState<Hex | null>(null);

  // Search user and generate a new stealth address for them

  const onUserClick = useCallback(
    async (user: RouterOutput['getUsers'][number]) => {
      navigation.navigate('EnterSendAmount', {
        recipientUserOrAddress: user,
      });
    },
    []
  );

  useEffect(() => {
    if (isAddress(searchInput)) {
      setInputAddress(searchInput);
    } else {
      setInputAddress(null);
    }
  }, [searchInput]);

  console.log({ inputAddress });

  const usersToRender = users
    ?.filter(
      user =>
        user.name.includes(searchInput) || user.username.includes(searchInput)
    )
    .filter(user => user.id !== signedInUser?.id);

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
        value={searchInput}
        placeholder={t('searchUser')}
        containerStyle={{
          marginTop: 12,
          width: '80%',
        }}
        onChangeText={setSearchInput}
      ></StyledTextInput>
      {inputAddress && (
        <View
          style={{
            width: '80%',
            marginTop: 24,
          }}
        >
          <AddressListItem
            address={inputAddress}
            onPress={() => {
              navigation.navigate('EnterSendAmount', {
                recipientUserOrAddress: inputAddress,
              });
            }}
          ></AddressListItem>
        </View>
      )}
      <FlatList
        style={{
          marginTop: 24,
          width: '80%',
        }}
        data={usersToRender}
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
        {
          /**
            <FloatingScanButton></FloatingScanButton>
          */
        }
    </View>
  );
};

export default SelectRecipient;
