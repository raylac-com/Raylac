'use client';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';

const WatchModeButton = () => {
  const router = useRouter();

  return (
    <div
      className="cursor-pointer bg-background rounded-[16px] px-[16px] py-[12px] border border-tertiary"
      onClick={() => router.push('/watch-mode')}
    >
      <div className="text-foreground font-bold">Watch Mode</div>
    </div>
  );
};

const ConnectWalletPage = () => {
  const router = useRouter();
  const { isConnected } = useAccount();

  useEffect(() => {
    if (isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-y-[16px]">
      <ConnectWalletButton />
      <WatchModeButton />
    </div>
  );
};

export default ConnectWalletPage;
