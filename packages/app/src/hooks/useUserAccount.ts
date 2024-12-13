import { getUserAddress } from '@/lib/key';
// import { getSenderAddressV2 } from '@raylac/shared';
import { Hex } from 'viem';
import { useEffect, useState } from 'react';

const useUserAccount = () => {
  const [userAccount, setUserAccount] = useState<{
    address: Hex;
    singerAddress: Hex;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const singerAddress = await getUserAddress();

      if (!singerAddress) {
        setUserAccount(null);
        setIsLoading(false);
        return;
      }

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
