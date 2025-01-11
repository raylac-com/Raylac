import { getPrivateKey } from '@/lib/key';
import { useEffect, useState } from 'react';
import { Hex } from 'viem';

const useLoadPrivateKey = (address: Hex) => {
  const [privateKey, setPrivateKey] = useState<string | null>(null);

  useEffect(() => {
    setPrivateKey(null);
  }, []);

  const loadPrivateKey = async () => {
    const _privateKey = await getPrivateKey(address);
    if (_privateKey) {
      setPrivateKey(_privateKey);
    } else {
      throw new Error('Private key not found');
    }
  };

  const hidePrivateKey = () => {
    setPrivateKey(null);
  };

  return { privateKey, loadPrivateKey, hidePrivateKey };
};

export default useLoadPrivateKey;
