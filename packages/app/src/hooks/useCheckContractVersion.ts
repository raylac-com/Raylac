import { trpc } from '@/lib/trpc';
import { useEffect } from 'react';
import useTypedNavigation from './useTypedNavigation';
import { EXPECTED_CONTRACT_IMPL } from '../lib/upgrade';

const useCheckContractVersion = () => {
  const { data: stealthAccounts } = trpc.getStealthAccounts.useQuery();

  const navigation = useTypedNavigation();

  useEffect(() => {
    if (stealthAccounts) {
      const needUpgrade = stealthAccounts?.some(account => {
        return !account.upgrades.some(
          upgrade => upgrade.newImplementation === EXPECTED_CONTRACT_IMPL
        );
      });

      if (needUpgrade) {
        navigation.navigate('Upgrade');
      }
    }
  }, [stealthAccounts]);
};

export default useCheckContractVersion;
