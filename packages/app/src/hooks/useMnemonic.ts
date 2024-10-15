import { getMnemonicAndKeys } from '@/lib/key';
import { useEffect, useState } from 'react';
import useSignedInUser from './useSignedInUser';

const useMnemonic = () => {
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const { data: signedInUser } = useSignedInUser();

  useEffect(() => {
    (async () => {
      if (signedInUser) {
        const { mnemonic: _mnemonic } = await getMnemonicAndKeys();
        if (_mnemonic) {
          setMnemonic(_mnemonic);
        } else {
          throw new Error('Mnemonic not found');
        }
      }
    })();
  }, [signedInUser]);

  return mnemonic;
};

export default useMnemonic;
