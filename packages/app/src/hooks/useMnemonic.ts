import { getMnemonic } from '@/lib/key';
import { useEffect, useState } from 'react';
import { Hex } from 'viem/_types/types/misc';

const useMnemonic = (address: Hex) => {
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const _mnemonic = await getMnemonic(address);
      if (_mnemonic) {
        setMnemonic(_mnemonic);
      } else {
        throw new Error('Mnemonic not found');
      }
    })();
  }, []);

  return { mnemonic };
};

export default useMnemonic;
