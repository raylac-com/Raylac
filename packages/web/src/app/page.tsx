'use client';
import PageTitle from '@/components/PageTitle/PageTitle';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

export default function Home() {
  const router = useRouter();
  const { isConnecting, address } = useAccount();

  useEffect(() => {
    if (isConnecting === false && !address) {
      router.push('/start');
    }
  }, [isConnecting, router, address]);

  return (
    <div className="flex flex-col items-center">
      <PageTitle>Home</PageTitle>
    </div>
  );
}
