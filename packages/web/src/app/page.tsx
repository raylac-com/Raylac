'use client';
import ETHBalanceCard from '@/components/ETHBalanceCard/ETHBalanceCard';
import PageTitle from '@/components/PageTitle/PageTitle';
import StakedETHCard from '@/components/StakedETHCard/StakedETHCard';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

export default function Home() {
  const router = useRouter();
  const { isConnecting, address } = useAccount();

  const { data: stakedBalance } = trpc.getStakedBalance.useQuery(
    {
      address: address || zeroAddress,
    },
    {
      enabled: !!address,
    }
  );

  const { data: ethMultiChainBalance } = trpc.getETHBalance.useQuery(
    {
      address: address || zeroAddress,
    },
    {
      enabled: !!address,
    }
  );

  useEffect(() => {
    if (isConnecting === false && !address) {
      router.push('/start');
    }
  }, [isConnecting, router, address]);

  return (
    <div className="flex flex-col items-center">
      <PageTitle>Home</PageTitle>
      <StakedETHCard
        balanceFormatted={stakedBalance?.totalBalanceFormatted}
        balanceUsdFormatted={stakedBalance?.totalBalanceUsd}
      />
      <div className="mt-[80px]">
        <ETHBalanceCard
          balanceFormatted={ethMultiChainBalance?.totalBalanceFormatted}
          balanceUsdFormatted={ethMultiChainBalance?.totalBalanceUsd}
        />
      </div>
    </div>
  );
}
