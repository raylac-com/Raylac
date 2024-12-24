'use client';
import ConnectWalletButton from '@/components/ConnectWalletButton';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { isAddress } from 'viem';
import { useAccount } from 'wagmi';
import { SquareArrowRight } from 'lucide-react';
import { saveAddress } from '@/lib/utils';
import useEnsAddress from '@/hooks/useEnsAddress';

const ConnectWalletPage = () => {
  const router = useRouter();
  const [showAddressInput, setShowAddressInput] = useState(false);
  const [inputText, setInputText] = useState('');
  const { address } = useAccount();
  const arrowRef = useRef<HTMLDivElement>(null);

  const { data: ensAddress } = useEnsAddress(inputText);

  useEffect(() => {
    if (address) {
      saveAddress(address);
      router.push('/');
    }
  }, [router, address]);

  const onNextClick = () => {
    if (isAddress(inputText)) {
      saveAddress(inputText);
      router.push('/');
    }

    if (ensAddress) {
      saveAddress(ensAddress);
      router.push('/');
    }
  };

  const canGoNext = isAddress(inputText) || ensAddress;

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
            <div className="flex items-center justify-center gap-x-[5px]">
              <div className="w-[35px] h-[35px]"></div>
              <input
                className="w-[290px] text-left px-[23px] bg-background text-foreground cursor-pointer h-[46px] rounded-[8px] border border-border"
                placeholder="ENS or address"
                onChange={e => setInputText(e.target.value)}
              ></input>
              {canGoNext ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  ref={arrowRef}
                >
                  <SquareArrowRight
                    className="w-[35px] h-[35px] text-border stroke-[1px] cursor-pointer"
                    onClick={onNextClick}
                  />
                </motion.div>
              ) : (
                <div className="w-[35px] h-[35px]"></div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConnectWalletPage;
