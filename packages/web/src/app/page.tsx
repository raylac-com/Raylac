'use client';
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
      router.push('/connect');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-2xl font-bold">Staked ETH</div>
      <div className="text-lg">
        <div>
          <div>Staked</div>
        </div>
      </div>
    </div>
  );
}
