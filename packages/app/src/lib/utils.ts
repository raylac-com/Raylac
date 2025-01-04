import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { Hex } from 'viem';
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
