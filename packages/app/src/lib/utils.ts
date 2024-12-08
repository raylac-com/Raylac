import { Hex } from 'viem';
import * as Clipboard from 'expo-clipboard';
import { base, optimism } from 'viem/chains';

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
    case optimism.id:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../../assets/chains/op.png');
    case base.id:
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require('../../assets/chains/base.png');
    default:
      return null;
  }
};
