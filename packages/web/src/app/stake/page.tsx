'use client';
import StakeCard from '@/components/StakeCard/StakeCard';
import { trpc } from '@/lib/trpc';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

const StakePage = () => {
  const { address } = useAccount();

  const { data: _stakedBalance } = trpc.getStakedBalance.useQuery({
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

  if (!ethMultiChainBalance) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-y-[100px] items-center justify-center mt-[32px] h-[80%] overflow-scroll">
      {ethMultiChainBalance.map((balance, i) => (
        <StakeCard
          chainId={balance.chain}
          key={i}
          balance={BigInt(balance.balance)}
          balanceFormatted={balance.balanceFormatted}
          balanceUsd={balance.balanceUsd}
        />
      ))}
    </div>
  );
};

export default StakePage;
