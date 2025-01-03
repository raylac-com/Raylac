import { getMnemonic } from '@/lib/key';
import { useEffect, useState } from 'react';
import useGenesisAddress from './useGenesisAddress';

const useMnemonic = () => {
  const { data: genesisAddress } = useGenesisAddress();
  const [mnemonic, setMnemonic] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (genesisAddress) {
        const _mnemonic = await getMnemonic(genesisAddress.address);
        if (_mnemonic) {
          setMnemonic(_mnemonic);
        } else {
          throw new Error('Mnemonic not found');
        }
      }
    })();
  }, []);

  return { mnemonic };
};

export default useMnemonic;
