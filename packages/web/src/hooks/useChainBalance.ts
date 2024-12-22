import { zeroAddress } from 'viem';
import { trpc } from '@/lib/trpc';
import { useAccount } from 'wagmi';
import { ETH } from '@raylac/shared';

const useChainBalance = ({
  tokenId,
  chainId,
}: {
  tokenId: string;
  chainId: number;
}) => {
  const { address } = useAccount();

  const { data: stakedBalance } = trpc.getStakedBalance.useQuery({
    address: address || zeroAddress,
  });

  const { data: ethMultiChainBalance } = trpc.getETHBalance.useQuery(
    {
      address: address || zeroAddress,
    },
    {
      enabled: !!address,
    }
  );

  const balanceFormatted =
    tokenId === ETH.symbol
      ? ethMultiChainBalance?.balances.find(
          balance => balance.chain === chainId
        )?.balanceFormatted
      : stakedBalance?.balances.find(balance => balance.chain === chainId)
          ?.balanceFormatted;

  return {
    balanceFormatted,
  };
};

export default useChainBalance;
