import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Hex, parseUnits } from 'viem';
import * as Clipboard from 'expo-clipboard';
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  zksync,
} from 'viem/chains';
import { Platform } from 'react-native';
import { TokenAmount } from '@raylac/shared';

export const shortenAddress = (address: Hex) => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const copyToClipboard = async (text: string) => {
  await Clipboard.setStringAsync(text);
};

export const getClipboardText = async () => {
  const text = await Clipboard.getStringAsync();
  return text;
};

export const getChainIcon = (chainId: number) => {
  switch (chainId) {
    case mainnet.id:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../../assets/chains/ethereum.png');
    case optimism.id:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../../assets/chains/op.png');
    case base.id:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../../assets/chains/base.png');
    case arbitrum.id:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../../assets/chains/arbitrum.png');
    case polygon.id:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../../assets/chains/polygon.png');
    case zksync.id:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../../assets/chains/zksync.png');
    default:
      return null;
  }
};

export const hapticOptions = {
  enableVibrateFallback: true,
  ignoreAndroidSystemSettings: false,
};

export const triggerHapticFeedback = () => {
  if (Platform.OS === 'ios') {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  }
};

export const MOCK_TOKEN_AMOUNT: TokenAmount = {
  amount: parseUnits('0.1', 18).toString(),
  formatted: '0.1',
  tokenPriceUsd: 1,
  usdValue: '0.1',
  usdValueFormatted: '0.1',
};
