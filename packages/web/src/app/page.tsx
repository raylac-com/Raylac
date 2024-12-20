'use client';
import ETHBalanceCard from '@/components/ETHBalanceCard/ETHBalanceCard';
import StakedETHCard from '@/components/StakedETHCard/StakedETHCard';
import { trpc } from '@/lib/trpc';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { zeroAddress } from 'viem';
import { useAccount } from 'wagmi';

export default function Home() {
  const router = useRouter();
  const { isConnected, address } = useAccount();

  const { data: _stakedBalance } = trpc.getStakedBalance.useQuery(
    {
      address: address || zeroAddress,
    },
    {
      enabled: !!address,
    }
  );

  useEffect(() => {
    if (!isConnected) {
      router.push('/start');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center mt-[32px] min-h-screen gap-y-[52px]">
      <StakedETHCard stakedBalance={BigInt(1000000000000000000)} />
      <ETHBalanceCard balance={BigInt(1000000000000000000)} />
    </div>
  );
}
