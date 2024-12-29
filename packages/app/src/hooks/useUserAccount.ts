import { Hex } from 'viem';
import { useEffect, useState } from 'react';
import { getUserAddresses } from '@/lib/key';

const useUserAccount = () => {
  const [userAccount, setUserAccount] = useState<{
    address: Hex;
    singerAddress: Hex;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const singerAddresses = await getUserAddresses();

      if (singerAddresses.length === 0) {
        setUserAccount(null);
        setIsLoading(false);
        return;
      }

      const singerAddress = singerAddresses[0].address;

      setUserAccount({
        address: singerAddress,
        singerAddress,
      });
      setIsLoading(false);
    };

    init();
  }, []);

  return {
    data: userAccount,
    isLoading,
  };
};

export default useUserAccount;
