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

  const { data: _stakedBalance, isPending: isLoadingStakedBalance } =
    trpc.getStakedBalance.useQuery(
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

  const isLoading = isLoadingStakedBalance || isConnecting;

  return (
    <div className="flex flex-col items-center">
      <PageTitle title="Home" />
      <StakedETHCard
        stakedBalance={BigInt(1000000000000000000)}
        isLoading={isLoading}
      />
      <div className="mt-[80px]">
        <ETHBalanceCard balance={BigInt(1000000000000000000)} />
      </div>
    </div>
  );
}
