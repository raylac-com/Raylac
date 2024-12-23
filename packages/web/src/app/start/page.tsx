'use client';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { motion } from 'framer-motion';
import { Hex, isAddress } from 'viem';
import { saveAddress } from '@/lib/utils';

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
  const { isConnected, address } = useAccount();
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (isConnected && address) {
      saveAddress(address as Hex);
      router.push('/');
    }
  }, [isConnected, router, address]);

  useEffect(() => {
    if (inputText && isAddress(inputText)) {
      setShowAddressInput(false);
    }
  }, [inputText, router]);

  return (
    <div className="h-[80vh] flex flex-col items-center justify-center pb-[48px] gap-y-[80px]">
      <div className="text-2lg text-center text-foreground font-bold">
        <p>See your staked ETH</p>
        <p>in one place</p>
      </div>
      <div className="flex flex-col items-center justify-center gap-y-[8px]">
        <ConnectWalletButton />
        <div className="w-full text-center text-border">or</div>
        <div className="h-[46px] flex items-center justify-center">
          {!showAddressInput ? (
            <div
              className="w-full text-center text-foreground cursor-pointer"
              onClick={() => setShowAddressInput(true)}
            >
              Enter your ETH address
            </div>
          ) : (
            <input
              className="w-[290px] text-left px-[23px] bg-background text-foreground cursor-pointer h-[46px] rounded-[8px] border border-border"
              placeholder="ENS or address"
              onChange={e => setInputText(e.target.value)}
            ></input>
          )}
        </div>{' '}
      </div>
    </div>
  );
};

export default ConnectWalletPage;
