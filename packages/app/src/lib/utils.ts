import { Hex } from 'viem';
import * as Clipboard from 'expo-clipboard';

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

export const getSingedInUserAddress = () => {
  return '0x400EA6522867456E988235675b9Cb5b1Cf5b79C8' as Hex;
};
