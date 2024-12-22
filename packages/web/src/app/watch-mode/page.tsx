'use client';
import { useState } from 'react';
import useEnsAddress from '@/hooks/useEnsAddress';
import { useRouter } from 'next/navigation';
import { shortenAddress } from '@/lib/utils';
import { motion } from 'framer-motion';
const StartButton = ({ onClick }: { onClick: () => void }) => {
  return (
    <motion.div
      className="cursor-pointer w-[240px] bg-tertiary rounded-[16px] px-[16px] py-[12px]"
      onClick={onClick}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <div className="text-background font-bold w-full text-center">Start</div>
    </motion.div>
  );
};

const WatchModePage = () => {
  const [inputText, setInputText] = useState('');
  const { data: ensAddress } = useEnsAddress(inputText);
  const router = useRouter();

  const onStartClick = () => {
    router.push(`/`);
  };

  return (
    <div className="flex flex-col items-start justify-center h-[60vh]">
      <div className="flex flex-col gap-y-[12px]">
        <div className="text-foreground font-bold text-lg">Watch address</div>
        <div className="flex flex-col gap-y-[12px]">
          <input
            className="w-[362px] bg-background rounded-[8px] px-[16px] py-[12px] border border-tertiary"
            placeholder="Ethereum address or ENS"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
          />
          <div className="h-[24px]">
            {ensAddress && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-foreground"
              >
                {shortenAddress(ensAddress)}
              </motion.div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-[80px]">
        <StartButton onClick={onStartClick} />
      </div>
    </div>
  );
};

export default WatchModePage;
