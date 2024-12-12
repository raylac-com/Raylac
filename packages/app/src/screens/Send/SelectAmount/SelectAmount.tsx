import Blockie from '@/components/Blockie/Blockie';
import SelectChainSheet from '@/components/SelectChainSheet/SelectChainSheet';
import StyledButton from '@/components/StyledButton/StyledButton';
import StyledText from '@/components/StyledText/StyledText';
import useTypedNavigation from '@/hooks/useTypedNavigation';
import colors from '@/lib/styles/colors';
import fontSizes from '@/lib/styles/fontSizes';
import { getChainIcon, shortenAddress } from '@/lib/utils';
import { RootStackParamsList } from '@/navigation/types';
import { getChainFromId } from '@raylac/shared';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { Chain, formatUnits } from 'viem';
import Entypo from '@expo/vector-icons/Entypo';
import useTokenBalance from '@/hooks/useTokenBalance';
import useTokenPriceUsd from '@/hooks/useTokenPriceUsd';
import BigNumber from 'bignumber.js';

const AmountInput = ({
  amount,
  setAmount,
  postfix,
}: {
  amount: string;
  setAmount: (amount: string) => void;
  postfix: string;
}) => {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}>
      <TextInput
        keyboardType="numeric"
        value={amount}
        autoFocus
        onChangeText={setAmount}
        placeholder={'0.00'}
        style={{
          fontSize: fontSizes.twoXLarge,
          flexShrink: 1,
          width: '100%',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 16,
          height: 56,
          paddingHorizontal: 16,
        }}
        numberOfLines={1}
      />
      <StyledText
        style={{ fontSize: fontSizes.twoXLarge, color: colors.border }}
      >
        {postfix}
      </StyledText>
    </View>
  );
};

type Props = Pick<
  NativeStackScreenProps<RootStackParamsList, 'SelectAmount'>,
  'route'
>;

const SelectAmount = ({ route }: Props) => {
  const navigation = useTypedNavigation();
  const address = route.params.address;
  const token = route.params.token;

  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [usdAmount, setUsdAmount] = useState<string>('');

  const [selectedChain, setSelectedChain] = useState<Chain>(
    getChainFromId(token.addresses[0].chainId)
  );

  const [isSelectChainSheetOpen, setIsSelectChainSheetOpen] =
    useState<boolean>(false);

  const { data: tokenBalance } = useTokenBalance(token);
  const { data: tokenPriceUsd } = useTokenPriceUsd(token);

  const formattedTokenBalance = tokenBalance
    ? formatUnits(tokenBalance, token.decimals)
    : undefined;

  const tokenBalanceUsd =
    formattedTokenBalance && tokenPriceUsd
      ? new BigNumber(formattedTokenBalance)
          .multipliedBy(tokenPriceUsd)
          .toFixed(2)
      : undefined;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ flex: 1, padding: 16, rowGap: 20 }}>
        <AmountInput
          amount={tokenAmount}
          setAmount={setTokenAmount}
          postfix={token.symbol}
        />
        <View
          style={{
            flexDirection: 'column',
            alignItems: 'flex-end',
            rowGap: 8,
          }}
        >
          <AmountInput
            amount={usdAmount}
            setAmount={setUsdAmount}
            postfix={'USD'}
          />
          <StyledText
            style={{ color: colors.border }}
          >{`Balance $${tokenBalanceUsd}`}</StyledText>
        </View>
        <View
          style={{
            flexDirection: 'column',
            rowGap: 14,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 16,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              columnGap: 4,
            }}
          >
            <Blockie address={address} size={24} />
            <StyledText>{`${shortenAddress(address)} receives on `}</StyledText>
          </View>
          <Pressable
            style={{ flexDirection: 'row', alignItems: 'center', columnGap: 4 }}
            onPress={() => setIsSelectChainSheetOpen(true)}
          >
            <Image
              style={{ width: 24, height: 24 }}
              source={getChainIcon(selectedChain.id)}
            />
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                columnGap: 0,
              }}
            >
              <StyledText>{`${selectedChain.name}`}</StyledText>
              <Entypo
                name="chevron-small-down"
                size={24}
                color={colors.border}
              />
            </View>
          </Pressable>
        </View>
        <StyledButton
          title="Next"
          onPress={() => {
            navigation.navigate('ConfirmSend', {
              address,
              amount: tokenAmount,
              token,
              outputChainId: selectedChain.id,
            });
          }}
        />
      </View>
      {isSelectChainSheetOpen && (
        <SelectChainSheet
          onSelect={chain => {
            setSelectedChain(chain);
            setIsSelectChainSheetOpen(false);
          }}
          onClose={() => setIsSelectChainSheetOpen(false)}
        />
      )}
    </View>
  );
};

export default SelectAmount;
