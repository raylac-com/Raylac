'use client';
import PageTitle from '@/components/PageTitle/PageTitle';
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
    return <div></div>;
  }

  return (
    <div className="flex flex-col items-center">
      <PageTitle title="Swap" />
      <div className="flex flex-col gap-y-[100px] items-center justify-center overflow-scroll">
        {ethMultiChainBalance.balances.map((balance, i) => (
          <StakeCard
            chainId={balance.chain}
            key={i}
            balance={BigInt(balance.balance)}
            balanceFormatted={balance.balanceFormatted}
            balanceUsd={balance.balanceUsd}
          />
        ))}
      </div>
    </div>
  );
};

export default StakePage;
