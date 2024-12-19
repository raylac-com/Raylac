'use client';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

const ConnectWalletPage = () => {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <ConnectWalletButton />
    </div>
  );
};

export default ConnectWalletPage;
