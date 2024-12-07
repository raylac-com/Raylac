import { getMnemonicAndPrivKey } from '@/lib/key';
import { useEffect, useState } from 'react';
import { Hex } from 'viem/_types/types/misc';

const useMnemonicAndPrivKey = () => {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [privKey, setPrivKey] = useState<Hex | null>(null);

  useEffect(() => {
    (async () => {
      const _mnemonicAndPrivKey = await getMnemonicAndPrivKey();
      if (_mnemonicAndPrivKey) {
        setMnemonic(_mnemonicAndPrivKey.mnemonic);
        setPrivKey(_mnemonicAndPrivKey.privKey);
      } else {
        throw new Error('Mnemonic not found');
      }
    })();
  }, []);

  return { mnemonic, privKey };
};

export default useMnemonicAndPrivKey;
