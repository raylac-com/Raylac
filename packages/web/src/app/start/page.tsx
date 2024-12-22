'use client';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';

const _WatchModeButton = () => {
  const router = useRouter();

  return (
    <motion.div
      className="flex items-center justify-center cursor-pointer bg-background rounded-[12px] h-[40px] w-[145px] border border-tertiary text-foreground font-bold "
      onClick={() => router.push('/watch-mode')}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      Watch Mode
    </motion.div>
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
      {/*
      <WatchModeButton />
      */}
    </div>
  );
};

export default ConnectWalletPage;
